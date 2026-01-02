import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, ListPlus, Share2, ChevronDown, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useFavorites } from '@/hooks/useFavorites';
import { useShareSite } from '@/hooks/useShareSite';
import { supabase } from '@/integrations/supabase/client';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import { toast } from 'sonner';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: string;
  audioUrl?: string;
  description?: string;
  play_count?: number;
  created_at?: string;
  album_title?: string;
}

interface ExpandedMusicPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  audioRef?: React.RefObject<HTMLAudioElement>;
}

const ExpandedMusicPlayer = ({
  track,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onClose,
  audioRef: externalAudioRef
}: ExpandedMusicPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalDuration, setTotalDuration] = useState(track.duration);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [trackDetails, setTrackDetails] = useState<{
    description?: string;
    play_count?: number;
    created_at?: string;
    album_title?: string;
  } | null>(null);

  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const audioRef = externalAudioRef || internalAudioRef;

  const { toggleFavorite, isFavorite, isLoggedIn } = useFavorites();
  const { shareTrack } = useShareSite();
  const isLiked = isFavorite(track.id);

  useEffect(() => {
    fetchTrackDetails();
  }, [track.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(formatTime(audio.currentTime));
        setTotalDuration(formatTime(audio.duration));
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [audioRef]);

  const fetchTrackDetails = async () => {
    const { data } = await supabase
      .from('media')
      .select(`
        description,
        play_count,
        created_at,
        albums:album_id (title)
      `)
      .eq('id', track.id)
      .maybeSingle();

    if (data) {
      setTrackDetails({
        description: data.description,
        play_count: data.play_count,
        created_at: data.created_at,
        album_title: (data.albums as any)?.title
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPlays = (count: number | null | undefined) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && audioRef.current.duration) {
      const time = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  const handleLike = async () => {
    await toggleFavorite(track.id, track.title);
  };

  const handleShare = async () => {
    await shareTrack(track.title, track.id);
  };

  const handleAddToPlaylist = () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to create playlists');
      return;
    }
    setPlaylistModalOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10"
        >
          <ChevronDown className="w-6 h-6" />
        </Button>

        <div className="h-full flex flex-col md:flex-row items-center justify-center gap-8 p-6 md:p-12 overflow-y-auto">
          {/* Album Art - Large */}
          <div className="flex-shrink-0 w-full max-w-[280px] md:max-w-[400px]">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl border border-border">
              {track.coverUrl ? (
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className={`w-full h-full object-cover transition-transform duration-1000 ${isPlaying ? 'scale-105' : 'scale-100'}`}
                />
              ) : (
                <div className="w-full h-full bg-gradient-rasta flex items-center justify-center">
                  <Music className="w-24 h-24 text-primary-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Track Info & Controls */}
          <div className="flex-1 max-w-lg w-full text-center md:text-left">
            {/* Title & Artist */}
            <div className="mb-6">
              <h1 className="font-display text-2xl md:text-4xl text-foreground mb-2 line-clamp-2">
                {track.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {track.artist}
              </p>
              {trackDetails?.album_title && (
                <p className="text-sm text-primary mt-1">
                  From: {trackDetails.album_title}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center md:justify-start gap-6 mb-6 text-sm text-muted-foreground">
              {trackDetails?.play_count !== undefined && (
                <span>{formatPlays(trackDetails.play_count)} plays</span>
              )}
              {trackDetails?.created_at && (
                <span>Released {formatDate(trackDetails.created_at)}</span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full mb-6">
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{currentTime}</span>
                <span>{totalDuration}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
              <Button variant="ghost" size="icon" onClick={onPrevious}>
                <SkipBack className="w-6 h-6" />
              </Button>
              <Button
                variant="gold"
                size="lg"
                onClick={onPlayPause}
                className="w-16 h-16 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-1" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onNext}>
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>

            {/* Volume */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-32"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className={isLiked ? 'bg-rasta-red hover:bg-rasta-red/90' : ''}
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddToPlaylist}>
                <ListPlus className="w-4 h-4 mr-2" />
                Add to Playlist
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Description */}
            {trackDetails?.description && (
              <div className="mt-8 p-4 bg-card rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2">About this track</h3>
                <p className="text-sm text-muted-foreground">
                  {trackDetails.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddToPlaylistModal
        open={playlistModalOpen}
        onOpenChange={setPlaylistModalOpen}
        trackId={track.id}
        trackTitle={track.title}
      />
    </>
  );
};

export default ExpandedMusicPlayer;
