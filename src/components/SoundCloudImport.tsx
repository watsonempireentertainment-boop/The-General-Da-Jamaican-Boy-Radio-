import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Cloud, Download, Check, AlertCircle, Loader2, Music, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SoundCloudTrack {
  id: number;
  title: string;
  duration: number;
  artwork_url: string | null;
  stream_url: string;
  playback_count: number;
  likes_count: number;
  permalink_url: string;
}

interface ImportedTrack {
  title: string;
  status: 'pending' | 'imported' | 'duplicate' | 'error';
  message?: string;
}

const SoundCloudImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [tracks, setTracks] = useState<SoundCloudTrack[]>([]);
  const [importResults, setImportResults] = useState<ImportedTrack[]>([]);
  const [existingTitles, setExistingTitles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchExistingSongs();
    }
  }, [isOpen]);

  const fetchExistingSongs = async () => {
    const { data } = await supabase
      .from('media')
      .select('title')
      .eq('media_type', 'track');
    
    if (data) {
      const titles = new Set(data.map(t => t.title.toLowerCase().trim()));
      setExistingTitles(titles);
    }
  };

  const handleConnectSoundCloud = async () => {
    setIsConnecting(true);
    
    // SoundCloud OAuth flow
    // For now, we'll simulate the connection since SoundCloud API requires app registration
    // In production, this would redirect to SoundCloud OAuth
    toast.info('SoundCloud API integration requires OAuth configuration. Please contact admin to set up SoundCloud credentials.');
    
    // Simulate connection for demo
    setTimeout(() => {
      setIsConnecting(false);
      // For demo purposes, show that connection would work
      toast.success('SoundCloud connection ready! Configure API credentials in backend settings.');
    }, 1500);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const checkDuplicate = (title: string): boolean => {
    const normalizedTitle = title.toLowerCase().trim();
    return existingTitles.has(normalizedTitle);
  };

  const importTrack = async (track: SoundCloudTrack): Promise<ImportedTrack> => {
    // Check for duplicates first
    if (checkDuplicate(track.title)) {
      return {
        title: track.title,
        status: 'duplicate',
        message: 'Song with this name already exists'
      };
    }

    try {
      // In production, this would download and upload the track
      // For now, we create a media entry with the SoundCloud URL
      const { error } = await supabase
        .from('media')
        .insert({
          title: track.title,
          media_type: 'track',
          url: track.permalink_url,
          thumbnail_url: track.artwork_url?.replace('-large', '-t500x500'),
          duration: formatDuration(track.duration),
          play_count: track.playback_count,
          platform_links: {
            soundcloud: track.permalink_url
          }
        });

      if (error) throw error;

      // Add to existing titles to prevent duplicates in same session
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

    if (imported > 0) {
      toast.success(`Imported ${imported} track${imported > 1 ? 's' : ''}`);
    }
    if (duplicates > 0) {
      toast.warning(`Skipped ${duplicates} duplicate${duplicates > 1 ? 's' : ''}`);
    }
    if (errors > 0) {
      toast.error(`Failed to import ${errors} track${errors > 1 ? 's' : ''}`);
    }

    setIsImporting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Cloud className="w-4 h-4" />
          Import from SoundCloud
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-orange-500" />
            Import Music from SoundCloud
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Connection Status</CardTitle>
              <CardDescription>
                Connect your SoundCloud account to import your music
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <Button 
                  onClick={handleConnectSoundCloud}
                  disabled={isConnecting}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect SoundCloud Account
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-rasta-green">
                  <Check className="w-5 h-5" />
                  Connected to SoundCloud
                </div>
              )}
            </CardContent>
          </Card>

          {/* Duplicate Prevention Notice */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Duplicate Prevention Active</p>
                  <p className="text-muted-foreground">
                    Songs with the same name will not be uploaded twice. 
                    Currently {existingTitles.size} songs in your library.
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
                  <span>Found {tracks.length} Tracks</span>
                  <Button 
                    onClick={handleImportAll}
                    disabled={isImporting}
                    size="sm"
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
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          {track.artwork_url ? (
                            <img 
                              src={track.artwork_url} 
                              alt={track.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Music className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(track.duration)} • {track.playback_count?.toLocaleString()} plays
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

          {/* Other Platforms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Other Platforms (Coming Soon)</CardTitle>
              <CardDescription>
                Import your music from other major platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" disabled className="gap-2">
                  <span className="text-green-500">●</span> Spotify
                </Button>
                <Button variant="outline" disabled className="gap-2">
                  <span className="text-red-500">●</span> YouTube Music
                </Button>
                <Button variant="outline" disabled className="gap-2">
                  <span className="text-pink-500">●</span> Apple Music
                </Button>
                <Button variant="outline" disabled className="gap-2">
                  <span className="text-orange-500">●</span> Audiomack
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SoundCloudImport;
