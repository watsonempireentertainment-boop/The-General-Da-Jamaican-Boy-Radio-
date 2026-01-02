import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, Music, Disc, Users, ExternalLink, Loader2 } from 'lucide-react';

interface MusicData {
  songs: Array<{ title: string; year?: string; album?: string }>;
  albums: Array<{ title: string; year?: string; tracks?: string[] }>;
  collaborations: Array<{ title: string; artist: string; year?: string }>;
  streaming_links: {
    spotify?: string;
    youtube?: string;
    soundcloud?: string;
  };
  bio_summary: string;
  social_media: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

const AdminMusicDiscovery = () => {
  const { toast } = useToast();
  const [artistName, setArtistName] = useState('The General Da Jamaican Boy');
  const [isSearching, setIsSearching] = useState(false);
  const [musicData, setMusicData] = useState<MusicData | null>(null);

  const handleSearch = async () => {
    if (!artistName.trim()) return;

    setIsSearching(true);
    setMusicData(null);

    try {
      const { data, error } = await supabase.functions.invoke('music-discovery', {
        body: { artistName },
      });

      if (error) throw error;

      if (data.success && data.data) {
        setMusicData(data.data);
        toast({
          title: 'Discovery Complete',
          description: `Found music data for ${artistName}`,
        });
      } else {
        throw new Error(data.error || 'No data found');
      }
    } catch (error: any) {
      toast({
        title: 'Discovery Failed',
        description: error.message || 'Failed to discover music',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            AI Music Discovery Agent
          </CardTitle>
          <CardDescription>
            Use AI to search the web for artist music, albums, and streaming links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Enter artist name..."
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching} variant="gold">
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Discover Music
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {musicData && (
        <div className="grid gap-6">
          {/* Bio Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Artist Bio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{musicData.bio_summary}</p>
            </CardContent>
          </Card>

          {/* Songs */}
          {musicData.songs && musicData.songs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Songs ({musicData.songs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {musicData.songs.map((song, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{song.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {song.album && `${song.album} • `}
                          {song.year}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Albums */}
          {musicData.albums && musicData.albums.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Disc className="w-5 h-5" />
                  Albums ({musicData.albums.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {musicData.albums.map((album, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{album.title}</h4>
                        <span className="text-sm text-muted-foreground">{album.year}</span>
                      </div>
                      {album.tracks && album.tracks.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {album.tracks.join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Collaborations */}
          {musicData.collaborations && musicData.collaborations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Collaborations ({musicData.collaborations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {musicData.collaborations.map((collab, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{collab.title}</p>
                        <p className="text-sm text-muted-foreground">
                          with {collab.artist} {collab.year && `• ${collab.year}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Streaming Links */}
          {musicData.streaming_links && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Streaming Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {musicData.streaming_links.spotify && (
                    <a
                      href={musicData.streaming_links.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        Spotify
                      </Button>
                    </a>
                  )}
                  {musicData.streaming_links.youtube && (
                    <a
                      href={musicData.streaming_links.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        YouTube
                      </Button>
                    </a>
                  )}
                  {musicData.streaming_links.soundcloud && (
                    <a
                      href={musicData.streaming_links.soundcloud}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        SoundCloud
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminMusicDiscovery;