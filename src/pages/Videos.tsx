import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Play, Clock, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  duration: string | null;
  play_count: number | null;
  created_at: string;
  is_featured: boolean | null;
}

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('media_type', 'video')
      .order('created_at', { ascending: false });
    
    if (data) {
      setVideos(data);
      if (data.length > 0) {
        setSelectedVideo(data[0]);
      }
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      <main className="pt-20 pb-24">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">
              MUSIC VIDEOS
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Watch the latest visuals from The General Da Jamaican Boy
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20">
              <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Videos Yet</h3>
              <p className="text-muted-foreground">New music videos coming soon!</p>
            </div>
          ) : (
            <>
              {/* Featured Video Player */}
              {selectedVideo && (
                <div className="mb-12">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-card border border-border relative group">
                    {selectedVideo.url.includes('youtube') || selectedVideo.url.includes('youtu.be') ? (
                      <iframe
                        src={selectedVideo.url.replace('watch?v=', 'embed/')}
                        title={selectedVideo.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={selectedVideo.url}
                        controls
                        poster={selectedVideo.thumbnail_url || undefined}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="mt-4">
                    <h2 className="font-display text-2xl text-foreground">{selectedVideo.title}</h2>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {selectedVideo.play_count?.toLocaleString() || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedVideo.created_at)}
                      </span>
                    </div>
                    {selectedVideo.description && (
                      <p className="text-muted-foreground mt-4">{selectedVideo.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`group text-left rounded-xl overflow-hidden border transition-all ${
                      selectedVideo?.id === video.id 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="relative aspect-video bg-card">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-rasta-green/20">
                          <Play className="w-12 h-12 text-primary" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-8 h-8 text-primary-foreground ml-1" />
                        </div>
                      </div>
                      {video.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </span>
                      )}
                      {video.is_featured && (
                        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-semibold">
                          FEATURED
                        </span>
                      )}
                    </div>
                    <div className="p-4 bg-card">
                      <h3 className="font-semibold text-foreground line-clamp-2">{video.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.play_count?.toLocaleString() || 0}
                        </span>
                        <span>{formatDate(video.created_at)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Videos;
