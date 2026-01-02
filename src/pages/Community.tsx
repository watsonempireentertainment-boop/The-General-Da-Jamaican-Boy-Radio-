import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Users, Music, Heart, MessageCircle, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';

const Community = () => {
  const { user } = useAuth();

  const socialLinks = [
    { name: 'Instagram', icon: Instagram, url: 'https://instagram.com/thegeneraldjb', color: 'hover:text-pink-500' },
    { name: 'Facebook', icon: Facebook, url: 'https://facebook.com/TheGeneralDaJamaicanBoy', color: 'hover:text-blue-500' },
    { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/TheGeneralDaJamaicanBoy', color: 'hover:text-red-500' },
    { name: 'Twitter/X', icon: Twitter, url: 'https://twitter.com/TheGeneralDJB', color: 'hover:text-sky-400' },
  ];

  const stats = [
    { label: 'Community Members', value: '50K+', icon: Users },
    { label: 'Tracks Released', value: '120+', icon: Music },
    { label: 'Countries Reached', value: '40+', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      <main className="pt-20 pb-24">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 text-center">
          <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">
            JOIN THE TRIBE
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with fellow reggae lovers worldwide. Share the vibes, spread the love, and be part of the movement.
          </p>
          
          {!user && (
            <Link to="/auth">
              <Button variant="gold" size="xl">
                Join the Community
              </Button>
            </Link>
          )}
        </section>

        {/* Stats Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-2xl p-8 text-center">
                <stat.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <p className="font-display text-4xl text-foreground mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social Links */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-12">
          <h2 className="font-display text-3xl text-foreground text-center mb-8">
            CONNECT WITH US
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-card border border-border rounded-xl p-6 text-center transition-all hover:border-primary/50 hover:scale-105 ${social.color}`}
              >
                <social.icon className="w-10 h-10 mx-auto mb-3" />
                <p className="font-semibold text-foreground">{social.name}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Community Features */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-12">
          <h2 className="font-display text-3xl text-foreground text-center mb-8">
            COMMUNITY PERKS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <Music className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">Exclusive Music</h3>
              <p className="text-muted-foreground">Get early access to new releases, unreleased tracks, and exclusive remixes only available to community members.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <MessageCircle className="w-8 h-8 text-rasta-green mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">Direct Connection</h3>
              <p className="text-muted-foreground">Connect directly with The General and other artists. Share your music, get feedback, and collaborate.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <Heart className="w-8 h-8 text-rasta-red mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">Support the Movement</h3>
              <p className="text-muted-foreground">Your membership directly supports independent reggae music and helps keep the culture alive.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <Users className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">Global Family</h3>
              <p className="text-muted-foreground">Join a worldwide family of reggae lovers. Share experiences, attend virtual events, and spread positive vibes.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Community;
