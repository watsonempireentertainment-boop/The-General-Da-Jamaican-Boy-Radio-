import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Cloud, Download, Check, AlertCircle, Loader2, Music, Link2, Plus, Trash2, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackInfo {
  id: string;
  title: string;
  author?: string;
  thumbnail_url: string | null;
  permalink_url: string;
  duration: string;
  playback_count: number;
  media_type?: string;
  platform?: string;
}

interface ImportedTrack {
  title: string;
  status: 'pending' | 'imported' | 'duplicate' | 'error';
  message?: string;
}

interface Platform {
  id: string;
  name: string;
  color: string;
  icon: string;
  placeholder: string;
  supported: boolean;
}

const MusicImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [trackUrls, setTrackUrls] = useState<string[]>(['']);
  const [bulkUrls, setBulkUrls] = useState('');
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [importResults, setImportResults] = useState<ImportedTrack[]>([]);
  const [existingTitles, setExistingTitles] = useState<Set<string>>(new Set());
  const [showBulkInput, setShowBulkInput] = useState(false);

  const platforms: Platform[] = [
    { 
      id: 'soundcloud', 
      name: 'SoundCloud', 
      color: 'text-orange-500', 
      icon: '🔊', 
      placeholder: 'https://soundcloud.com/artist/track-name',
      supported: true 
    },
    { 
      id: 'youtube', 
      name: 'YouTube', 
      color: 'text-red-500', 
      icon: '▶️', 
      placeholder: 'https://youtube.com/watch?v=VIDEO_ID',
      supported: true 
    },
    { 
      id: 'spotify', 
      name: 'Spotify', 
      color: 'text-green-500', 
      icon: '🎵', 
      placeholder: 'https://open.spotify.com/track/...',
      supported: false 
    },
    { 
      id: 'apple', 
      name: 'Apple Music', 
      color: 'text-pink-500', 
      icon: '🍎', 
      placeholder: 'https://music.apple.com/...',
      supported: false 
    },
    { 
      id: 'audiomack', 
      name: 'Audiomack', 
      color: 'text-orange-400', 
      icon: '🎧', 
      placeholder: 'https://audiomack.com/...',
      supported: false 
    },
    { 
      id: 'bandcamp', 
      name: 'Bandcamp', 
      color: 'text-blue-500', 
      icon: '💿', 
      placeholder: 'https://artist.bandcamp.com/track/...',
      supported: false 
    },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchExistingSongs();
    }
  }, [isOpen]);

  const fetchExistingSongs = async () => {
    const { data } = await supabase
      .from('media')
      .select('title');
    
    if (data) {
      const titles = new Set(data.map(t => t.title.toLowerCase().trim()));
      setExistingTitles(titles);
    }
  };

  const addUrlField = () => {
    setTrackUrls([...trackUrls, '']);
  };

  const removeUrlField = (index: number) => {
    setTrackUrls(trackUrls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, value: string) => {
    const updated = [...trackUrls];
    updated[index] = value;
    setTrackUrls(updated);
  };

  const processBulkUrls = () => {
    const urls = bulkUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);
    
    if (urls.length > 0) {
      setTrackUrls(urls);
      setShowBulkInput(false);
      setBulkUrls('');
      toast.success(`Added ${urls.length} URLs`);
    }
  };

  const fetchTrackInfo = async (url: string): Promise<TrackInfo | null> => {
    if (!activePlatform) return null;

    try {
      const { data, error } = await supabase.functions.invoke('soundcloud-import', {
        body: { 
          action: 'fetch_track_info', 
          trackUrl: url,
          platform: activePlatform 
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return {
        ...data.track,
        platform: activePlatform
      };
    } catch (error: any) {
      console.error('Fetch track info error:', error);
      toast.error(`Failed to fetch: ${url.substring(0, 50)}...`);
      return null;
    }
  };

  const handleFetchTracks = async () => {
    const validUrls = trackUrls.filter(u => u.trim().length > 0);
    if (validUrls.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }

    setIsFetching(true);
    setTracks([]);
    setImportResults([]);

    const fetchedTracks: TrackInfo[] = [];

    for (const url of validUrls) {
      const trackInfo = await fetchTrackInfo(url);
      if (trackInfo) {
        fetchedTracks.push(trackInfo);
      }
    }

    setTracks(fetchedTracks);
    
    if (fetchedTracks.length > 0) {
      toast.success(`Found ${fetchedTracks.length} track${fetchedTracks.length > 1 ? 's' : ''}`);
    }

    setIsFetching(false);
  };

  const checkDuplicate = (title: string): boolean => {
    const normalizedTitle = title.toLowerCase().trim();
    return existingTitles.has(normalizedTitle);
  };

  const importTrack = async (track: TrackInfo): Promise<ImportedTrack> => {
    if (checkDuplicate(track.title)) {
      return {
        title: track.title,
        status: 'duplicate',
        message: 'Song with this name already exists'
      };
    }

    try {
      const { error } = await supabase
        .from('media')
        .insert({
          title: track.title,
          media_type: track.media_type || 'track',
          url: track.permalink_url,
          thumbnail_url: track.thumbnail_url,
          duration: track.duration,
          play_count: track.playback_count || 0,
          platform_links: {
            [track.platform || 'external']: track.permalink_url
          }
        });

      if (error) throw error;

      existingTitles.add(track.title.toLowerCase().trim());

      return {
        title: track.title,
        status: 'imported',
        message: 'Successfully imported'
      };
    } catch (error: any) {
      return {
        title: track.title,
        status: 'error',
        message: error.message
      };
    }
  };

  const handleImportAll = async () => {
    if (tracks.length === 0) {
      toast.error('No tracks to import');
      return;
    }

    setIsImporting(true);
    const results: ImportedTrack[] = [];

    for (const track of tracks) {
      const result = await importTrack(track);
      results.push(result);
      setImportResults([...results]);
    }

    const imported = results.filter(r => r.status === 'imported').length;
    const duplicates = results.filter(r => r.status === 'duplicate').length;
    const errors = results.filter(r => r.status === 'error').length;

    if (imported > 0) toast.success(`Imported ${imported} item${imported > 1 ? 's' : ''}`);
    if (duplicates > 0) toast.warning(`Skipped ${duplicates} duplicate${duplicates > 1 ? 's' : ''}`);
    if (errors > 0) toast.error(`Failed to import ${errors} item${errors > 1 ? 's' : ''}`);

    setIsImporting(false);
  };

  const currentPlatform = platforms.find(p => p.id === activePlatform);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Cloud className="w-4 h-4" />
          Import Music
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Import Music & Videos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Platform</CardTitle>
              <CardDescription>
                Choose a platform to import from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {platforms.map((platform) => (
                  <Button
                    key={platform.id}
                    variant={activePlatform === platform.id ? 'default' : 'outline'}
                    className={`h-auto py-4 flex flex-col gap-2 ${!platform.supported ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (platform.supported) {
                        setActivePlatform(platform.id);
                        setTracks([]);
                        setImportResults([]);
                      } else {
                        toast.info(`${platform.name} import coming soon!`);
                      }
                    }}
                  >
                    <span className="text-2xl">{platform.icon}</span>
                    <span className={platform.color}>{platform.name}</span>
                    {platform.supported ? (
                      <span className="text-xs text-rasta-green">Ready</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Coming Soon</span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Track URL Input */}
          {activePlatform && currentPlatform?.supported && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Enter {currentPlatform.id === 'youtube' ? 'Video' : 'Track'} URLs
                </CardTitle>
                <CardDescription>
                  Paste individual {currentPlatform.name} URLs (one per field)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showBulkInput ? (
                  <div className="space-y-2">
                    <Label>Paste multiple URLs (one per line)</Label>
                    <Textarea
                      placeholder={`${currentPlatform.placeholder}\n${currentPlatform.placeholder}\n...`}
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      rows={6}
                    />
                    <div className="flex gap-2">
                      <Button onClick={processBulkUrls} size="sm">
                        Process URLs
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowBulkInput(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {trackUrls.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={currentPlatform.placeholder}
                            value={url}
                            onChange={(e) => updateUrl(index, e.target.value)}
                          />
                          {trackUrls.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeUrlField(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={addUrlField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another URL
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowBulkInput(true)}>
                        Bulk Paste
                      </Button>
                      <Button 
                        onClick={handleFetchTracks}
                        disabled={isFetching}
                        size="sm"
                      >
                        {isFetching ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Fetch Info
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Duplicate Prevention Notice */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Duplicate Prevention Active</p>
                  <p className="text-muted-foreground">
                    Items with the same name will not be uploaded twice. 
                    Currently {existingTitles.size} items in your library.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracks to Import */}
          {tracks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Found {tracks.length} Item{tracks.length > 1 ? 's' : ''}</span>
                  <Button 
                    onClick={handleImportAll}
                    disabled={isImporting}
                    size="sm"
                    variant="gold"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Import All
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tracks.map((track) => {
                    const result = importResults.find(r => r.title === track.title);
                    const isDuplicate = checkDuplicate(track.title);
                    
                    return (
                      <div 
                        key={track.id}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          isDuplicate ? 'bg-muted/50 opacity-60' : 'bg-card'
                        }`}
                      >
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {track.thumbnail_url ? (
                            <img 
                              src={track.thumbnail_url} 
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : track.media_type === 'video' ? (
                            <Video className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Music className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {track.author && `${track.author} • `}
                            {track.media_type === 'video' ? 'Video' : 'Track'}
                            {' • '}{track.platform}
                          </p>
                        </div>
                        <div>
                          {result?.status === 'imported' && (
                            <Check className="w-5 h-5 text-rasta-green" />
                          )}
                          {result?.status === 'duplicate' && (
                            <span className="text-xs text-muted-foreground">Duplicate</span>
                          )}
                          {result?.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          )}
                          {!result && isDuplicate && (
                            <span className="text-xs text-muted-foreground">Already exists</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MusicImport;
