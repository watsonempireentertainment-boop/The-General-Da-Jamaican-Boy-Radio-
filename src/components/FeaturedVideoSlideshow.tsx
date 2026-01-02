import { useState, useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { optimizeSupabaseImage } from '@/lib/imageOptimization';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  url: string;
  duration: string | null;
  play_count: number | null;
  created_at: string;
}

interface FeaturedVideoSlideshowProps {
  videos: Video[];
  defaultImage: string;
}

const FeaturedVideoSlideshow = ({ videos, defaultImage }: FeaturedVideoSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-rotate every 6 seconds (when not playing)
  useEffect(() => {
    if (videos.length === 0 || isPlaying) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
        setIsTransitioning(false);
      }, 500);
    }, 6000);

    return () => clearInterval(interval);
  }, [videos.length, isPlaying]);

  const goToPrevious = () => {
    setIsPlaying(false);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToNext = () => {
    setIsPlaying(false);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
      setIsTransitioning(false);
    }, 300);
  };

  const formatPlays = (count: number | null) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Featured videos coming soon!</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="relative">
      {/* Main Video Display */}
      <div className="relative aspect-video rounded-2xl overflow-hidden group">
        {isPlaying ? (
          <video
            src={currentVideo.url}
            controls
            autoPlay
            className="w-full h-full object-cover"
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <>
            {/* Thumbnail */}
            <div
              className={cn(
                "absolute inset-0 transition-all duration-500",
                isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
              )}
            >
              {currentVideo.thumbnail_url ? (
                <img
                  src={optimizeSupabaseImage(currentVideo.thumbnail_url, { width: 1280, quality: 80 })}
                  alt={currentVideo.title}
                  width={1280}
                  height={720}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={currentVideo.url}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              <div className="absolute inset-0 bg-gradient-hero" />
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="default"
                size="icon"
                onClick={() => setIsPlaying(true)}
                className="w-20 h-20 rounded-full shadow-glow animate-pulse-glow"
              >
                <Play className="w-8 h-8 ml-1" />
              </Button>
            </div>

            {/* Duration Badge */}
            {currentVideo.duration && (
              <span className="absolute bottom-4 right-4 bg-black/80 text-white text-sm px-3 py-1 rounded-lg">
                {currentVideo.duration}
              </span>
            )}
          </>
        )}
      </div>

      {/* Video Details */}
      <div
        className={cn(
          "mt-6 text-center transition-all duration-500",
          isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        <h3 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {currentVideo.title}
        </h3>
        <p className="text-muted-foreground text-lg mb-2">The General Da Jamaican Boy</p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {formatPlays(currentVideo.play_count)} views
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(currentVideo.created_at)}
          </span>
        </div>
      </div>

    </div>
  );
};

export default FeaturedVideoSlideshow;
