import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Code2, Globe, TrendingUp, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmbedPlay {
  id: string;
  track_id: string | null;
  referrer_url: string | null;
  embed_type: string;
  played_at: string;
  user_agent: string | null;
}

interface DailyPlay {
  date: string;
  plays: number;
}

interface ReferrerData {
  domain: string;
  plays: number;
}

interface TrackPlay {
  track_id: string;
  track_title: string;
  plays: number;
}

const COLORS = ['hsl(45, 100%, 50%)', 'hsl(140, 70%, 35%)', 'hsl(0, 85%, 50%)', 'hsl(200, 70%, 50%)', 'hsl(280, 60%, 50%)'];

const AdminEmbedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [totalPlays, setTotalPlays] = useState(0);
  const [uniqueDomains, setUniqueDomains] = useState(0);
  const [dailyPlays, setDailyPlays] = useState<DailyPlay[]>([]);
  const [topReferrers, setTopReferrers] = useState<ReferrerData[]>([]);
  const [topTracks, setTopTracks] = useState<TrackPlay[]>([]);
  const [recentPlays, setRecentPlays] = useState<EmbedPlay[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const extractDomain = (url: string | null): string => {
    if (!url) return 'Direct / Unknown';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Invalid URL';
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    
    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch all embed analytics within time range
    const { data: plays, error } = await supabase
      .from('embed_analytics')
      .select('*')
      .gte('played_at', startDate.toISOString())
      .order('played_at', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
      return;
    }

    if (!plays) {
      setLoading(false);
      return;
    }

    // Calculate totals
    setTotalPlays(plays.length);
    setRecentPlays(plays.slice(0, 10));

    // Calculate unique domains
    const domains = new Set(plays.map(p => extractDomain(p.referrer_url)));
    setUniqueDomains(domains.size);

    // Calculate daily plays
    const dailyMap = new Map<string, number>();
    plays.forEach(play => {
      const date = new Date(play.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });
    
    const dailyData: DailyPlay[] = Array.from(dailyMap.entries())
      .map(([date, plays]) => ({ date, plays }))
      .reverse()
      .slice(-14); // Last 14 days
    setDailyPlays(dailyData);

    // Calculate top referrers
    const referrerMap = new Map<string, number>();
    plays.forEach(play => {
      const domain = extractDomain(play.referrer_url);
      referrerMap.set(domain, (referrerMap.get(domain) || 0) + 1);
    });
    
    const referrerData: ReferrerData[] = Array.from(referrerMap.entries())
      .map(([domain, plays]) => ({ domain, plays }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);
    setTopReferrers(referrerData);

    // Calculate top tracks
    const trackMap = new Map<string, number>();
    plays.forEach(play => {
      if (play.track_id) {
        trackMap.set(play.track_id, (trackMap.get(play.track_id) || 0) + 1);
      }
    });

    // Fetch track titles
    const trackIds = Array.from(trackMap.keys());
    if (trackIds.length > 0) {
      const { data: tracks } = await supabase
        .from('media')
        .select('id, title')
        .in('id', trackIds);

      if (tracks) {
        const trackData: TrackPlay[] = tracks
          .map(track => ({
            track_id: track.id,
            track_title: track.title,
            plays: trackMap.get(track.id) || 0
          }))
          .sort((a, b) => b.plays - a.plays)
          .slice(0, 10);
        setTopTracks(trackData);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl text-primary">Embed Analytics</h2>
          <p className="text-muted-foreground">Track how your embedded players perform</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Embed Plays</CardTitle>
            <Code2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display text-foreground">{totalPlays.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">In the last {timeRange} days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Domains</CardTitle>
            <Globe className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display text-foreground">{uniqueDomains}</div>
            <p className="text-xs text-muted-foreground mt-1">Sites embedding your player</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Daily Plays</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display text-foreground">
              {dailyPlays.length > 0 ? Math.round(totalPlays / parseInt(timeRange)) : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per day average</p>
          </CardContent>
        </Card>
      </div>

      {/* Plays Over Time Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Plays Over Time
          </CardTitle>
          <CardDescription>Daily embed plays trend</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyPlays.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyPlays}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  stroke="hsl(var(--border))"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="plays" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for this time range
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Referrers and Top Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-secondary" />
              Top Referrer Domains
            </CardTitle>
            <CardDescription>Sites driving the most plays</CardDescription>
          </CardHeader>
          <CardContent>
            {topReferrers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topReferrers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="domain" 
                    width={120}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="plays" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No referrer data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tracks */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Top Embedded Tracks
            </CardTitle>
            <CardDescription>Most played tracks on external sites</CardDescription>
          </CardHeader>
          <CardContent>
            {topTracks.length > 0 ? (
              <div className="space-y-3">
                {topTracks.map((track, index) => (
                  <div key={track.track_id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{track.track_title}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{track.plays} plays</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No track data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Plays Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Recent Embed Plays</CardTitle>
          <CardDescription>Latest plays from embedded players</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPlays.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPlays.map((play) => (
                  <TableRow key={play.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(play.played_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {extractDomain(play.referrer_url)}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                        {play.embed_type}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No embed plays recorded yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmbedAnalytics;
