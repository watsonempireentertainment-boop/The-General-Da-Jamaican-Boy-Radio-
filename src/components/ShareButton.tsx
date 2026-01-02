import { useState } from 'react';
import { Share2, Twitter, Facebook, Link, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useShareSite } from '@/hooks/useShareSite';

interface ShareButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  title?: string;
  text?: string;
  url?: string;
  showLabel?: boolean;
  className?: string;
}

const ShareButton = ({ 
  variant = 'ghost', 
  size = 'icon', 
  title,
  text,
  url,
  showLabel = false,
  className = ''
}: ShareButtonProps) => {
  const { canShare, shareSite, shareToSocial, copyToClipboard } = useShareSite();

  const handleNativeShare = async () => {
    await shareSite({ title, text, url });
  };

  if (canShare) {
    return (
      <Button 
        variant={variant} 
        size={showLabel ? size : 'icon'} 
        onClick={handleNativeShare}
        className={`gap-2 ${className}`}
      >
        <Share2 className="w-4 h-4" />
        {showLabel && 'Share'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={showLabel ? size : 'icon'} className={`gap-2 ${className}`}>
          <Share2 className="w-4 h-4" />
          {showLabel && 'Share'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => shareToSocial('twitter')}>
          <Twitter className="w-4 h-4 mr-2" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareToSocial('facebook')}>
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareToSocial('whatsapp')}>
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareToSocial('telegram')}>
          <Send className="w-4 h-4 mr-2" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyToClipboard(url)}>
          <Link className="w-4 h-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
