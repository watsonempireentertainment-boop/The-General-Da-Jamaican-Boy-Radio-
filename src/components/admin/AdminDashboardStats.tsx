import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Video, Disc, Eye, Download, Star } from 'lucide-react';

interface Stats {
  totalTracks: number;
  totalVideos: number;
  featuredTracks: number;
  featuredVideos: number;
  totalAlbums: number;
  publishedAlbums: number;
  downloadsEnabled: number;
  totalPlays: number;
}

const AdminDashboardStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalTracks: 0,
    totalVideos: 0,
    featuredTracks: 0,
    featuredVideos: 0,
    totalAlbums: 0,
    publishedAlbums: 0,
    downloadsEnabled: 0,
    totalPlays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch track counts
      const { count: trackCount } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('media_type', 'track');

      const { count: videoCount } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('media_type', 'video');

      const { count: featuredTrackCount } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('media_type', 'track')
        .eq('is_featured', true);

      const { count: featuredVideoCount } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('media_type', 'video')
        .eq('is_featured', true);

      // Fetch album counts
      const { count: albumCount } = await supabase
        .from('albums')
        .select('*', { count: 'exact', head: true });

      const { count: publishedCount } = await supabase
        .from('albums')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      const { count: downloadCount } = await supabase
        .from('albums')
        .select('*', { count: 'exact', head: true })
        .eq('allow_download', true);

      // Get total plays
      const { data: playsData } = await supabase
        .from('media')
        .select('play_count');

      const totalPlays = playsData?.reduce((sum, item) => sum + (item.play_count || 0), 0) || 0;

      setStats({
        totalTracks: trackCount || 0,
        totalVideos: videoCount || 0,
        featuredTracks: featuredTrackCount || 0,
        featuredVideos: featuredVideoCount || 0,
        totalAlbums: albumCount || 0,
        publishedAlbums: publishedCount || 0,
        downloadsEnabled: downloadCount || 0,
        totalPlays,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Media Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalTracks}</p>
                <p className="text-xs text-muted-foreground">Total Tracks</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-rasta-green/10 rounded-lg">
                <Star className="w-5 h-5 text-rasta-green" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.featuredTracks}</p>
                <p className="text-xs text-muted-foreground">Featured Tracks</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-rasta-red/10 rounded-lg">
                <Video className="w-5 h-5 text-rasta-red" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalVideos}</p>
                <p className="text-xs text-muted-foreground">Total Videos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.featuredVideos}</p>
                <p className="text-xs text-muted-foreground">Featured Videos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Albums & Downloads</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Disc className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalAlbums}</p>
                <p className="text-xs text-muted-foreground">Total Albums</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-rasta-green/10 rounded-lg">
                <Eye className="w-5 h-5 text-rasta-green" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.publishedAlbums}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-rasta-red/10 rounded-lg">
                <Download className="w-5 h-5 text-rasta-red" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.downloadsEnabled}</p>
                <p className="text-xs text-muted-foreground">Downloads Enabled</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalPlays.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Plays</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardStats;
