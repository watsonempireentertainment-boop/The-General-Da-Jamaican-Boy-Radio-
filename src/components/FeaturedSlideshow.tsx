import { useState, useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { optimizeSupabaseImage } from '@/lib/imageOptimization';

interface Track {
  id: string;
  title: string;
  thumbnail_url: string | null;
  url: string;
  duration: string | null;
  play_count: number | null;
  is_featured: boolean | null;
}

interface FeaturedSlideshowProps {
  tracks: Track[];
  onPlay: (index: number) => void;
  defaultImage: string;
}

const FeaturedSlideshow = ({ tracks, onPlay, defaultImage }: FeaturedSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (tracks.length === 0) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % tracks.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [tracks.length]);

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % tracks.length);
      setIsTransitioning(false);
    }, 300);
  };

  const formatPlays = (count: number | null) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  if (tracks.length === 0) {
    return <p className="text-muted-foreground text-center py-12">Loading tracks...</p>;
  }

  const currentTrack = tracks[currentIndex];

  return (
    <div className="relative">
      {/* Main Slideshow */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden group">
      {/* Background Image */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-500",
            isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
          )}
        >
          <img
            src={optimizeSupabaseImage(currentTrack.thumbnail_url, { width: 1200, quality: 80 }) || defaultImage}
            alt={currentTrack.title}
            width={1200}
            height={500}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="default"
            size="icon"
            onClick={() => onPlay(currentIndex)}
            className="w-20 h-20 rounded-full shadow-glow animate-pulse-glow"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      </div>

      {/* Song Details Below */}
      <div
        className={cn(
          "mt-6 text-center transition-all duration-500",
          isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        <h3 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {currentTrack.title}
        </h3>
        <p className="text-muted-foreground text-lg mb-2">The General Da Jamaican Boy</p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>{currentTrack.duration || '0:00'}</span>
          <span>•</span>
          <span>{formatPlays(currentTrack.play_count)} plays</span>
        </div>
      </div>
    </div>
  );
};

export default FeaturedSlideshow;
