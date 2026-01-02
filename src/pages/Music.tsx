import { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Volume2, Clock, Music as MusicIcon, Star, Disc, ArrowLeft, Loader2, Download, Check, Maximize2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import AlbumCard from '@/components/AlbumCard';
import ExpandedMusicPlayer from '@/components/ExpandedMusicPlayer';
import { useAudioStreaming } from '@/hooks/useAudioStreaming';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePlayCountTracker } from '@/hooks/usePlayCountTracker';

interface Track {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  duration: string | null;
  play_count: number | null;
  created_at: string;
  is_featured: boolean | null;
  album_id: string | null;
}

interface Album {
  id: string;
  title: string;
  album_type: string;
  cover_url: string | null;
  release_date: string | null;
  description: string | null;
  allow_download: boolean;
}

const Music = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalDuration, setTotalDuration] = useState('0:00');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [downloadingTrack, setDownloadingTrack] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Play count tracker - must be before useAudioStreaming
  const { startTracking, checkAndRecordPlay, stopTracking } = usePlayCountTracker();
  const currentTrackRef = useRef<Track | null>(null);
  currentTrackRef.current = currentTrack;

  // Use optimized audio streaming hook
  const {
    audioRef,
    isBuffering,
    play,
    pause,
    seek,
    setVolume: setAudioVolume,
    preloadTrack,
  } = useAudioStreaming({
    onTimeUpdate: (current, total) => {
      setProgress((current / total) * 100 || 0);
      setCurrentTime(formatTime(current));
      setTotalDuration(formatTime(total));
      // Track play count after 30 seconds
      if (currentTrackRef.current) {
        checkAndRecordPlay(currentTrackRef.current.id, current);
      }
    },
    onEnded: () => playNext(),
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
  });

  // Media Session API for car stereos, lock screens, etc.
  const { updatePositionState } = useMediaSession(
    currentTrack ? {
      title: currentTrack.title,
      artist: 'The General Da Jamaican Boy',
      album: 'T.G.D.J.B Music',
      artwork: currentTrack.thumbnail_url || undefined,
    } : null,
    isPlaying,
    {
      onPlay: () => play(),
      onPause: () => pause(),
      onNext: () => playNext(),
      onPrevious: () => playPrev(),
      onSeek: (time) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time;
        }
      },
    }
  );

  // Update position state for lock screen seek bar
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const audio = audioRef.current;
      const handleTimeUpdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          updatePositionState(audio.currentTime, audio.duration);
        }
      };
      audio.addEventListener('timeupdate', handleTimeUpdate);
      return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [currentTrack, updatePositionState]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setAudioVolume(volume / 100);
  }, [volume, setAudioVolume]);

  // Preload next track
  useEffect(() => {
    if (currentTrack && tracks.length > 1) {
      const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
      const nextIndex = (currentIndex + 1) % tracks.length;
      if (tracks[nextIndex]) {
        preloadTrack(tracks[nextIndex].url);
      }
    }
  }, [currentTrack, tracks, preloadTrack]);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        play().catch(console.error);
      }
    }
  }, [currentTrack]);

  const fetchData = async () => {
    const [tracksRes, albumsRes] = await Promise.all([
      supabase
        .from('media')
        .select('*')
        .eq('media_type', 'track')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('albums')
        .select('*')
        .eq('is_published', true)
        .order('release_date', { ascending: false }),
    ]);

    if (tracksRes.data) setTracks(tracksRes.data);
    if (albumsRes.data) setAlbums(albumsRes.data);
    setLoading(false);
  };

  const fetchTracks = async () => {
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('media_type', 'track')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (data) setTracks(data);
  };

  const playTrack = async (track: Track, e?: React.MouseEvent, expandOnPlay = false) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (currentTrack?.id === track.id) {
      if (expandOnPlay) {
        setIsExpanded(true);
      } else {
        togglePlay();
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      if (expandOnPlay) {
        setIsExpanded(true);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExpandPlayer = () => {
    setIsExpanded(true);
  };

  const togglePlay = async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && audioRef.current.duration) {
      const time = (value[0] / 100) * audioRef.current.duration;
      seek(time);
      setProgress(value[0]);
    }
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex]);
  };

  const playPrev = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIndex]);
  };

  const featuredTracks = tracks.filter(t => t.is_featured);
  const allTracks = selectedAlbum 
    ? tracks.filter(t => t.album_id === selectedAlbum.id)
    : tracks;

  const getAlbumTrackCount = (albumId: string) => tracks.filter(t => t.album_id === albumId).length;

  const canDownloadTrack = (track: Track): boolean => {
    if (!track.album_id) return false;
    const album = albums.find(a => a.id === track.album_id);
    return album?.allow_download || false;
  };

  const handleDownload = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!canDownloadTrack(track)) {
      return;
    }

    setDownloadingTrack(track.id);
    try {
      const response = await fetch(track.url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${track.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingTrack(null);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      <main className="pt-20 pb-32">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">
              MUSIC LIBRARY
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stream the latest tracks and albums from The General Da Jamaican Boy
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-20">
              <MusicIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Tracks Yet</h3>
              <p className="text-muted-foreground">New music coming soon!</p>
            </div>
          ) : (
            <>
              {/* Albums Section */}
              {albums.length > 0 && !selectedAlbum && (
                <div className="mb-12">
                  <h2 className="font-display text-3xl text-foreground mb-6 flex items-center gap-2">
                    <Disc className="w-8 h-8 text-primary" />
                    Albums & Mixtapes
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {albums.map((album) => (
                      <AlbumCard
                        key={album.id}
                        id={album.id}
                        title={album.title}
                        albumType={album.album_type}
                        coverUrl={album.cover_url}
                        releaseDate={album.release_date}
                        trackCount={getAlbumTrackCount(album.id)}
                        onClick={() => setSelectedAlbum(album)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Album View */}
              {selectedAlbum && (
                <div className="mb-12">
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedAlbum(null)} 
                    className="mb-4 gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to All Music
                  </Button>
                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="w-48 h-48 rounded-xl overflow-hidden flex-shrink-0">
                      {selectedAlbum.cover_url ? (
                        <img
                          src={selectedAlbum.cover_url}
                          alt={selectedAlbum.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rasta-red via-primary to-rasta-green">
                          <Disc className="w-20 h-20 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-end">
                      <span className="text-sm text-muted-foreground uppercase">
                        {selectedAlbum.album_type}
                      </span>
                      <h2 className="font-display text-4xl md:text-5xl text-foreground mb-2">
                        {selectedAlbum.title}
                      </h2>
                      <p className="text-muted-foreground">
                        The General Da Jamaican Boy • {allTracks.length} tracks
                        {selectedAlbum.release_date && ` • ${new Date(selectedAlbum.release_date).getFullYear()}`}
                      </p>
                      {selectedAlbum.description && (
                        <p className="text-muted-foreground mt-2 text-sm max-w-xl">
                          {selectedAlbum.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Featured Tracks */}
              {featuredTracks.length > 0 && !selectedAlbum && (
                <div className="mb-12">
                  <h2 className="font-display text-3xl text-foreground mb-6 flex items-center gap-2">
                    <Star className="w-8 h-8 text-primary" />
                    Featured Tracks
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {featuredTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={(e) => playTrack(track, e)}
                        type="button"
                        className={`group text-left rounded-xl overflow-hidden border transition-all hover:scale-105 cursor-pointer ${
                          currentTrack?.id === track.id 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="relative aspect-square bg-card">
                          {track.thumbnail_url ? (
                            <img
                              src={track.thumbnail_url}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rasta-red via-primary to-rasta-green">
                              <MusicIcon className="w-16 h-16 text-primary-foreground" />
                            </div>
                          )}
                          {/* Gradient overlay with song details */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
                            <h3 className="font-bold text-white text-sm md:text-base line-clamp-2 drop-shadow-lg">{track.title}</h3>
                            <p className="text-white/80 text-xs md:text-sm mt-1 drop-shadow-md">The General Da Jamaican Boy</p>
                            {track.duration && (
                              <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {track.duration}
                              </p>
                            )}
                          </div>
                          {/* Play button overlay on hover */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                              {currentTrack?.id === track.id && isPlaying ? (
                                <Pause className="w-6 h-6 text-primary-foreground" />
                              ) : (
                                <Play className="w-6 h-6 text-primary-foreground ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Tracks / Album Tracks */}
              <div>
                <h2 className="font-display text-3xl text-foreground mb-6">
                  {selectedAlbum ? 'Tracklist' : 'All Tracks'}
                </h2>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  {allTracks.map((track, index) => (
                    <button
                      key={track.id}
                      onClick={(e) => playTrack(track, e)}
                      type="button"
                      className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        currentTrack?.id === track.id ? 'bg-primary/10' : ''
                      } ${index !== allTracks.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <span className="w-8 text-muted-foreground text-sm">{index + 1}</span>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {track.thumbnail_url ? (
                          <img
                            src={track.thumbnail_url}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rasta-red to-rasta-green">
                            <MusicIcon className="w-6 h-6 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="font-medium text-foreground truncate">{track.title}</h3>
                        <p className="text-muted-foreground text-sm">The General Da Jamaican Boy</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {track.is_featured && (
                          <Star className="w-4 h-4 text-primary fill-primary" />
                        )}
                        <span className="text-muted-foreground text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {track.duration || '—'}
                        </span>
                        {canDownloadTrack(track) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={(e) => handleDownload(track, e)}
                            disabled={downloadingTrack === track.id}
                          >
                            {downloadingTrack === track.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                          {currentTrack?.id === track.id && isPlaying ? (
                            <Pause className="w-5 h-5 text-primary" />
                          ) : (
                            <Play className="w-5 h-5 text-primary ml-0.5" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Audio Player - Compact for mobile */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border py-2 px-2 sm:py-3 sm:px-4 z-50">
          <audio
            ref={audioRef}
            preload="auto"
            crossOrigin="anonymous"
          />
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4">
            {/* Track Info - More compact on mobile */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0 max-w-[35%] sm:max-w-none sm:flex-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded overflow-hidden bg-muted flex-shrink-0 relative">
                {isBuffering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="w-3 h-3 sm:w-5 sm:h-5 animate-spin text-primary" />
                  </div>
                )}
                {currentTrack.thumbnail_url ? (
                  <img
                    src={currentTrack.thumbnail_url}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-rasta">
                    <MusicIcon className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0 hidden xs:block sm:block">
                <h4 className="font-medium text-foreground truncate text-xs sm:text-base leading-tight">{currentTrack.title}</h4>
                <p className="text-muted-foreground text-[10px] sm:text-sm truncate">The General</p>
              </div>
            </div>

            {/* Controls - Tighter on mobile */}
            <div className="flex flex-col items-center gap-0.5 sm:gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-4">
                <Button variant="ghost" size="icon" onClick={playPrev} className="w-7 h-7 sm:w-10 sm:h-10">
                  <SkipBack className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </Button>
                <Button 
                  variant="default" 
                  size="icon" 
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-full"
                  onClick={togglePlay}
                  disabled={isBuffering && !isPlaying}
                >
                  {isBuffering && !isPlaying ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={playNext} className="w-7 h-7 sm:w-10 sm:h-10">
                  <SkipForward className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </Button>
              </div>
              <div className="hidden sm:flex items-center gap-2 w-full max-w-md">
                <span className="text-xs text-muted-foreground w-10 text-right">{currentTime}</span>
                <Slider
                  value={[progress]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10">{totalDuration}</span>
              </div>
            </div>

            {/* Volume & Expand */}
            <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={(v) => setVolume(v[0])}
                max={100}
                step={1}
                className="w-24"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleExpandPlayer}
                title="Expand player"
                className="ml-2"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Music Player */}
      {isExpanded && currentTrack && (
        <ExpandedMusicPlayer
          track={{
            id: currentTrack.id,
            title: currentTrack.title,
            artist: 'The General Da Jamaican Boy',
            coverUrl: currentTrack.thumbnail_url || '',
            duration: currentTrack.duration || '0:00',
            audioUrl: currentTrack.url,
          }}
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
          onNext={playNext}
          onPrevious={playPrev}
          onClose={() => setIsExpanded(false)}
          audioRef={audioRef}
        />
      )}

      <Footer />
    </div>
  );
};

export default Music;
