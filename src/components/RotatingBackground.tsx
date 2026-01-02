import { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

import artistPhoto1 from '@/assets/artist-photo-1.jpg';
import artistPhoto2 from '@/assets/artist-photo-2.webp';
import artistPhoto3 from '@/assets/artist-photo-3-optimized.webp';
import artistPhoto4 from '@/assets/artist-photo-4.jpg';
import heroArtist from '@/assets/hero-artist.jpg';
import concertBg from '@/assets/concert-bg.jpg';

interface RotatingBackgroundProps {
  children: ReactNode;
  className?: string;
  interval?: number;
}

const backgroundImages = [
  artistPhoto1,
  artistPhoto2,
  artistPhoto3,
  artistPhoto4,
  heroArtist,
  concertBg,
];

const RotatingBackground = ({ children, className, interval = 8000 }: RotatingBackgroundProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setNextIndex((nextIndex + 1) % backgroundImages.length);
        setIsTransitioning(false);
      }, 1000);
    }, interval);

    return () => clearInterval(rotateInterval);
  }, [nextIndex, interval]);

  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* Current Background */}
      <div
        className={cn(
          "fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-opacity duration-1000",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
        style={{ backgroundImage: `url(${backgroundImages[currentIndex]})` }}
      />
      
      {/* Next Background (preloaded) */}
      <div
        className={cn(
          "fixed inset-0 -z-30 bg-cover bg-center bg-no-repeat transition-opacity duration-1000",
          isTransitioning ? "opacity-100" : "opacity-0"
        )}
        style={{ backgroundImage: `url(${backgroundImages[nextIndex]})` }}
      />
      
      {/* Dark Overlay */}
      <div className="fixed inset-0 -z-10 bg-background/70" />
      
      {children}
    </div>
  );
};

export default RotatingBackground;
