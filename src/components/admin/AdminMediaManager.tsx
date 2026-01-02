import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Star, Music, Video, Image, Upload, Disc, Edit, Play, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Album {
  id: string;
  title: string;
  album_type: string;
}

interface Media {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  url: string;
  thumbnail_url: string | null;
  duration: string | null;
  is_featured: boolean | null;
  play_count: number | null;
  created_at: string;
  album_id: string | null;
}

const AdminMediaManager = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'track' | 'video' | 'photo'>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_type: 'track',
    url: '',
    thumbnail_url: '',
    duration: '',
    is_featured: false,
    use_youtube: false,
    youtube_url: '',
    album_id: '',
  });

  const { toast } = useToast();

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  const fetchMedia = async () => {
    let query = supabase.from('media').select('*').order('created_at', { ascending: false });
    
    if (filter !== 'all') {
      query = query.eq('media_type', filter);
    }

    const { data, error } = await query;
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to load media', variant: 'destructive' });
    } else {
      setMedia(data || []);
    }
    setLoading(false);
  };

  const fetchAlbums = async () => {
    const { data } = await supabase
      .from('albums')
      .select('id, title, album_type')
      .order('title');
    if (data) setAlbums(data);
  };

  useEffect(() => {
    fetchMedia();
    fetchAlbums();
  }, [filter]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const bucket = type === 'thumbnail' ? 'covers' : 'media';

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: 'Upload Failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

    if (type === 'thumbnail') {
      setFormData({ ...formData, thumbnail_url: publicUrl });
    } else {
      setFormData({ ...formData, url: publicUrl });
    }
    setUploading(false);
    toast({ title: 'Uploaded', description: 'File uploaded successfully' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalUrl = formData.url;
    let finalThumbnail = formData.thumbnail_url;

    // Handle YouTube URL
    if (formData.use_youtube && formData.youtube_url) {
      const videoId = extractYouTubeId(formData.youtube_url);
      if (!videoId) {
        toast({ title: 'Invalid URL', description: 'Please enter a valid YouTube URL', variant: 'destructive' });
        return;
      }
      finalUrl = formData.youtube_url;
      if (!finalThumbnail) {
        finalThumbnail = getYouTubeThumbnail(videoId);
      }
    }

    const payload = {
      title: formData.title,
      description: formData.description || null,
      media_type: formData.media_type,
      url: finalUrl,
      thumbnail_url: finalThumbnail || null,
      duration: formData.duration || null,
      is_featured: formData.is_featured,
      album_id: formData.album_id || null,
    };

    if (editingMedia) {
      const { error } = await supabase.from('media').update(payload).eq('id', editingMedia.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Media updated successfully' });
        closeDialog();
        fetchMedia();
      }
    } else {
      const { error } = await supabase.from('media').insert(payload);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Media added successfully' });
        closeDialog();
        fetchMedia();
      }
    }
  };

  const openEditDialog = (item: Media) => {
    setEditingMedia(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      media_type: item.media_type,
      url: item.url,
      thumbnail_url: item.thumbnail_url || '',
      duration: item.duration || '',
      is_featured: item.is_featured || false,
      use_youtube: item.url.includes('youtube.com') || item.url.includes('youtu.be'),
      youtube_url: item.url.includes('youtube') ? item.url : '',
      album_id: item.album_id || '',
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingMedia(null);
    setFormData({ title: '', description: '', media_type: 'track', url: '', thumbnail_url: '', duration: '', is_featured: false, use_youtube: false, youtube_url: '', album_id: '' });
  };

  const toggleFeatured = async (id: string, current: boolean | null) => {
    const { error } = await supabase.from('media').update({ is_featured: !current }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchMedia();
    }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const { error } = await supabase.from('media').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Media deleted successfully' });
      fetchMedia();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'track': return <Music className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'photo': return <Image className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  const getAlbumName = (albumId: string | null) => {
    if (!albumId) return null;
    const album = albums.find(a => a.id === albumId);
    return album ? album.title : null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl sm:text-3xl text-foreground">MEDIA LIBRARY</h2>
          <p className="text-muted-foreground text-sm">Manage tracks, videos, and photos</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Add Media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{editingMedia ? 'EDIT MEDIA' : 'ADD NEW MEDIA'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-2">
                  {['track', 'video', 'photo'].map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={formData.media_type === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, media_type: type })}
                    >
                      {getIcon(type)}
                      <span className="ml-2 capitalize">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {formData.media_type === 'video' && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Switch
                    checked={formData.use_youtube}
                    onCheckedChange={(checked) => setFormData({ ...formData, use_youtube: checked, url: '', youtube_url: '' })}
                  />
                  <Label className="text-sm">Use YouTube URL</Label>
                </div>
              )}

              {formData.use_youtube && formData.media_type === 'video' ? (
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <Input
                    placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  />
                  {formData.youtube_url && extractYouTubeId(formData.youtube_url) && (
                    <div className="mt-2">
                      <img 
                        src={getYouTubeThumbnail(extractYouTubeId(formData.youtube_url)!)} 
                        alt="YouTube thumbnail" 
                        className="w-full max-w-xs rounded"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept={formData.media_type === 'track' ? 'audio/*' : formData.media_type === 'video' ? 'video/*' : 'image/*'}
                      onChange={(e) => handleFileUpload(e, 'media')}
                      disabled={uploading}
                    />
                  </div>
                  {formData.url && <p className="text-xs text-muted-foreground truncate">{formData.url}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label>Thumbnail/Cover</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'thumbnail')}
                  disabled={uploading}
                />
                {formData.thumbnail_url && (
                  <img src={formData.thumbnail_url} alt="Thumbnail" className="w-20 h-20 object-cover rounded" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 4:32"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              {/* Album selector for tracks */}
              {formData.media_type === 'track' && albums.length > 0 && (
                <div className="space-y-2">
                  <Label>Album (Optional)</Label>
                  <Select
                    value={formData.album_id}
                    onValueChange={(value) => setFormData({ ...formData, album_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an album" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Album</SelectItem>
                      {albums.map((album) => (
                        <SelectItem key={album.id} value={album.id}>
                          <span className="flex items-center gap-2">
                            <Disc className="w-3 h-3" />
                            {album.title} ({album.album_type})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label>Featured on homepage</Label>
              </div>

              <Button type="submit" className="w-full" variant="gold" disabled={uploading || (!formData.url && !formData.youtube_url && !editingMedia)}>
                {uploading ? 'Uploading...' : editingMedia ? 'Update Media' : 'Add Media'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {['all', 'track', 'video', 'photo'].map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type as typeof filter)}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            {type === 'all' ? 'All' : getIcon(type)}
            <span className="ml-1 sm:ml-2 capitalize">{type}</span>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No media found. Add your first item!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-8 px-2 sm:px-4">#</TableHead>
                  <TableHead className="px-2 sm:px-4">Title</TableHead>
                  <TableHead className="hidden md:table-cell px-2">Type</TableHead>
                  <TableHead className="hidden lg:table-cell px-2">Album</TableHead>
                  <TableHead className="hidden sm:table-cell px-2">Duration</TableHead>
                  <TableHead className="hidden md:table-cell text-center px-2">Plays</TableHead>
                  <TableHead className="text-center px-2">Status</TableHead>
                  <TableHead className="w-10 sm:w-16 text-right px-2 sm:px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.map((item, index) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="font-mono text-muted-foreground text-xs sm:text-sm px-2 sm:px-4">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-2 sm:px-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative group/thumb">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              {getIcon(item.media_type)}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] hidden sm:block">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-2">
                      <Badge variant="outline" className="gap-1 capitalize text-xs">
                        {getIcon(item.media_type)}
                        <span className="hidden lg:inline">{item.media_type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-2">
                      {item.album_id && getAlbumName(item.album_id) ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Disc className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">{getAlbumName(item.album_id)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs px-2">
                      {item.duration || '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center px-2">
                      <span className="text-xs text-muted-foreground">{item.play_count?.toLocaleString() || '0'}</span>
                    </TableCell>
                    <TableCell className="text-center px-2">
                      {item.is_featured ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 text-xs px-1.5 py-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span className="hidden sm:inline">Featured</span>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-2 sm:px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                            <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFeatured(item.id, item.is_featured)}>
                            <Star className={`w-4 h-4 mr-2 ${item.is_featured ? 'fill-primary text-primary' : ''}`} />
                            {item.is_featured ? 'Remove Featured' : 'Set Featured'}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open File
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMedia(item.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Summary Footer */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <span>{media.length} {media.length === 1 ? 'item' : 'items'}</span>
            <span>{media.filter(m => m.is_featured).length} featured</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMediaManager;
