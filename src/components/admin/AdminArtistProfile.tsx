import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, Instagram, Facebook, Twitter, Youtube, Music } from 'lucide-react';

interface ArtistProfile {
  id: string;
  name: string;
  bio: string | null;
  cover_photo_url: string | null;
  profile_photo_url: string | null;
  social_links: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
  } | null;
}

const AdminArtistProfile = () => {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('artist_profile')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } else if (data) {
      setProfile({
        ...data,
        social_links: typeof data.social_links === 'object' ? data.social_links as ArtistProfile['social_links'] : null
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Upload Failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName);

    if (type === 'profile') {
      setProfile({ ...profile, profile_photo_url: publicUrl });
    } else {
      setProfile({ ...profile, cover_photo_url: publicUrl });
    }
    setUploading(false);
    toast({ title: 'Uploaded', description: 'Photo uploaded successfully' });
  };

  const handleSocialChange = (platform: string, value: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      social_links: {
        ...profile.social_links,
        [platform]: value,
      },
    });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from('artist_profile')
      .update({
        name: profile.name,
        bio: profile.bio,
        cover_photo_url: profile.cover_photo_url,
        profile_photo_url: profile.profile_photo_url,
        social_links: profile.social_links,
      })
      .eq('id', profile.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Profile updated successfully' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No profile found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-foreground">ARTIST PROFILE</h2>
          <p className="text-muted-foreground">Edit The General's public profile</p>
        </div>
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Cover Photo */}
      <div className="space-y-4">
        <Label>Cover Photo</Label>
        <div className="relative aspect-[3/1] bg-muted rounded-lg overflow-hidden border border-border">
          {profile.cover_photo_url ? (
            <img src={profile.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No cover photo
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 hover:opacity-100 transition-opacity">
            <label className="cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'cover')}
                disabled={uploading}
              />
              <Button variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Cover
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      {/* Profile Photo */}
      <div className="flex items-start gap-6">
        <div className="space-y-4">
          <Label>Profile Photo</Label>
          <div className="relative w-32 h-32 bg-muted rounded-full overflow-hidden border-4 border-primary">
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No photo
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'profile')}
                disabled={uploading}
              />
              <Upload className="w-6 h-6" />
            </label>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Artist Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <Label>Social Media Links</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Instagram URL"
              value={profile.social_links?.instagram || ''}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Facebook URL"
              value={profile.social_links?.facebook || ''}
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Twitter className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Twitter URL"
              value={profile.social_links?.twitter || ''}
              onChange={(e) => handleSocialChange('twitter', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="YouTube URL"
              value={profile.social_links?.youtube || ''}
              onChange={(e) => handleSocialChange('youtube', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Spotify URL"
              value={profile.social_links?.spotify || ''}
              onChange={(e) => handleSocialChange('spotify', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminArtistProfile;
