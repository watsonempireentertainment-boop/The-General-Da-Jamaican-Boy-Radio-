import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, ListPlus, Code2, Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useFavorites } from '@/hooks/useFavorites';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import EmbedCodeModal from '@/components/EmbedCodeModal';
import ExpandedMusicPlayer from '@/components/ExpandedMusicPlayer';
import { supabase } from '@/integrations/supabase/client';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: string;
  audioUrl?: string;
}

interface MusicPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const MusicPlayer = ({ currentTrack, isPlaying, onPlayPause, onNext, onPrevious }: MusicPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { toggleFavorite, isFavorite, isLoggedIn } = useFavorites();
  const isLiked = isFavorite(currentTrack.id);

  // Get the correct audio URL
  const getAudioUrl = (url?: string) => {
    if (!url) return '';
    // If it's a relative path, it's a local file
    if (url.startsWith('/')) return url;
    // If it's a Supabase storage URL, return as-is
    if (url.includes('supabase.co')) return url;
    // External URLs (YouTube, SoundCloud) - these won't play directly
    return url;
  };

  const audioUrl = getAudioUrl(currentTrack.audioUrl);

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    setIsLoading(true);
    audio.src = audioUrl;
    audio.load();

    if (isPlaying) {
      audio.play().catch(console.error);
    }
  }, [audioUrl, currentTrack.id]);

  // Handle play/pause changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying && audio.paused) {
      audio.play().catch(console.error);
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, audioUrl]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    // Increment play count
    supabase.rpc('increment_play_count', { media_id: currentTrack.id }).then(() => {});
  };

  const handleEnded = () => {
    onNext();
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setProgress(value[0]);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLike = async () => {
    await toggleFavorite(currentTrack.id, currentTrack.title);
  };

  const handleAddToPlaylist = () => {
    if (!isLoggedIn) {
      import('sonner').then(({ toast }) => {
        toast.error('Please sign in to create playlists');
      });
      return;
    }
    setPlaylistModalOpen(true);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    // Scroll to top when expanding
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isExpanded) {
    return (
      <ExpandedMusicPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onPrevious={onPrevious}
        onClose={() => setIsExpanded(false)}
      />
    );
  }

  return (
    <>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        preload="auto"
      />
      
      <div className="w-full bg-card/80 backdrop-blur-xl border-t border-border p-4 fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Track Info - Clickable to expand */}
          <div 
            className="flex items-center gap-3 min-w-[200px] cursor-pointer group"
            onClick={handleExpand}
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden shadow-card animate-spin-slow group-hover:scale-105 transition-transform" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
              <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">{currentTrack.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Like, Playlist, Embed & Expand Buttons */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLike}
              className={isLiked ? 'text-rasta-red' : ''}
              title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleAddToPlaylist}
              title="Add to playlist"
            >
              <ListPlus className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setEmbedModalOpen(true)}
              title="Get embed code for blogs"
            >
              <Code2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleExpand}
              title="Expand player"
              className="hidden sm:flex"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onPrevious}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button 
                variant="default" 
                size="icon" 
                onClick={onPlayPause}
                className="w-12 h-12 rounded-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onNext}>
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
              <Slider 
                value={[progress]} 
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 min-w-[150px]">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Slider 
              value={[isMuted ? 0 : volume]} 
              onValueChange={(val) => { setVolume(val[0]); setIsMuted(false); }}
              max={100}
              step={1}
              className="w-24"
            />
          </div>
        </div>
      </div>

      <AddToPlaylistModal
        open={playlistModalOpen}
        onOpenChange={setPlaylistModalOpen}
        trackId={currentTrack.id}
        trackTitle={currentTrack.title}
      />

      <EmbedCodeModal
        open={embedModalOpen}
        onOpenChange={setEmbedModalOpen}
        trackId={currentTrack.id}
        trackTitle={currentTrack.title}
      />
    </>
  );
};

export default MusicPlayer;