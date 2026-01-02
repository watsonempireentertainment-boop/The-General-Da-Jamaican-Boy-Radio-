import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeaturedSlideshow from '@/components/FeaturedSlideshow';
import FeaturedAlbumsSlideshow from '@/components/FeaturedAlbumsSlideshow';
import RotatingBackground from '@/components/RotatingBackground';
import FeaturedVideoSlideshow from '@/components/FeaturedVideoSlideshow';
import NewsCard from '@/components/NewsCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import MusicPlayer from '@/components/MusicPlayer';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, Headphones, Users, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { optimizeSupabaseImage } from '@/lib/imageOptimization';

import artistPhoto1 from '@/assets/artist-photo-1.jpg';
import artistPhoto2 from '@/assets/artist-photo-2.webp';
import newsCover from '@/assets/news-cover.jpg';

interface Track {
  id: string;
  title: string;
  thumbnail_url: string | null;
  url: string;
  duration: string | null;
  play_count: number | null;
  is_featured: boolean | null;
}

interface MediaStats {
  totalTracks: number;
  totalVideos: number;
}

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  url: string;
  duration: string | null;
  play_count: number | null;
  created_at: string;
}

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
}

interface ArtistProfile {
  name: string;
  bio: string | null;
  profile_photo_url: string | null;
}

