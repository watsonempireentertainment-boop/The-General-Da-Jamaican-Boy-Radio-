import { useState } from 'react';
import { Copy, Check, Code2, ListMusic, Music2, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface EmbedCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId?: string;
  trackTitle?: string;
  albumId?: string;
  albumTitle?: string;
  showRadioOption?: boolean;
}

const EmbedCodeModal = ({
  open,
  onOpenChange,
  trackId,
  trackTitle,
  albumId,
  albumTitle,
  showRadioOption = false,
}: EmbedCodeModalProps) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [embedType, setEmbedType] = useState<'player' | 'playlist' | 'radio'>('player');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const embedParams = new URLSearchParams();
  if (embedType === 'radio') {
    embedParams.set('radio', 'true');
  } else {
    if (trackId) embedParams.set('track', trackId);
    if (albumId) embedParams.set('album', albumId);
    if (embedType === 'playlist') embedParams.set('playlist', 'true');
  }
  embedParams.set('theme', theme);

  const embedUrl = `${baseUrl}/embed?${embedParams.toString()}`;

  const playerSizes = {
    small: { width: 300, height: 100 },
    medium: { width: 400, height: 120 },
    large: { width: 500, height: 140 },
  };

  const playlistSizes = {
    small: { width: 400, height: 200 },
    medium: { width: 500, height: 260 },
    large: { width: 600, height: 320 },
  };

  const radioSizes = {
    small: { width: 320, height: 80 },
    medium: { width: 400, height: 90 },
    large: { width: 480, height: 100 },
  };

  const sizes = embedType === 'radio' ? radioSizes : embedType === 'playlist' ? playlistSizes : playerSizes;
  const { width, height } = sizes[size];

  const embedCode = `<iframe 
  src="${embedUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allow="autoplay; encrypted-media" 
  loading="lazy"
  style="border-radius: 12px; border: none;"
  title="${embedType === 'radio' ? 'The General Da Jamaican Boy Live Radio' : trackTitle || albumTitle || 'The General Da Jamaican Boy Music Player'}"
></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast.success('Embed code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const showPlaylistOption = !trackId && (albumId || (!trackId && !albumId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Embed Player
          </DialogTitle>
          <DialogDescription>
            {trackTitle 
              ? `Share "${trackTitle}" on your blog or website`
              : albumTitle
              ? `Share "${albumTitle}" album on your blog or website`
              : 'Share the music player on your blog or website'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Embed Type Tabs */}
          {(showPlaylistOption || showRadioOption) && (
            <Tabs value={embedType} onValueChange={(v) => setEmbedType(v as 'player' | 'playlist' | 'radio')}>
              <TabsList className={`grid w-full ${showRadioOption && showPlaylistOption ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="player" className="flex items-center gap-2">
                  <Music2 className="w-4 h-4" />
                  Player
                </TabsTrigger>
                {showPlaylistOption && (
                  <TabsTrigger value="playlist" className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4" />
                    Playlist
                  </TabsTrigger>
                )}
                {showRadioOption && (
                  <TabsTrigger value="radio" className="flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    Radio
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as 'dark' | 'light')}>
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
              <Select value={size} onValueChange={(v) => setSize(v as 'small' | 'medium' | 'large')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {embedType === 'radio' ? (
                    <>
                      <SelectItem value="small">Small (320×80)</SelectItem>
                      <SelectItem value="medium">Medium (400×90)</SelectItem>
                      <SelectItem value="large">Large (480×100)</SelectItem>
                    </>
                  ) : embedType === 'playlist' ? (
                    <>
                      <SelectItem value="small">Small (400×200)</SelectItem>
                      <SelectItem value="medium">Medium (500×260)</SelectItem>
                      <SelectItem value="large">Large (600×320)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="small">Small (300×100)</SelectItem>
                      <SelectItem value="medium">Medium (400×120)</SelectItem>
                      <SelectItem value="large">Large (500×140)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="bg-muted rounded-lg p-4 overflow-auto">
              <iframe
                src={embedUrl}
                width={Math.min(width, embedType === 'playlist' ? 460 : 360)}
                height={embedType === 'playlist' ? Math.min(height, 220) : height}
                style={{ borderRadius: 12, border: 'none' }}
                title="Player Preview"
              />
            </div>
          </div>

          {/* Embed Code */}
          <div className="space-y-2">
            <Label>Embed Code</Label>
            <div className="relative">
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono">
                {embedCode}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {embedType === 'radio' 
              ? 'The live radio embed plays a continuous stream of music from The General with a compact player design.'
              : embedType === 'playlist' 
              ? 'The playlist carousel lets visitors browse and play multiple tracks in a sleek carousel format.'
              : 'Paste this code into your blog post, website, or any HTML page to embed the player.'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmbedCodeModal;
