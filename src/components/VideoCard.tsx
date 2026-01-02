import { Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoCardProps {
  title: string;
  thumbnailUrl: string;
  duration: string;
  views: string;
  date: string;
  onPlay: () => void;
}

const VideoCard = ({ title, thumbnailUrl, duration, views, date, onPlay }: VideoCardProps) => {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={thumbnailUrl} 
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
            className="w-16 h-16 rounded-full shadow-glow animate-pulse-glow"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
          {duration}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2">{title}</h3>
        
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-muted-foreground">
            <span>{views} views</span>
            <span className="mx-2">•</span>
            <span>{date}</span>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
