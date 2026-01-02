import { useCallback } from 'react';
import { toast } from 'sonner';

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export const useShareSite = () => {
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const shareSite = useCallback(async (data?: ShareData) => {
    const shareData: ShareData = {
      title: data?.title || 'The General Da Jamaican Boy - Official Music',
      text: data?.text || 'Check out The General Da Jamaican Boy - Pure Reggae vibes from Jamaica! 🇯🇲🎶',
      url: data?.url || window.location.origin,
    };

    if (canShare) {
      try {
        await navigator.share(shareData);
        toast.success('Thanks for sharing!');
        return true;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          // Fall back to clipboard
          return copyToClipboard(shareData.url!);
        }
        return false;
      }
    } else {
      return copyToClipboard(shareData.url!);
    }
  }, [canShare]);

  const shareTrack = useCallback(async (trackTitle: string, trackId: string) => {
    const shareUrl = `${window.location.origin}/music?track=${trackId}`;
    return shareSite({
      title: `${trackTitle} - The General Da Jamaican Boy`,
      text: `Listen to "${trackTitle}" by The General Da Jamaican Boy 🎶`,
      url: shareUrl,
    });
  }, [shareSite]);

  const shareToSocial = useCallback((platform: 'twitter' | 'facebook' | 'whatsapp' | 'telegram') => {
    const url = encodeURIComponent(window.location.origin);
    const text = encodeURIComponent('Check out The General Da Jamaican Boy - Pure Reggae vibes from Jamaica! 🇯🇲🎶');
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
    toast.success(`Opening ${platform}...`);
  }, []);

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      return true;
    } catch (err) {
      toast.error('Failed to copy link');
      return false;
    }
  };

  return {
    canShare,
    shareSite,
    shareTrack,
    shareToSocial,
    copyToClipboard: (url?: string) => copyToClipboard(url || window.location.origin),
  };
};
