import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { optimizeSupabaseImage } from '@/lib/imageOptimization';

interface Album {
  id: string;
  title: string;
  album_type: string;
  cover_url: string | null;
  description: string | null;
  release_date: string | null;
}

interface FeaturedAlbumsSlideshowProps {
  albums: Album[];
  defaultImage: string;
}

const FeaturedAlbumsSlideshow = ({ albums, defaultImage }: FeaturedAlbumsSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (albums.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % albums.length);
        setIsTransitioning(false);
      }, 500);
    }, 6000);

    return () => clearInterval(interval);
  }, [albums.length]);

  const goToPrevious = () => {
    if (albums.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + albums.length) % albums.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToNext = () => {
    if (albums.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % albums.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  if (albums.length === 0) {
    return null;
  }

  const currentAlbum = albums[currentIndex];
  const isAlbum = currentAlbum.album_type === 'album';

  return (
    <div className="relative">
      {/* Main Slideshow */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden group">
        {/* Background Image with blur effect */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-500",
            isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
          )}
        >
          <img
            src={optimizeSupabaseImage(currentAlbum.cover_url, { width: 1200, quality: 80 }) || defaultImage}
            alt={currentAlbum.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12">
          {/* Left side - Album info */}
          <div className={cn(
            "flex-1 max-w-lg transition-all duration-500",
            isTransitioning ? "opacity-0 translate-x-[-20px]" : "opacity-100 translate-x-0"
          )}>
            <Badge 
              variant={isAlbum ? "default" : "secondary"}
              className="mb-4 uppercase tracking-wider"
            >
              <Disc3 className="w-3 h-3 mr-1" />
              {currentAlbum.album_type}
            </Badge>
            <h2 className="font-display text-2xl md:text-4xl lg:text-5xl text-foreground mb-3 leading-tight">
              {currentAlbum.title}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-6 line-clamp-2">
              {currentAlbum.description || 'By The General Da Jamaican Boy'}
            </p>
            <Button 
              variant="gold" 
              size="lg"
              onClick={() => navigate('/music')}
              className="group/btn"
            >
              <Play className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
              Listen Now
            </Button>
          </div>

          {/* Right side - Album cover */}
          <div className={cn(
            "hidden md:block transition-all duration-500",
            isTransitioning ? "opacity-0 scale-90" : "opacity-100 scale-100"
          )}>
            <div className="w-48 lg:w-64 aspect-square rounded-xl overflow-hidden shadow-2xl ring-2 ring-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
              <img
                src={optimizeSupabaseImage(currentAlbum.cover_url, { width: 400, quality: 85 }) || defaultImage}
                alt={currentAlbum.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {albums.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots indicator */}
      {albums.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {albums.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedAlbumsSlideshow;
