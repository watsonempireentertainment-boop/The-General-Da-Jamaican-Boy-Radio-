import { useState } from 'react';
import { Play, Heart, Share2, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TrackCardProps {
  title: string;
  coverUrl: string;
  duration: string;
  plays: string;
  isFeature?: boolean;
  onPlay: () => void;
  audioUrl?: string;
  allowDownload?: boolean;
}

const TrackCard = ({ 
  title, 
  coverUrl, 
  duration, 
  plays, 
  isFeature = false, 
  onPlay, 
  audioUrl,
  allowDownload = false 
}: TrackCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!audioUrl) {
      toast.error('Download not available');
      return;
    }

    if (!allowDownload) {
      toast.error('Download not enabled for this track');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setDownloaded(true);
      toast.success('Download started!');
      
      // Reset downloaded state after 3 seconds
      setTimeout(() => setDownloaded(false), 3000);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className={`group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 ${
        isFeature ? 'col-span-2 row-span-2' : ''
      }`}
    >
      <div className={`aspect-square relative overflow-hidden ${isFeature ? 'aspect-video' : ''}`}>
        <img 
          src={coverUrl} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button 
            variant="default" 
            size="icon" 
            onClick={onPlay}
            className="w-14 h-14 rounded-full shadow-glow animate-pulse-glow"
          >
            <Play className="w-6 h-6 ml-1" />
          </Button>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur px-2 py-1 rounded text-xs font-medium">
          {duration}
        </div>

        {isFeature && (
          <div className="absolute top-3 left-3 bg-gradient-rasta px-3 py-1 rounded-full text-xs font-bold text-primary-foreground">
            FEATURED
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{title}</h3>
        <p className="text-sm text-muted-foreground">The General Da Jamaican Boy</p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">{plays} plays</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Heart className="w-4 h-4" />
            </Button>
            {allowDownload && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {downloaded ? (
                  <Check className="w-4 h-4 text-rasta-green" />
                ) : isDownloading ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
