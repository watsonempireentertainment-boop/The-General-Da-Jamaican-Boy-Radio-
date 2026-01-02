import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Music, Check, Loader2 } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
}

interface AddToPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackTitle: string;
}

const AddToPlaylistModal = ({ open, onOpenChange, trackId, trackTitle }: AddToPlaylistModalProps) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchPlaylists();
      checkExistingAdditions();
    }
  }, [open, trackId]);

  const fetchPlaylists = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('playlists')
      .select('id, name, description')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setPlaylists(data);
    setLoading(false);
  };

  const checkExistingAdditions = async () => {
    const { data } = await supabase
      .from('playlist_tracks')
      .select('playlist_id')
      .eq('track_id', trackId);

    if (data) {
      setAddedTo(new Set(data.map(d => d.playlist_id)));
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to create playlists');
      setCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        name: newPlaylistName.trim()
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create playlist');
    } else if (data) {
      setPlaylists([data, ...playlists]);
      setNewPlaylistName('');
      setShowCreate(false);
      toast.success(`Playlist "${data.name}" created!`);
    }
    setCreating(false);
  };

  const addToPlaylist = async (playlistId: string, playlistName: string) => {
    if (addedTo.has(playlistId)) {
      // Remove from playlist
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) {
        toast.error('Failed to remove from playlist');
      } else {
        setAddedTo(prev => {
          const next = new Set(prev);
          next.delete(playlistId);
          return next;
        });
        toast.success(`Removed from "${playlistName}"`);
      }
    } else {
      // Add to playlist
      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: 0
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in this playlist');
        } else {
          toast.error('Failed to add to playlist');
        }
      } else {
        setAddedTo(prev => new Set(prev).add(playlistId));
        toast.success(`Added to "${playlistName}"`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add to Playlist</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{trackTitle}</p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Create new playlist */}
          {showCreate ? (
            <div className="flex gap-2">
              <Input
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                autoFocus
              />
              <Button onClick={createPlaylist} disabled={creating || !newPlaylistName.trim()}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" />
              Create New Playlist
            </Button>
          )}

          {/* Playlist list */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No playlists yet</p>
                <p className="text-sm">Create your first playlist above</p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => addToPlaylist(playlist.id, playlist.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    addedTo.has(playlist.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-primary/20 to-rasta-green/20 flex items-center justify-center">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{playlist.name}</span>
                  </div>
                  {addedTo.has(playlist.id) && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlaylistModal;