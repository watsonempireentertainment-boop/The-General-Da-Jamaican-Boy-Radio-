import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Maximize, Minimize, Radio as RadioIcon, Shuffle, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioShareEmbed from '@/components/RadioShareEmbed';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/tgdjb-logo-optimized.webp';
import { useAudioStreaming } from '@/hooks/useAudioStreaming';
import { useFavorites } from '@/hooks/useFavorites';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePlayCountTracker } from '@/hooks/usePlayCountTracker';

interface Track {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  duration: string | null;
}

const Radio = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [volume, setVolume] = useState(30); // Start at low volume for auto-play
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShuffled, setIsShuffled] = useState(true);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const [playHistory, setPlayHistory] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleFavorite, isFavorite, isLoggedIn } = useFavorites();
  
  // Play count tracker
  const { checkAndRecordPlay } = usePlayCountTracker();
  const currentTrackRef = useRef<Track | null>(null);


  // Use optimized audio streaming hook
  const {
    audioRef,
    isBuffering,
    bufferProgress,
    play,
    pause,
    seek,
    setVolume: setAudioVolume,
    preloadTrack,
  } = useAudioStreaming({
    onTimeUpdate: (current, total) => {
      setProgress((current / total) * 100 || 0);
      setCurrentTime(formatTime(current));
      setDuration(formatTime(total));
      // Track play count after 30 seconds
      if (currentTrackRef.current) {
        checkAndRecordPlay(currentTrackRef.current.id, current);
      }
    },
    onEnded: () => {
      const currentTrack = getCurrentTrack();
      if (currentTrack) {
        setPlayHistory(prev => [...prev.slice(-9), currentTrack.title]);
      }
      handleNext();
    },
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
  });

  // Get current track for media session
  const getCurrentTrack = useCallback(() => {
    if (tracks.length === 0) return null;
    const trackIdx = isShuffled ? shuffledOrder[currentTrackIndex] : currentTrackIndex;
    return tracks[trackIdx] || tracks[0];
  }, [tracks, isShuffled, shuffledOrder, currentTrackIndex]);

  const currentTrackForSession = getCurrentTrack();
  currentTrackRef.current = currentTrackForSession;

  // Media Session API for car stereos, lock screens, etc.
  const { updatePositionState } = useMediaSession(
    currentTrackForSession ? {
      title: currentTrackForSession.title,
      artist: 'The General Da Jamaican Boy',
      album: 'T.G.D.J.B Radio',
      artwork: currentTrackForSession.thumbnail_url || undefined,
    } : null,
    isPlaying,
    {
      onPlay: () => play(),
      onPause: () => pause(),
      onNext: () => handleNext(),
      onSeek: (time) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time;
        }
      },
    }
  );

  // Update position state for lock screen seek bar
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const handleTimeUpdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          updatePositionState(audio.currentTime, audio.duration);
        }
      };
      audio.addEventListener('timeupdate', handleTimeUpdate);
      return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [updatePositionState]);

  useEffect(() => {
    fetchTracks();
  }, []);

  // Shuffle tracks when loaded
  useEffect(() => {
    if (tracks.length > 0 && shuffledOrder.length === 0) {
      shuffleTracks();
    }
  }, [tracks]);

  // Auto-play ONCE when shuffledOrder is first set
  const hasAutoPlayedRef = useRef(false);
  useEffect(() => {
    if (tracks.length > 0 && shuffledOrder.length > 0 && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      const trackIdx = shuffledOrder[0];
      if (tracks[trackIdx] && audioRef.current) {
        audioRef.current.src = tracks[trackIdx].url;
        // Wait for canplay event before trying to play
        const handleCanPlay = () => {
          play().catch((err) => {
            console.log('Auto-play blocked by browser:', err);
          });
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        audioRef.current.addEventListener('canplay', handleCanPlay);
        audioRef.current.load();
      }
    }
  }, [shuffledOrder, tracks]);

  // Preload next track when current track changes
  useEffect(() => {
    if (tracks.length > 0 && shuffledOrder.length > 0) {
      const nextIdx = (currentTrackIndex + 1) % tracks.length;
      const nextTrackIdx = isShuffled ? shuffledOrder[nextIdx] : nextIdx;
      if (tracks[nextTrackIdx]) {
        preloadTrack(tracks[nextTrackIdx].url);
      }
    }
  }, [currentTrackIndex, tracks, shuffledOrder, isShuffled, preloadTrack]);

  // Update audio volume
  useEffect(() => {
    setAudioVolume(isMuted ? 0 : volume / 100);
  }, [volume, isMuted, setAudioVolume]);

  // Load and play track when index changes (after initial auto-play)
  const prevTrackIndexRef = useRef(currentTrackIndex);
  useEffect(() => {
    if (prevTrackIndexRef.current !== currentTrackIndex && audioRef.current && tracks.length > 0 && shuffledOrder.length > 0) {
      prevTrackIndexRef.current = currentTrackIndex;
      const trackIdx = isShuffled ? shuffledOrder[currentTrackIndex] : currentTrackIndex;
      if (trackIdx !== undefined && tracks[trackIdx]) {
        audioRef.current.src = tracks[trackIdx].url;
        audioRef.current.load();
        play().catch(console.error);
      }
    }
  }, [currentTrackIndex, shuffledOrder, isShuffled, tracks]);

  const fetchTracks = async () => {
    const { data } = await supabase
      .from('media')
      .select('id, title, url, thumbnail_url, duration')
      .eq('media_type', 'track')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setTracks(data);
    }
  };

  const shuffleTracks = useCallback(() => {
    const indices = Array.from({ length: tracks.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledOrder(indices);
    setCurrentTrackIndex(0);
  }, [tracks.length]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && audioRef.current.duration) {
      const time = (value[0] / 100) * audioRef.current.duration;
      seek(time);
      setProgress(value[0]);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getUpcomingTracks = () => {
    if (tracks.length === 0) return [];
    const upcoming: Track[] = [];
    for (let i = 1; i <= 5; i++) {
      const idx = (currentTrackIndex + i) % tracks.length;
      const trackIdx = isShuffled ? shuffledOrder[idx] : idx;
      if (tracks[trackIdx]) {
        upcoming.push(tracks[trackIdx]);
      }
    }
    return upcoming;
  };

  const currentTrack = currentTrackForSession;
  const upcomingTracks = getUpcomingTracks();
  const isCurrentTrackLiked = currentTrack ? isFavorite(currentTrack.id) : false;

  const handleLikeCurrentTrack = async () => {
    if (!currentTrack) return;
    await toggleFavorite(currentTrack.id, currentTrack.title);
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-background overflow-x-hidden ${isFullscreen ? 'fullscreen-radio' : ''}`}
    >
      {!isFullscreen && <Navigation />}
      
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
      />

      <main className={`${isFullscreen ? 'h-screen flex items-center justify-center' : 'pt-24 pb-20'}`}>
        <div className={`${isFullscreen ? 'w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background via-card to-background' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          
          {/* Radio Header */}
          <div className={`text-center ${isFullscreen ? 'mb-8' : 'mb-12'}`}>
            <div className="inline-flex items-center gap-3 bg-rasta-red/20 border border-rasta-red rounded-full px-6 py-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${isBuffering ? 'bg-rasta-gold animate-pulse' : 'bg-rasta-red animate-pulse'}`} />
              <span className="font-semibold text-rasta-red">
                {isBuffering ? 'BUFFERING...' : 'LIVE RADIO'}
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-foreground mb-2">
              T.G.D.J.B RADIO
            </h1>
            <p className="text-muted-foreground text-lg">
              Non-stop reggae & dancehall vibes from The General Da Jamaican Boy
            </p>
            {/* Buffer progress indicator */}
            {bufferProgress > 0 && bufferProgress < 100 && (
              <div className="mt-2 w-32 mx-auto h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/50 transition-all duration-300"
                  style={{ width: `${bufferProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Main Player */}
          <div className={`${isFullscreen ? 'w-full max-w-4xl' : ''}`}>
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
                {/* Album Art */}
                <div className="relative flex-shrink-0">
                  <div 
                    className={`${isFullscreen ? 'w-64 sm:w-80 h-64 sm:h-80' : 'w-48 sm:w-64 h-48 sm:h-64'} rounded-full overflow-hidden shadow-2xl border-4 border-primary/30`}
                    style={{ 
                      animation: isPlaying ? 'spin 8s linear infinite' : 'none'
                    }}
                  >
                    <img 
                      src={currentTrack?.thumbnail_url || logoImage} 
                      alt={currentTrack?.title || 'Radio'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Vinyl center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-background rounded-full border-4 border-muted flex items-center justify-center">
                      <RadioIcon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Track Info & Controls */}
                <div className="flex-1 text-center lg:text-left w-full min-w-0">
                  <p className="text-primary font-semibold mb-2 text-sm sm:text-base">NOW PLAYING</p>
                  <h2 className={`font-display ${isFullscreen ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'} text-foreground mb-1 break-words`}>
                    {currentTrack?.title || 'Loading...'}
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-lg mb-4 sm:mb-6">
                    The General Da Jamaican Boy
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full mb-4 sm:mb-6">
                    <Slider 
                      value={[progress]} 
                      onValueChange={handleSeek}
                      max={100}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mt-2">
                      <span>{currentTime}</span>
                      <span>{duration}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setIsShuffled(!isShuffled);
                        if (!isShuffled) shuffleTracks();
                      }}
                      className={`w-10 h-10 ${isShuffled ? 'text-primary' : ''}`}
                    >
                      <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    
                    <Button 
                      variant="gold" 
                      size="lg"
                      onClick={handlePlayPause}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full"
                      disabled={isBuffering && !isPlaying}
                    >
                      {isBuffering && !isPlaying ? (
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-6 h-6 sm:w-8 sm:h-8" />
                      ) : (
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1" />
                      )}
                    </Button>
                    
                    <Button variant="ghost" size="icon" onClick={handleNext} className="w-10 h-10">
                      <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>

                    {/* Like Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLikeCurrentTrack}
                      className={`w-10 h-10 ${isCurrentTrackLiked ? 'text-rasta-red' : ''}`}
                      title={isCurrentTrackLiked ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-5 h-5 ${isCurrentTrackLiked ? 'fill-current' : ''}`} />
                    </Button>

                    <div className="flex items-center gap-2 ml-2 sm:ml-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-10 h-10"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </Button>
                      <Slider 
                        value={[isMuted ? 0 : volume]} 
                        onValueChange={(val) => { setVolume(val[0]); setIsMuted(false); }}
                        max={100}
                        step={1}
                        className="w-16 sm:w-24"
                      />
                    </div>

                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={toggleFullscreen}
                      className="ml-auto w-10 h-10"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Up Next & History - Only show when not fullscreen */}
          {!isFullscreen && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              {/* Up Next */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                  <SkipForward className="w-5 h-5 text-primary" />
                  UP NEXT
                </h3>
                <div className="space-y-3">
                  {upcomingTracks.map((track, index) => (
                    <div key={`${track.id}-${index}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground text-sm w-6">{index + 1}</span>
                      <img 
                        src={track.thumbnail_url || logoImage} 
                        alt={track.title} 
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{track.title}</p>
                        <p className="text-sm text-muted-foreground">The General Da Jamaican Boy</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recently Played */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                  <RadioIcon className="w-5 h-5 text-primary" />
                  RECENTLY PLAYED
                </h3>
                {playHistory.length > 0 ? (
                  <div className="space-y-2">
                    {[...playHistory].reverse().map((title, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 text-muted-foreground">
                        <span className="text-sm w-6">{index + 1}</span>
                        <p className="truncate">{title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Start listening to build your history
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Radio Info & Share */}
          {!isFullscreen && (
            <div className="mt-12 text-center space-y-6">
              <div className="inline-flex items-center gap-4 bg-gradient-rasta p-px rounded-xl">
                <div className="bg-background rounded-xl px-8 py-4">
                  <p className="text-foreground font-semibold">
                    🎵 24/7 Non-Stop Reggae & Dancehall Music
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Streaming authentic vibes straight from Jamaica
                  </p>
                </div>
              </div>
              
              {/* Share & Embed Radio */}
              <div className="flex justify-center">
                <RadioShareEmbed />
              </div>
            </div>
          )}
        </div>
      </main>

      {!isFullscreen && <Footer />}

      <style>{`
        .fullscreen-radio {
          background: linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 50%, hsl(var(--background)) 100%);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Radio;
