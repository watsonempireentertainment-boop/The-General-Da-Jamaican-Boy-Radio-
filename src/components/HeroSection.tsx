import { Play, Radio, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import artistPhoto from '@/assets/artist-photo-3-optimized.webp';
import logoImage from '@/assets/tgdjb-logo-optimized.webp';

interface HeroSectionProps {
  onListenLive: () => void;
}

const HeroSection = ({ onListenLive }: HeroSectionProps) => {
  const navigate = useNavigate();

  const handleListenLive = () => {
    navigate('/radio');
  };

  const handleLatestTracks = () => {
    navigate('/music');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0">
        <img 
          src={artistPhoto} 
          alt="The General Da Jamaican Boy"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-top scale-105"
        />
        
        {/* Multi-layer Gradient Overlays for Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/70" />
        <div className="absolute inset-0 bg-rasta-black/40" />
        
        {/* Animated Glow Effect */}
        <div className="absolute inset-0 bg-gradient-glow animate-pulse-glow opacity-30" />
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Animated Rasta Stripe Accent */}
      <div className="absolute top-[72px] left-0 right-0 h-1 bg-gradient-rasta opacity-80" />
      
      {/* Floating Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 w-full max-w-6xl mx-auto animate-fade-in">
        {/* Live Badge */}
        <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3 mb-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
          </span>
          <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Live Radio 24/7</span>
        </div>

        {/* Logo with Glow */}
        <div className="mb-8 relative">
          <img 
            src={logoImage} 
            alt="T.G.D.J.B - The General Da Jamaican Boy" 
            width={400}
            height={267}
            fetchPriority="high"
            decoding="async"
            className="h-40 sm:h-52 md:h-64 mx-auto object-contain drop-shadow-[0_0_30px_rgba(255,200,0,0.3)]"
          />
          {/* Glow Behind Logo */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-3xl -z-10" />
        </div>
        
        {/* Tagline */}
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          Experience authentic reggae and dancehall vibes straight from <span className="text-primary font-semibold">St. Elizabeth, Jamaica</span>. 
          Stream exclusive tracks, watch music videos, and join the movement.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button 
            size="xl" 
            onClick={handleListenLive}
            className="group relative overflow-hidden bg-gradient-gold text-primary-foreground font-bold shadow-button hover:shadow-glow transition-all duration-500 px-10"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Radio className="w-5 h-5" />
              Listen Live
            </span>
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </Button>
          
          <Button 
            variant="outline" 
            size="xl" 
            onClick={handleLatestTracks}
            className="border-2 border-foreground/20 hover:border-primary hover:bg-primary/10 transition-all duration-300"
          >
            <Play className="w-5 h-5 mr-2" />
            Latest Tracks
          </Button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-8 md:gap-16">
          <div className="text-center group">
            <p className="font-display text-4xl md:text-5xl text-primary glow-text transition-all duration-300 group-hover:scale-110">50K+</p>
            <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider">Listeners</p>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-center group">
            <p className="font-display text-4xl md:text-5xl text-primary glow-text transition-all duration-300 group-hover:scale-110">120+</p>
            <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider">Tracks</p>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-center group">
            <p className="font-display text-4xl md:text-5xl text-primary glow-text transition-all duration-300 group-hover:scale-110">25+</p>
            <p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider">Videos</p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button 
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-6 h-6 animate-bounce-subtle" />
      </button>
    </section>
  );
};

export default HeroSection;
