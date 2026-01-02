import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, Send, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminNewsletter = () => {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSendNewsletter = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: {}
      });

      if (error) throw error;

      setLastResult(data);
      toast.success(`Newsletter prepared for ${data.subscriberCount} subscribers`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send newsletter');
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display text-foreground">Newsletter Agent</h2>
        <p className="text-muted-foreground">Send weekly updates to subscribers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Weekly Newsletter
          </CardTitle>
          <CardDescription>
            Generate and send newsletter with latest songs, albums, and videos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSendNewsletter} disabled={sending} variant="gold">
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Generate Newsletter
              </>
            )}
          </Button>

          {lastResult && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>{lastResult.subscriberCount} subscribers</span>
              </div>
              <p className="text-sm text-muted-foreground">
                New: {lastResult.newTracks} tracks, {lastResult.newAlbums} albums, {lastResult.newVideos} videos
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewsletter;
