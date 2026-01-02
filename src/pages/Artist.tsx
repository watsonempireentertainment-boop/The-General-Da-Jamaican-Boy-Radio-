import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TrackCard from '@/components/TrackCard';
import VideoCard from '@/components/VideoCard';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import MusicPlayer from '@/components/MusicPlayer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Music, Video, Play, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

import artistPhoto1 from '@/assets/artist-photo-1.jpg';

interface Track {
  id: string;
  title: string;
  thumbnail_url: string | null;
  url: string;
  duration: string | null;
  play_count: number | null;
  is_featured: boolean | null;
}

interface VideoItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  url: string;
  duration: string | null;
  play_count: number | null;
  created_at: string;
}

interface ArtistProfile {
  name: string;
  bio: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  social_links: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
  } | null;
}

const Artist = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch artist profile
    const { data: profileData } = await supabase
      .from('artist_profile')
      .select('*')
      .maybeSingle();

    if (profileData) {
      setArtistProfile({
        ...profileData,
        social_links: profileData.social_links as ArtistProfile['social_links']
      });
    }

    // Fetch all tracks
    const { data: tracksData } = await supabase
      .from('media')
      .select('*')
      .eq('media_type', 'track')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (tracksData) setTracks(tracksData);

    // Fetch all videos
    const { data: videosData } = await supabase
      .from('media')
      .select('*')
      .eq('media_type', 'video')
      .order('created_at', { ascending: false });

    if (videosData) setVideos(videosData);

    setLoading(false);
  };

  const formatPlays = (count: number | null) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePlayTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const currentTrack = tracks.length > 0 ? {
    id: tracks[currentTrackIndex]?.id || '',
    title: tracks[currentTrackIndex]?.title || '',
    artist: artistProfile?.name || 'The General Da Jamaican Boy',
    coverUrl: tracks[currentTrackIndex]?.thumbnail_url || artistPhoto1,
    duration: tracks[currentTrackIndex]?.duration || '0:00',
    audioUrl: tracks[currentTrackIndex]?.url || '',
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Banner */}
      <section className="relative min-h-[60vh] sm:min-h-[50vh] overflow-hidden pt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${artistProfile?.cover_photo_url || artistPhoto1})` 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-8 pt-20 sm:pt-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 w-full">
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-xl overflow-hidden border-4 border-primary shadow-2xl flex-shrink-0">
              <img 
                src={artistProfile?.profile_photo_url || artistPhoto1}
                alt={artistProfile?.name || 'The General Da Jamaican Boy'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs sm:text-sm font-medium mb-2">
                Verified Artist
              </span>
              <h1 className="font-display text-2xl sm:text-4xl md:text-6xl text-foreground mb-2 break-words">
                {artistProfile?.name || 'THE GENERAL DA JAMAICAN BOY'}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-lg">
                {tracks.length} Tracks • St. Elizabeth, Jamaica
              </p>
              
              {/* Social Links */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-4 flex-wrap">
                {artistProfile?.social_links?.instagram && (
                  <a 
                    href={`https://instagram.com/${artistProfile.social_links.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-card/80 hover:bg-primary/20 rounded-full transition-colors"
                  >
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                )}
                {artistProfile?.social_links?.facebook && (
                  <a 
                    href={`https://facebook.com/${artistProfile.social_links.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-card/80 hover:bg-primary/20 rounded-full transition-colors"
                  >
                    <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                )}
                {artistProfile?.social_links?.twitter && (
                  <a 
                    href={`https://twitter.com/${artistProfile.social_links.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-card/80 hover:bg-primary/20 rounded-full transition-colors"
                  >
                    <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                )}
                {artistProfile?.social_links?.youtube && (
                  <a 
                    href={`https://youtube.com/@${artistProfile.social_links.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-card/80 hover:bg-primary/20 rounded-full transition-colors"
                  >
                    <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-card/50 rounded-xl p-6 border border-border">
          <h2 className="font-display text-2xl text-foreground mb-4">About</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              {artistProfile?.bio || "Born and raised in St. Elizabeth, Jamaica, The General Da Jamaican Boy is a rising reggae and dancehall artist bringing authentic Jamaican vibes to the world. With a unique blend of traditional roots reggae and modern dancehall energy, he creates music that speaks to the soul."}
            </p>
            <p>
              Known for powerful lyrics that address love, unity, social consciousness, and the realities of life, The General's music resonates with fans across the globe. From the hills of Jamaica to international stages, he continues to spread positive vibrations and keep the spirit of reggae alive.
            </p>
            <p>
              With tracks like "Speakers Bumpin," "Ganja Fi Burn," and "J.A. My Home Land," The General Da Jamaican Boy is building a movement - one riddim at a time. Life is General, and he's living life in General.
            </p>
          </div>
        </div>
      </section>

      {/* Music & Videos Tabs */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-32">
        <Tabs defaultValue="music" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="music" className="gap-2">
              <Music className="w-4 h-4" />
              Music ({tracks.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="w-4 h-4" />
              Videos ({videos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music">
            {tracks.length > 0 ? (
              <div className="space-y-6">
                {/* Featured Tracks */}
                {tracks.some(t => t.is_featured) && (
                  <div>
                    <h3 className="font-display text-xl text-foreground mb-4">Featured</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {tracks.filter(t => t.is_featured).map((track, index) => (
                        <TrackCard
                          key={track.id}
                          title={track.title}
                          coverUrl={track.thumbnail_url || artistPhoto1}
                          duration={track.duration || '0:00'}
                          plays={formatPlays(track.play_count)}
                          isFeature={true}
                          onPlay={() => handlePlayTrack(tracks.findIndex(t => t.id === track.id))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Tracks */}
                <div>
                  <h3 className="font-display text-xl text-foreground mb-4">All Tracks</h3>
                  <div className="space-y-2">
                    {tracks.map((track, index) => (
                      <div 
                        key={track.id}
                        className="flex items-center gap-4 p-3 bg-card/50 hover:bg-card rounded-lg cursor-pointer transition-colors group"
                        onClick={() => handlePlayTrack(index)}
                      >
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={track.thumbnail_url || artistPhoto1}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-6 h-6 text-primary fill-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{track.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {artistProfile?.name || 'The General Da Jamaican Boy'}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground hidden sm:block">
                          {track.duration || '--:--'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPlays(track.play_count)} plays
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">No tracks yet</h3>
                <p className="text-muted-foreground">Check back soon for new music!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos">
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    title={video.title}
                    thumbnailUrl={video.thumbnail_url || artistPhoto1}
                    duration={video.duration || '0:00'}
                    views={formatPlays(video.play_count)}
                    date={formatDate(video.created_at)}
                    onPlay={() => setSelectedVideo(video)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">No videos yet</h3>
                <p className="text-muted-foreground">Check back soon for new visuals!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <Footer />

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
        />
      )}

      {/* Music Player */}
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
  );
};

export default Artist;