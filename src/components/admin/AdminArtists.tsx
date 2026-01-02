import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, CheckCircle, XCircle, Shield, Trash2 } from 'lucide-react';

interface ArtistAccount {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  is_approved: boolean;
  is_verified: boolean;
  created_at: string;
}

const AdminArtists = () => {
  const { toast } = useToast();
  const [artists, setArtists] = useState<ArtistAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    const { data, error } = await supabase
      .from('artist_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setArtists(data);
    setIsLoading(false);
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('artist_accounts')
      .update({ is_approved: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update artist status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Artist ${!currentStatus ? 'approved' : 'unapproved'}`,
      });
      fetchArtists();
    }
  };

  const handleToggleVerified = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('artist_accounts')
      .update({ is_verified: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Artist ${!currentStatus ? 'verified' : 'unverified'}`,
      });
      fetchArtists();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artist account?')) return;

    const { error } = await supabase.from('artist_accounts').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete artist',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: 'Artist account has been removed',
      });
      fetchArtists();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingArtists = artists.filter((a) => !a.is_approved);
  const approvedArtists = artists.filter((a) => a.is_approved);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl mb-4">
          Pending Approval ({pendingArtists.length})
        </h2>
        {pendingArtists.length === 0 ? (
          <p className="text-muted-foreground">No pending artist applications</p>
        ) : (
          <div className="grid gap-4">
            {pendingArtists.map((artist) => (
              <Card key={artist.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {artist.profile_photo_url ? (
                        <img
                          src={artist.profile_photo_url}
                          alt={artist.artist_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg sm:text-xl truncate">{artist.artist_name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Applied {new Date(artist.created_at).toLocaleDateString()}
                      </p>
                      {artist.bio && (
                        <p className="text-xs sm:text-sm mt-2 text-muted-foreground line-clamp-2">
                          {artist.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleToggleApproval(artist.id, artist.is_approved)}
                          className="bg-rasta-green hover:bg-rasta-green/90 text-xs sm:text-sm"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(artist.id)}
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
        <h2 className="font-display text-2xl mb-4">Approved Artists ({approvedArtists.length})</h2>
        <div className="grid gap-4">
          {approvedArtists.map((artist) => (
            <Card key={artist.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {artist.profile_photo_url ? (
                        <img
                          src={artist.profile_photo_url}
                          alt={artist.artist_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm sm:text-base truncate">{artist.artist_name}</h3>
                        {artist.is_verified && (
                          <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Approved {new Date(artist.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Button
                      size="sm"
                      variant={artist.is_verified ? 'default' : 'outline'}
                      onClick={() => handleToggleVerified(artist.id, artist.is_verified)}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">{artist.is_verified ? 'Verified' : 'Verify'}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleApproval(artist.id, artist.is_approved)}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Unapprove</span>
                      <XCircle className="w-3 h-3 sm:hidden" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(artist.id)}
                      className="px-2"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminArtists;