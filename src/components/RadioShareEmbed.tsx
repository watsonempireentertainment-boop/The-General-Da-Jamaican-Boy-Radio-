import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Code2, Copy, Check, Twitter, Facebook, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useShareSite } from '@/hooks/useShareSite';

interface RadioShareEmbedProps {
  variant?: 'icon' | 'button';
}

const RadioShareEmbed = ({ variant = 'button' }: RadioShareEmbedProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const { shareToSocial, canShare, shareSite } = useShareSite();

  const radioUrl = `${window.location.origin}/radio`;
  const embedUrl = `${window.location.origin}/embed?radio=true&theme=${theme}`;

  const sizes = {
    small: { width: 320, height: 80 },
    medium: { width: 400, height: 90 },
    large: { width: 480, height: 100 },
  };

  const { width, height } = sizes[size];

  const embedCode = `<iframe 
  src="${embedUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allow="autoplay; encrypted-media" 
  loading="lazy"
  style="border-radius: 12px; border: none;"
  title="T.G.D.J.B Radio - The General Da Jamaican Boy"
></iframe>`;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleNativeShare = async () => {
    await shareSite({
      title: 'T.G.D.J.B Radio - Live Reggae',
      text: 'Listen to T.G.D.J.B Radio - Non-stop reggae vibes from The General Da Jamaican Boy! 🇯🇲🎶',
      url: radioUrl,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" title="Share Radio">
            <Share2 className="w-5 h-5" />
          </Button>
        ) : (
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share & Embed Radio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share T.G.D.J.B Radio
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="share" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4">
            {/* Native Share */}
            {canShare && (
              <Button onClick={handleNativeShare} className="w-full gap-2">
                <Share2 className="w-4 h-4" />
                Share via Apps
              </Button>
            )}

            {/* Social Share Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => shareToSocial('twitter')}
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => shareToSocial('facebook')}
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => shareToSocial('whatsapp')}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => shareToSocial('telegram')}
              >
                <Send className="w-4 h-4" />
                Telegram
              </Button>
            </div>

            {/* Copy Link */}
            <div className="space-y-2">
              <Label>Radio Link</Label>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm truncate">
                  {radioUrl}
                </code>
                <Button 
                  variant="secondary" 
                  size="icon"
                  onClick={() => handleCopy(radioUrl)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            {/* Embed Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={(v: 'dark' | 'light') => setTheme(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={size} onValueChange={(v: 'small' | 'medium' | 'large') => setSize(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (320×80)</SelectItem>
                    <SelectItem value="medium">Medium (400×90)</SelectItem>
                    <SelectItem value="large">Large (480×100)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border border-border rounded-lg p-4 bg-muted/30 flex items-center justify-center overflow-hidden">
                <iframe
                  src={embedUrl}
                  width={Math.min(width, 450)}
                  height={Math.min(height, 150)}
                  frameBorder="0"
                  title="Radio Preview"
                  className="rounded"
                />
              </div>
            </div>

            {/* Embed Code */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Embed Code
              </Label>
              <div className="relative">
                <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                  {embedCode}
                </pre>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(embedCode)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Add this code to your blog or website to embed the radio player. 
              Visitors will be able to listen to T.G.D.J.B Radio directly from your site!
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RadioShareEmbed;
