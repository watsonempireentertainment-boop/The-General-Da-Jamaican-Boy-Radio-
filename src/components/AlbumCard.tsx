import { Disc, Play } from 'lucide-react';

interface AlbumCardProps {
  id: string;
  title: string;
  albumType: string;
  coverUrl: string | null;
  releaseDate: string | null;
  trackCount: number;
  onClick: () => void;
}

const AlbumCard = ({ title, albumType, coverUrl, releaseDate, trackCount, onClick }: AlbumCardProps) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear().toString();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mixtape': return 'Mixtape';
      case 'ep': return 'EP';
      case 'single': return 'Single';
      default: return 'Album';
    }
  };

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:scale-105 bg-card"
    >
      <div className="relative aspect-square bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rasta-red via-primary to-rasta-green">
            <Disc className="w-20 h-20 text-primary-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </div>
        </div>
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-full">
            {getTypeLabel(albumType)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-muted-foreground text-sm">The General</p>
          <p className="text-muted-foreground text-xs">
            {releaseDate && formatDate(releaseDate)} • {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
          </p>
        </div>
      </div>
    </button>
  );
};

export default AlbumCard;
