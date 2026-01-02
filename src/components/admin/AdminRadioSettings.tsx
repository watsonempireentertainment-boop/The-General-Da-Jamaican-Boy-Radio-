import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Radio, Shuffle, Volume2, Megaphone, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RadioSettings {
  id: string;
  shuffle_mode: boolean;
  announcement_enabled: boolean;
  announcement_text: string | null;
  announcement_interval: number;
  auto_play: boolean;
  volume_default: number;
}

const AdminRadioSettings = () => {
  const [settings, setSettings] = useState<RadioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('radio_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      toast.error('Failed to load radio settings');
      console.error(error);
    } else if (data) {
      setSettings(data as RadioSettings);
    } else {
      // Create default settings if none exist
      const { data: newSettings, error: insertError } = await supabase
        .from('radio_settings')
        .insert({
          shuffle_mode: true,
          announcement_enabled: false,
          auto_play: true,
          volume_default: 30
        })
        .select()
        .single();

      if (insertError) {
        toast.error('Failed to create radio settings');
      } else {
        setSettings(newSettings as RadioSettings);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    const { error } = await supabase
      .from('radio_settings')
      .update({
        shuffle_mode: settings.shuffle_mode,
        announcement_enabled: settings.announcement_enabled,
        announcement_text: settings.announcement_text,
        announcement_interval: settings.announcement_interval,
        auto_play: settings.auto_play,
        volume_default: settings.volume_default
      })
      .eq('id', settings.id);

    if (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } else {
      toast.success('Radio settings saved!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Unable to load radio settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-foreground">Radio Station Settings</h2>
          <p className="text-muted-foreground">Configure your live radio station</p>
        </div>
        <Button onClick={handleSave} disabled={saving} variant="gold">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Playback Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Playback Settings
            </CardTitle>
            <CardDescription>
              Control how music plays on your radio station
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shuffle">Shuffle Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Randomize track order
                </p>
              </div>
              <Switch
                id="shuffle"
                checked={settings.shuffle_mode}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, shuffle_mode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoplay">Auto Play</Label>
                <p className="text-sm text-muted-foreground">
                  Start playing when page loads
                </p>
              </div>
              <Switch
                id="autoplay"
                checked={settings.auto_play}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, auto_play: checked })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Default Volume: {settings.volume_default}%</Label>
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <Slider
                value={[settings.volume_default]}
                onValueChange={([value]) => 
                  setSettings({ ...settings, volume_default: value })
                }
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Announcements
            </CardTitle>
            <CardDescription>
              Show announcements during playback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="announcements">Enable Announcements</Label>
                <p className="text-sm text-muted-foreground">
                  Display text announcements
                </p>
              </div>
              <Switch
                id="announcements"
                checked={settings.announcement_enabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, announcement_enabled: checked })
                }
              />
            </div>

            {settings.announcement_enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="announcement-text">Announcement Text</Label>
                  <Textarea
                    id="announcement-text"
                    placeholder="Enter your announcement message..."
                    value={settings.announcement_text || ''}
                    onChange={(e) => 
                      setSettings({ ...settings, announcement_text: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">
                    Show Every {settings.announcement_interval} Songs
                  </Label>
                  <Input
                    id="interval"
                    type="number"
                    min={1}
                    max={20}
                    value={settings.announcement_interval}
                    onChange={(e) => 
                      setSettings({ ...settings, announcement_interval: parseInt(e.target.value) || 5 })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shuffle Mode Info */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shuffle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Shuffle Mode Active</p>
              <p className="text-sm text-muted-foreground">
                When enabled, your radio station will play tracks in a random order, 
                giving listeners a fresh experience every time. When disabled, tracks 
                will play in order of upload date (newest first).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRadioSettings;
