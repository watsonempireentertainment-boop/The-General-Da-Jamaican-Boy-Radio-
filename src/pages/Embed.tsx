import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink, ChevronLeft, ChevronRight, Music2, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';

interface Track {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  duration: string | null;
}

// Track which tracks have been logged in this session to avoid duplicates
const loggedPlays = new Set<string>();

const trackEmbedPlay = async (trackId: string, embedType: string) => {
  if (loggedPlays.has(trackId)) return;
  
  try {
    await supabase.from('embed_analytics').insert({
      track_id: trackId,
      embed_type: embedType,
      referrer_url: document.referrer || null,
      user_agent: navigator.userAgent || null,
    });
    loggedPlays.add(trackId);
  } catch (error) {
    console.error('Failed to track embed play:', error);
  }
};

const Embed = () => {
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get('track');
  const albumId = searchParams.get('album');
  const playlistMode = searchParams.get('playlist') === 'true';
  const radioMode = searchParams.get('radio') === 'true';
  const theme = searchParams.get('theme') || 'dark';
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(radioMode ? 30 : 80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTracks();
  }, [trackId, albumId, radioMode]);

  const fetchTracks = async () => {
    setIsLoading(true);
    
    if (radioMode) {
      // Radio mode: fetch all tracks for shuffled continuous playback
      const { data } = await supabase
        .from('media')
        .select('id, title, url, thumbnail_url, duration')
        .eq('media_type', 'track')
        .order('created_at', { ascending: false });
      
      if (data) {
        // Shuffle tracks for radio experience
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setTracks(shuffled);
      }
    } else if (trackId) {
      const { data } = await supabase
        .from('media')
        .select('id, title, url, thumbnail_url, duration')
        .eq('id', trackId)
        .eq('media_type', 'track')
        .single();
      
      if (data) setTracks([data]);
    } else if (albumId) {
      const { data } = await supabase
        .from('media')
        .select('id, title, url, thumbnail_url, duration')
        .eq('album_id', albumId)
        .eq('media_type', 'track')
        .order('created_at', { ascending: true });
      
      if (data) setTracks(data);
    } else {
      const { data } = await supabase
        .from('media')
        .select('id, title, url, thumbnail_url, duration')
        .eq('media_type', 'track')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setTracks(data);
    }
    
    setIsLoading(false);
  };

  const currentTrack = tracks[currentIndex];
  const embedType = radioMode ? 'radio' : playlistMode ? 'playlist' : trackId ? 'track' : albumId ? 'album' : 'featured';

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.volume = isMuted ? 0 : volume / 100;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
      trackEmbedPlay(currentTrack.id, embedType);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTrack, embedType]);

  const playTrack = (index: number) => {
    setCurrentIndex(index);
    setCarouselIndex(index);
    setIsPlaying(true);
  };

  const playNext = () => {
    if (tracks.length > 1) {
      const nextIndex = (currentIndex + 1) % tracks.length;
      setCurrentIndex(nextIndex);
      setCarouselIndex(nextIndex);
      setIsPlaying(true);
    }
  };

  const playPrev = () => {
    if (tracks.length > 1) {
      const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      setCurrentIndex(prevIndex);
      setCarouselIndex(prevIndex);
      setIsPlaying(true);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const itemsPerView = 3;
    if (direction === 'left') {
      setCarouselIndex(Math.max(0, carouselIndex - itemsPerView));
    } else {
      setCarouselIndex(Math.min(tracks.length - itemsPerView, carouselIndex + itemsPerView));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const handleEnded = () => {
    if (tracks.length > 1) {
      playNext();
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openFullSite = () => {
    const url = trackId 
      ? `${window.location.origin}/music?track=${trackId}`
      : `${window.location.origin}/music`;
    window.open(url, '_blank');
  };

  // Theme classes
  const bgColor = theme === 'light' ? 'bg-white' : 'bg-zinc-900';
  const textColor = theme === 'light' ? 'text-zinc-900' : 'text-white';
  const mutedColor = theme === 'light' ? 'text-zinc-500' : 'text-zinc-400';
  const borderColor = theme === 'light' ? 'border-zinc-200' : 'border-zinc-700';
  const cardBg = theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-800';
  const hoverBg = theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-700';

  if (isLoading) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${bgColor}`}>
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${bgColor} ${textColor}`}>
        <p>Track not found</p>
      </div>
    );
  }

  // Radio Embed Mode - Compact live radio player
  if (radioMode) {
    return (
      <div className={`h-screen w-screen ${bgColor} flex items-center justify-center p-2`}>
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />

        <div className={`w-full max-w-md flex items-center gap-3 p-3 rounded-xl border ${borderColor} ${cardBg}`}>
          {/* Live Indicator */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <img 
                  src={currentTrack.thumbnail_url || '/placeholder.svg'} 
                  alt="Radio"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Live dot */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">🔴 LIVE</span>
            </div>
            <p className={`text-sm font-medium truncate ${textColor}`}>
              {currentTrack.title}
            </p>
            <p className={`text-xs ${mutedColor}`}>The General Da Jamaican Boy</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              className="h-10 w-10 rounded-full bg-gradient-to-r from-green-600 via-amber-500 to-red-600 hover:opacity-90"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 ml-0.5 text-white" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${mutedColor}`}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${mutedColor}`}
              onClick={openFullSite}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Playlist Carousel Mode
  if (playlistMode && tracks.length > 1) {
    return (
      <div className={`h-screen w-screen ${bgColor} flex flex-col overflow-hidden`}>
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />

        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${borderColor}`}>
          <div className="flex items-center gap-2">
            <ListMusic className={`w-4 h-4 ${mutedColor}`} />
            <span className={`text-xs font-medium ${mutedColor}`}>
              {tracks.length} tracks
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${mutedColor}`}
            onClick={openFullSite}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>

        {/* Carousel */}
        <div className="flex-1 relative px-2 py-3 overflow-hidden">
          {/* Left Arrow */}
          {carouselIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 ${cardBg} ${textColor} shadow-lg`}
              onClick={() => scrollCarousel('left')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}

          {/* Track Cards */}
          <div 
            ref={carouselRef}
            className="flex gap-2 transition-transform duration-300 ease-out h-full"
            style={{ transform: `translateX(-${carouselIndex * (100 / 3)}%)` }}
          >
            {tracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => playTrack(index)}
                className={`flex-shrink-0 w-[calc(33.333%-8px)] cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                  index === currentIndex 
                    ? 'ring-2 ring-amber-500 scale-[1.02]' 
                    : `${hoverBg} opacity-80 hover:opacity-100`
                } ${cardBg}`}
              >
                <div className="aspect-square relative">
                  <img 
                    src={track.thumbnail_url || '/placeholder.svg'} 
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  {index === currentIndex && isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-4 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-4 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-4 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  {index !== currentIndex && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className={`text-[10px] font-medium truncate ${index === currentIndex ? textColor : mutedColor}`}>
                    {track.title}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          {carouselIndex < tracks.length - 3 && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 ${cardBg} ${textColor} shadow-lg`}
              onClick={() => scrollCarousel('right')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Player Controls */}
        <div className={`px-3 py-2 border-t ${borderColor}`}>
          <div className="flex items-center gap-3">
            {/* Current Track Info */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded overflow-hidden flex-shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <img 
                  src={currentTrack.thumbnail_url || '/placeholder.svg'} 
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${textColor}`}>{currentTrack.title}</p>
                <p className={`text-[10px] ${mutedColor}`}>The General</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-7 w-7 ${mutedColor}`}
                onClick={playPrev}
              >
                <SkipBack className="w-3 h-3" />
              </Button>
              <Button 
                size="icon" 
                className="h-8 w-8 rounded-full bg-gradient-to-r from-green-600 via-amber-500 to-red-600"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 ml-0.5 text-white" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-7 w-7 ${mutedColor}`}
                onClick={playNext}
              >
                <SkipForward className="w-3 h-3" />
              </Button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 flex-1">
              <Slider 
                value={[progress]} 
                onValueChange={handleSeek}
                max={duration || 100}
                step={1}
                className="flex-1"
              />
              <span className={`text-[10px] w-8 ${mutedColor}`}>
                {formatTime(duration - progress)}
              </span>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className={`flex items-center justify-center py-1.5 border-t ${borderColor}`}>
          <a 
            href="https://generalvibes.lovable.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`text-[9px] ${mutedColor} hover:text-amber-500 transition-colors`}
          >
            🇯🇲 The General Da Jamaican Boy
          </a>
        </div>
      </div>
    );
  }

  // Standard Player Mode
  return (
    <div className={`h-screen w-screen ${bgColor} p-3 flex flex-col`}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />
      
      <div className="flex items-center gap-3 flex-1 min-h-0">
        {/* Album Art */}
        <div className="relative flex-shrink-0">
          <div 
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border ${borderColor} ${isPlaying ? 'animate-spin-slow' : ''}`}
            style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
          >
            <img 
              src={currentTrack.thumbnail_url || '/placeholder.svg'} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Track Info & Controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`font-semibold text-sm truncate ${textColor}`}>
                {currentTrack.title}
              </h3>
              <p className={`text-xs truncate ${mutedColor}`}>
                The General Da Jamaican Boy
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className={`flex-shrink-0 h-7 w-7 ${mutedColor} hover:${textColor}`}
              onClick={openFullSite}
              title="Open on generalvibes.lovable.app"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {tracks.length > 1 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${mutedColor}`}
                onClick={playPrev}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
            )}
            
            <Button 
              variant="default" 
              size="icon" 
              className="h-9 w-9 rounded-full bg-gradient-to-r from-green-600 via-amber-500 to-red-600 hover:opacity-90"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 ml-0.5 text-white" />}
            </Button>
            
            {tracks.length > 1 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${mutedColor}`}
                onClick={playNext}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            )}

            {/* Progress */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className={`text-[10px] w-8 text-right ${mutedColor}`}>
                {formatTime(progress)}
              </span>
              <Slider 
                value={[progress]} 
                onValueChange={handleSeek}
                max={duration || 100}
                step={1}
                className="flex-1"
              />
              <span className={`text-[10px] w-8 ${mutedColor}`}>
                {formatTime(duration)}
              </span>
            </div>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className={`h-7 w-7 ${mutedColor}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </Button>
              <Slider 
                value={[isMuted ? 0 : volume]} 
                onValueChange={(val) => { setVolume(val[0]); setIsMuted(false); }}
                max={100}
                step={1}
                className="w-16"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className={`flex items-center justify-center pt-2 border-t ${borderColor} mt-2`}>
        <a 
          href="https://generalvibes.lovable.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`text-[10px] ${mutedColor} hover:text-amber-500 transition-colors flex items-center gap-1`}
        >
          🇯🇲 Powered by The General Da Jamaican Boy
        </a>
      </div>
    </div>
  );
};

export default Embed;
