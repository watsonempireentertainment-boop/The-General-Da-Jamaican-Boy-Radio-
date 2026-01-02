import { ArrowRight, Calendar } from 'lucide-react';
import { optimizeSupabaseImage } from '@/lib/imageOptimization';

interface NewsCardProps {
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
}

const NewsCard = ({ title, excerpt, imageUrl, date, category }: NewsCardProps) => {
  // Optimize image for card display (max ~400px width on mobile, ~600px on desktop)
  const optimizedUrl = optimizeSupabaseImage(imageUrl, { width: 800, quality: 75 });

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      {/* Image with gradient overlay */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={optimizedUrl || imageUrl} 
          alt={title}
          width={400}
          height={192}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        
        {/* Category badge */}
        <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
          {category}
        </span>
      </div>
      
      {/* Content */}
      <div className="p-5 -mt-12 relative z-10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>{date}</span>
        </div>
        
        <h3 className="font-display text-lg md:text-xl text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {excerpt}
        </p>
        
        <div className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
          Read Article
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