interface Album {
  id: string;
  title: string;
  album_type: string;
  cover_url: string | null;
  description: string | null;
  release_date: string | null;
}

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [mediaStats, setMediaStats] = useState<MediaStats>({ totalTracks: 0, totalVideos: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: tracksData } = await supabase
      .from('media')
      .select('*')
      .eq('media_type', 'track')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (tracksData) setTracks(tracksData);

    const { count: trackCount } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })
      .eq('media_type', 'track');

    const { count: videoCount } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })
      .eq('media_type', 'video');

    setMediaStats({
      totalTracks: trackCount || 0,
      totalVideos: videoCount || 0,
    });

    const { data: videosData } = await supabase
      .from('media')
      .select('*')
      .eq('media_type', 'video')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (videosData) setVideos(videosData);

    const { data: newsData } = await supabase
      .from('news')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3);

    if (newsData) setNews(newsData);

    const { data: profileData } = await supabase
      .from('artist_profile')
      .select('*')
      .maybeSingle();

    if (profileData) setArtistProfile(profileData);

    const { data: albumsData } = await supabase
      .from('albums')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (albumsData) setAlbums(albumsData);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const currentTrack = tracks.length > 0 ? {
    id: tracks[currentTrackIndex]?.id || '',
    title: tracks[currentTrackIndex]?.title || '',
    artist: 'The General Da Jamaican Boy',
    coverUrl: tracks[currentTrackIndex]?.thumbnail_url || artistPhoto1,
    duration: tracks[currentTrackIndex]?.duration || '0:00',
    audioUrl: tracks[currentTrackIndex]?.url || '',
  } : null;

  const handlePlayTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  return (
    <RotatingBackground>
      <div className="min-h-screen overflow-x-hidden">
        <Navigation />
        
        <HeroSection onListenLive={() => setIsPlaying(true)} />

        {/* Albums Section - Full Width */}
        {albums.length > 0 && (
          <section className="py-section px-4 sm:px-6 lg:px-12 relative">
            <div className="absolute inset-0 bg-gradient-glow opacity-20 pointer-events-none" />
            <div className="max-w-7xl mx-auto relative">
              <div className="mb-10">
                <h2 className="font-display text-display-md text-foreground">ALBUMS & MIXTAPES</h2>
                <p className="text-muted-foreground mt-2 text-lg">Full projects from The General</p>
              </div>
              <FeaturedAlbumsSlideshow albums={albums} defaultImage={artistPhoto1} />
            </div>
          </section>
        )}

        {/* Featured Tracks - Full Width */}
        <section id="featured-tracks" className="py-section px-4 sm:px-6 lg:px-12 bg-gradient-dark relative">
          <div className="absolute inset-0 noise-overlay pointer-events-none" />
          <div className="max-w-7xl mx-auto relative">
            <div className="mb-10">
              <h2 className="font-display text-display-md text-foreground">FEATURED TRACKS</h2>
              <p className="text-muted-foreground mt-2 text-lg">Original music from The General</p>
            </div>
            <FeaturedSlideshow tracks={tracks} onPlay={handlePlayTrack} defaultImage={artistPhoto1} />
          </div>
        </section>

        {/* Videos Section - Full Width */}
        {videos.length > 0 && (
          <section className="py-section px-4 sm:px-6 lg:px-12 relative">
            <div className="max-w-7xl mx-auto">
              <div className="mb-10">
                <h2 className="font-display text-display-md text-foreground">FEATURED VIDEOS</h2>
                <p className="text-muted-foreground mt-2 text-lg">Watch the latest official visuals</p>
              </div>
              <FeaturedVideoSlideshow videos={videos} defaultImage={artistPhoto2} />
            </div>
          </section>
        )}

        {/* About Section - Full Width Immersive */}
        <section className="py-section px-4 sm:px-6 lg:px-12 bg-gradient-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
          
          <div className="max-w-7xl mx-auto relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <span className="inline-block text-primary font-semibold text-sm uppercase tracking-widest mb-4 px-4 py-2 bg-primary/10 rounded-full">About the Artist</span>
                <h2 className="font-display text-display-md mb-6 text-gradient-rasta">
                  LIFE IS GENERAL, I'M LIVING LIFE IN GENERAL
                </h2>
                <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                  {artistProfile?.bio || "Jamaican reggae and dancehall artist from St. Elizabeth, blending traditional roots with modern dancehall energy. Spreading positive vibrations and authentic Jamaican culture worldwide."}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-10">
                  {[
                    { icon: Headphones, value: mediaStats.totalTracks, label: 'Tracks' },
                    { icon: Users, value: 'Growing', label: 'Fanbase' },
                    { icon: Globe, value: 'JA', label: 'St. Elizabeth' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-6 rounded-2xl bg-card/50 border border-border hover:border-primary/50 transition-all duration-300 group">
                      <stat.icon className="w-6 h-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <p className="font-display text-2xl text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <Link to="/community">
                  <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold shadow-button hover:shadow-glow transition-all duration-300">
                    Join the Community
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              <Link to="/artist" className="order-1 lg:order-2 relative block group">
                <div className="aspect-square rounded-3xl overflow-hidden rasta-border transition-all duration-500 group-hover:scale-[1.02] shadow-card">
                  <img 
                    src={optimizeSupabaseImage(artistProfile?.profile_photo_url, { width: 600, quality: 80 }) || artistPhoto1} 
                    alt="The General Da Jamaican Boy"
                    width={600}
                    height={600}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-gradient-rasta p-5 rounded-2xl shadow-card transition-transform group-hover:scale-105">
                  <p className="font-display text-2xl text-primary-foreground">Pure Reggae</p>
                  <p className="text-sm text-primary-foreground/80">Roots & Culture</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* News Section */}
        {news.length > 0 && (
          <section className="py-section px-4 sm:px-6 lg:px-12 bg-gradient-dark relative">
            <div className="absolute inset-0 noise-overlay pointer-events-none" />
            <div className="max-w-7xl mx-auto relative">
              <div className="mb-10">
                <h2 className="font-display text-display-md text-foreground">LATEST NEWS</h2>
                <p className="text-muted-foreground mt-2 text-lg">Stay updated with The General</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {news.map((item) => (
                  <NewsCard
                    key={item.id}
                    title={item.title}
                    excerpt={item.excerpt || ''}
                    imageUrl={item.image_url || newsCover}
                    date={formatDate(item.published_at)}
                    category={item.category || 'News'}
                  />
                ))}
              </div>
              <NewsletterSignup />
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-section px-4 sm:px-6 lg:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative">
            <h2 className="font-display text-display-lg text-foreground mb-6">
              JOIN THE MOVEMENT
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect with fellow reggae lovers, get exclusive content, and be the first to know about new releases.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="xl" className="bg-gradient-gold text-primary-foreground font-bold shadow-button hover:shadow-glow transition-all duration-300">
                  Create Account
                </Button>
              </Link>
              <Link to="/music">
                <Button variant="outline" size="xl" className="border-2">
                  Listen Now
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />

        {currentTrack && (
          <MusicPlayer 
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onNext={() => setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)}
            onPrevious={() => setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)}
          />
        )}
      </div>
    </RotatingBackground>
  );
};

export default Index;
