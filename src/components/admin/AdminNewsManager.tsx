import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Eye, EyeOff, Edit, Image, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface News {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string;
}

const AdminNewsManager = () => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    category: 'News',
    is_published: false,
  });

  const { toast } = useToast();

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load news', variant: 'destructive' });
    } else {
      setNews(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `news-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: 'Upload Failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
    setFormData({ ...formData, image_url: publicUrl });
    setUploading(false);
    toast({ title: 'Uploaded', description: 'Image uploaded successfully' });
  };

  const resetForm = () => {
    setFormData({ title: '', excerpt: '', content: '', image_url: '', category: 'News', is_published: false });
    setEditingId(null);
  };

  const handleEdit = (item: News) => {
    setFormData({
      title: item.title,
      excerpt: item.excerpt || '',
      content: item.content || '',
      image_url: item.image_url || '',
      category: item.category || 'News',
      is_published: item.is_published || false,
    });
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: formData.title,
      excerpt: formData.excerpt || null,
      content: formData.content || null,
      image_url: formData.image_url || null,
      category: formData.category,
      is_published: formData.is_published,
      published_at: formData.is_published ? new Date().toISOString() : null,
    };

    if (editingId) {
      const { error } = await supabase.from('news').update(payload).eq('id', editingId);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Updated', description: 'News article updated' });
        setIsDialogOpen(false);
        resetForm();
        fetchNews();
      }
    } else {
      const { error } = await supabase.from('news').insert(payload);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Created', description: 'News article created' });
        setIsDialogOpen(false);
        resetForm();
        fetchNews();
      }
    }
  };

  const togglePublished = async (id: string, current: boolean | null) => {
    const { error } = await supabase
      .from('news')
      .update({ 
        is_published: !current, 
        published_at: !current ? new Date().toISOString() : null 
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchNews();
    }
  };

  const deleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Article deleted successfully' });
      fetchNews();
    }
  };

  const generateAIArticle = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-news', {
        body: { topic: aiTopic || null }
      });

      if (error) throw error;

      if (data?.success && data?.article) {
        setFormData({
          title: data.article.title,
          excerpt: data.article.excerpt,
          content: data.article.content,
          image_url: '',
          category: data.article.category,
          is_published: false,
        });
        setAiTopic('');
        setIsDialogOpen(true);
        toast({ title: 'Article Generated', description: 'AI wrote a new article. Review and publish!' });
      } else {
        throw new Error(data?.error || 'Failed to generate article');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({ 
        title: 'Generation Failed', 
        description: error instanceof Error ? error.message : 'Could not generate article',
        variant: 'destructive' 
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl sm:text-3xl text-foreground">NEWS & BLOG</h2>
          <p className="text-muted-foreground text-sm">Manage articles and updates</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 mr-2" />
                New Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {editingId ? 'EDIT ARTICLE' : 'NEW ARTICLE'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., News, Music, Tour"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                    placeholder="Brief summary for previews..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    placeholder="Full article content..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="w-full max-h-48 object-cover rounded" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label>Publish immediately</Label>
                </div>

                <Button type="submit" className="w-full" variant="gold" disabled={uploading}>
                  {editingId ? 'Update Article' : 'Create Article'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI News Generator */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1">
            <Label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI News Writer
            </Label>
            <Input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Optional topic (e.g., 'new album release', 'upcoming tour')"
              className="bg-background"
            />
          </div>
          <Button 
            onClick={generateAIArticle} 
            disabled={generating}
            variant="gold"
            className="whitespace-nowrap"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Writing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Article
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          AI will write a news article about The General Da Jamaican Boy. Leave topic blank for a random article.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No articles yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {news.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="w-full sm:w-24 h-32 sm:h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${item.is_published ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                    {item.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 mt-2">
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 px-2">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublished(item.id, item.is_published)}
                    className="h-8 px-2"
                  >
                    {item.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNews(item.id)}
                    className="text-destructive hover:text-destructive h-8 px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNewsManager;
