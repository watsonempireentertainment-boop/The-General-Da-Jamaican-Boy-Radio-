import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Music, Video, Newspaper, Users, User, Shield, LogOut, Home, Mic2, Heart, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import logoImage from '@/assets/tgdjb-logo-optimized.webp';
import DonationModal from '@/components/DonationModal';
import ShareButton from '@/components/ShareButton';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Radio', href: '/radio', icon: Radio },
    { name: 'Artist', href: '/artist', icon: Mic2 },
    { name: 'Music', href: '/music', icon: Music },
    { name: 'Videos', href: '/videos', icon: Video },
    { name: 'News', href: '/news', icon: Newspaper },
    { name: 'Community', href: '/community', icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-lg' 
            : 'bg-transparent'
        }`}
      >
        {/* Rasta Stripe Top Accent */}
        <div className="h-1 bg-gradient-rasta" />
        
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img 
                  src={logoImage} 
                  alt="T.G.D.J.B" 
                  width={70}
                  height={46}
                  className="h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-[0_0_15px_rgba(255,200,0,0.4)]"
                />
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.href}>
                  <Button 
                    variant="ghost" 
                    className={`relative gap-2 px-4 py-2 font-medium transition-all duration-300 hover:bg-primary/10 ${
                      isActive(link.href) 
                        ? 'text-primary' 
                        : 'text-foreground/80 hover:text-foreground'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                    {isActive(link.href) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Auth & Action Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <ShareButton variant="ghost" />
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDonateOpen(true)} 
                className="gap-2 border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300"
              >
                <Heart className="w-4 h-4" />
                Support
              </Button>
              
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="gap-2 border-primary/50 hover:bg-primary hover:text-primary-foreground">
                        <Shield className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button 
                      size="sm" 
                      className="bg-gradient-gold text-primary-foreground font-semibold shadow-button hover:shadow-glow transition-all duration-300"
                    >
                      Join the Tribe
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden relative z-50"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-background/95 backdrop-blur-xl"
          onClick={() => setIsOpen(false)}
        />
        
        {/* Menu Content */}
        <div className={`relative h-full flex flex-col pt-24 px-6 pb-8 transition-all duration-500 ${
          isOpen ? 'translate-y-0' : '-translate-y-10'
        }`}>
          <div className="flex-1 space-y-2">
            {navLinks.map((link, index) => (
              <Link 
                key={link.name} 
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={`block transition-all duration-300 delay-${index * 50}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                  isActive(link.href) 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground/80 hover:bg-muted'
                }`}>
                  <link.icon className="w-6 h-6" />
                  <span className="font-display text-2xl tracking-wide">{link.name}</span>
                  {isActive(link.href) && (
                    <span className="ml-auto w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </Link>
            ))}
            
            {isAdmin && (
              <Link to="/admin" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-4 p-4 rounded-xl text-foreground/80 hover:bg-muted">
                  <Shield className="w-6 h-6" />
                  <span className="font-display text-2xl tracking-wide">Dashboard</span>
                </div>
              </Link>
            )}
          </div>
          
          {/* Bottom Actions */}
          <div className="space-y-3 pt-6 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full justify-center gap-3 h-14 border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground"
              onClick={() => { setIsDonateOpen(true); setIsOpen(false); }}
            >
              <Heart className="w-5 h-5" />
              <span className="font-display text-xl">Support the Movement</span>
            </Button>
            
            {user ? (
              <Button variant="ghost" className="w-full h-14" onClick={handleSignOut}>
                <LogOut className="w-5 h-5 mr-3" />
                <span className="font-display text-xl">Sign Out</span>
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full h-14">
                    <span className="font-display text-lg">Login</span>
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button className="w-full h-14 bg-gradient-gold text-primary-foreground">
                    <span className="font-display text-lg">Join</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <DonationModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
    </>
  );
};

export default Navigation;
