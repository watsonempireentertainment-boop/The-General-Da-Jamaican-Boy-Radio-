import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Disc, Music, Eye, EyeOff, Upload, Loader2 } from 'lucide-react';

interface Album {
  id: string;
  title: string;
  album_type: string;
  cover_url: string | null;
  release_date: string | null;
  description: string | null;
  is_published: boolean;
  allow_download: boolean;
  created_at: string;
}

interface Track {
  id: string;
  title: string;
  album_id: string | null;
}

const AdminAlbums = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    album_type: 'album',
    cover_url: '',
    release_date: '',
    description: '',
    is_published: false,
    allow_download: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [albumsRes, tracksRes] = await Promise.all([
      supabase.from('albums').select('*').order('created_at', { ascending: false }),
      supabase.from('media').select('id, title, album_id').eq('media_type', 'track'),
    ]);

    if (albumsRes.data) setAlbums(albumsRes.data);
    if (tracksRes.data) setTracks(tracksRes.data);
    setLoading(false);
  };

  const getTrackCount = (albumId: string) => {
    return tracks.filter(t => t.album_id === albumId).length;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `album-covers/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_url: urlData.publicUrl }));
      toast.success('Cover uploaded successfully');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      title: formData.title,
      album_type: formData.album_type,
      cover_url: formData.cover_url || null,
      release_date: formData.release_date || null,
      description: formData.description || null,
      is_published: formData.is_published,
      allow_download: formData.allow_download,
    };

    if (editingAlbum) {
      const { error } = await supabase
        .from('albums')
        .update(payload)
        .eq('id', editingAlbum.id);

      if (error) {
        toast.error('Failed to update album');
        return;
      }
      toast.success('Album updated!');
    } else {
      const { error } = await supabase
        .from('albums')
        .insert(payload);

      if (error) {
        toast.error('Failed to create album');
        return;
      }
      toast.success('Album created!');
    }

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleEdit = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title,
      album_type: album.album_type,
      cover_url: album.cover_url || '',
      release_date: album.release_date || '',
      description: album.description || '',
      is_published: album.is_published,
      allow_download: album.allow_download || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this album? Tracks will be unlinked but not deleted.')) return;

    const { error } = await supabase.from('albums').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete album');
      return;
    }
    toast.success('Album deleted');
    fetchData();
  };

  const togglePublish = async (album: Album) => {
    const { error } = await supabase
      .from('albums')
      .update({ is_published: !album.is_published })
      .eq('id', album.id);

    if (error) {
      toast.error('Failed to update album');
      return;
    }
    toast.success(album.is_published ? 'Album unpublished' : 'Album published');
    fetchData();
  };

  const resetForm = () => {
    setEditingAlbum(null);
    setFormData({
      title: '',
      album_type: 'album',
      cover_url: '',
      release_date: '',
      description: '',
      is_published: false,
      allow_download: false,
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mixtape': return 'Mixtape';
      case 'ep': return 'EP';
      case 'single': return 'Single';
      default: return 'Album';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-foreground">Albums & Mixtapes</h2>
          <p className="text-muted-foreground">Manage your albums, EPs, and mixtapes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Album
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAlbum ? 'Edit Album' : 'Create New Album'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Album title"
                  required
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.album_type}
                  onValueChange={(v) => setFormData({ ...formData, album_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="album">Album</SelectItem>
                    <SelectItem value="mixtape">Mixtape</SelectItem>
                    <SelectItem value="ep">EP</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cover Image</Label>
                {formData.cover_url && (
                  <img
                    src={formData.cover_url}
                    alt="Cover preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex gap-2">
                  <label className="cursor-pointer flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span className="text-sm">{uploading ? 'Uploading...' : 'Upload Cover'}</span>
                    </div>
                  </label>
                </div>
                <Input
                  value={formData.cover_url}
                  onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                  placeholder="Or enter cover URL"
                />
              </div>
              <div>
                <Label>Release Date</Label>
                <Input
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="About this album..."
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="publish"
                  checked={formData.is_published}
                  onCheckedChange={(c) => setFormData({ ...formData, is_published: c })}
                />
                <Label htmlFor="publish">Publish immediately</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="allow_download"
                  checked={formData.allow_download}
                  onCheckedChange={(c) => setFormData({ ...formData, allow_download: c })}
                />
                <Label htmlFor="allow_download">Allow downloads</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAlbum ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {albums.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Disc className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No Albums Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first album or mixtape</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Album
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <Card key={album.id} className={!album.is_published ? 'opacity-60' : ''}>
              <div className="relative aspect-video bg-muted">
                {album.cover_url ? (
                  <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rasta-red via-primary to-rasta-green">
                    <Disc className="w-16 h-16 text-primary-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-full">
                    {getTypeLabel(album.album_type)}
                  </span>
                  {!album.is_published && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-500/80 text-black rounded-full">
                      Draft
                    </span>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">{album.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Music className="w-3 h-3" />
                  <span>{getTrackCount(album.id)} tracks</span>
                  {album.release_date && (
                    <>
                      <span>•</span>
                      <span>{new Date(album.release_date).getFullYear()}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(album)} className="flex-1 gap-1">
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => togglePublish(album)}>
                    {album.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(album.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAlbums;
