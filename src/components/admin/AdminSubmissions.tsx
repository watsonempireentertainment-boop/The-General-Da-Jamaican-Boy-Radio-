import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Music, Video, CheckCircle, XCircle, ExternalLink, Play } from 'lucide-react';

interface Submission {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  file_url: string;
  thumbnail_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  artist_accounts: {
    artist_name: string;
    is_approved: boolean;
  } | null;
}

const AdminSubmissions = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('music_submissions')
      .select(`
        *,
        artist_accounts (
          artist_name,
          is_approved
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
    } else {
      setSubmissions(data || []);
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('music_submissions')
      .update({
        status,
        admin_notes: adminNotes[id] || null,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update submission status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Submission ${status}`,
      });
      fetchSubmissions();
    }
  };

  const handlePublishToSite = async (submission: Submission) => {
    // Add to media table
    const { error } = await supabase.from('media').insert({
      title: submission.title,
      description: submission.description,
      media_type: submission.media_type,
      url: submission.file_url,
      thumbnail_url: submission.thumbnail_url,
      is_featured: false,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish to site',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Published!',
        description: 'Submission has been added to the site',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
  const reviewedSubmissions = submissions.filter((s) => s.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl mb-4">Pending Submissions ({pendingSubmissions.length})</h2>
        {pendingSubmissions.length === 0 ? (
          <p className="text-muted-foreground">No pending submissions</p>
        ) : (
          <div className="grid gap-4">
            {pendingSubmissions.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      {sub.thumbnail_url ? (
                        <img
                          src={sub.thumbnail_url}
                          alt={sub.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : sub.media_type === 'track' ? (
                        <Music className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      ) : (
                        <Video className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base truncate">{sub.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          by {sub.artist_accounts?.artist_name || 'Unknown Artist'}
                          {!sub.artist_accounts?.is_approved && (
                            <span className="ml-2 text-primary">(Unverified)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sub.media_type} • {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {sub.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{sub.description}</p>
                      )}
                      <a
                        href={sub.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm" className="text-xs">
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Preview
                        </Button>
                      </a>
                      <Textarea
                        placeholder="Admin notes (optional)"
                        value={adminNotes[sub.id] || ''}
                        onChange={(e) =>
                          setAdminNotes({ ...adminNotes, [sub.id]: e.target.value })
                        }
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUpdateStatus(sub.id, 'approved')}
                          className="bg-rasta-green hover:bg-rasta-green/90 text-xs sm:text-sm"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                          className="text-xs sm:text-sm"
                        >
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-2xl mb-4">Reviewed Submissions</h2>
        <div className="grid gap-4">
          {reviewedSubmissions.map((sub) => (
            <Card key={sub.id} className="opacity-75">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      {sub.media_type === 'track' ? (
                        <Music className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                      ) : (
                        <Video className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">{sub.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {sub.artist_accounts?.artist_name} •{' '}
                        <span
                          className={
                            sub.status === 'approved' ? 'text-rasta-green' : 'text-destructive'
                          }
                        >
                          {sub.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  {sub.status === 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePublishToSite(sub)}
                      className="text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Publish
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSubmissions;