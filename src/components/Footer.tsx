import { Instagram, Twitter, Youtube, Facebook, Heart, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import logoImage from '@/assets/tgdjb-logo-optimized.webp';
import ShareButton from '@/components/ShareButton';

const Footer = () => {
  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Facebook, href: '#', label: 'Facebook' },
  ];

  const quickLinks = [
    { name: 'Music', href: '/music' },
    { name: 'Videos', href: '/videos' },
    { name: 'Radio', href: '/radio' },
    { name: 'News', href: '/news' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <footer className="relative bg-gradient-dark border-t border-border mt-section pb-28 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-primary/5 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      {/* Rasta Stripe */}
      <div className="h-1 bg-gradient-rasta" />
      
      <div className="relative w-full px-4 sm:px-6 lg:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link to="/" className="inline-block mb-6">
                <img 
                  src={logoImage} 
                  alt="T.G.D.J.B - The General Da Jamaican Boy" 
                  width={120}
                  height={80}
                  className="h-20 w-auto object-contain"
                />
              </Link>
              <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
                Authentic reggae and dancehall music from St. Elizabeth, Jamaica. 
                Spreading positive vibrations and real Jamaican culture worldwide.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4 text-primary" />
                <span>St. Elizabeth, Jamaica</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>contact@tgdjb.com</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display text-2xl text-foreground mb-6 tracking-wide">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="font-display text-2xl text-foreground mb-6 tracking-wide">Connect</h4>
              <div className="flex flex-wrap gap-3 mb-6">
                {socialLinks.map((social) => (
                  <a 
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-12 h-12 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-glow"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
                <ShareButton 
                  variant="outline" 
                  showLabel={false}
                  className="w-12 h-12 rounded-xl"
                />
              </div>
              
              <Link to="/auth">
                <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:shadow-glow transition-all duration-300">
                  Join the Movement
                </Button>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} The General Da Jamaican Boy. All rights reserved.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              Made with <Heart className="w-4 h-4 text-accent fill-accent animate-pulse" /> in Jamaica
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
