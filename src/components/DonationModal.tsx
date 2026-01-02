import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, DollarSign } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DONATION_AMOUNTS = [5, 10, 25, 50, 100];

const DonationModal = ({ isOpen, onClose }: DonationModalProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;

    try {
      const { error } = await supabase.from('donations').insert({
        donor_name: isAnonymous ? null : name,
        donor_email: email,
        amount: finalAmount,
        message,
        is_anonymous: isAnonymous,
      });

      if (error) throw error;

      toast({
        title: 'Thank You!',
        description: `Your donation of $${finalAmount} has been recorded. One love!`,
      });

      onClose();
      // Reset form
      setAmount(10);
      setCustomAmount('');
      setName('');
      setEmail('');
      setMessage('');
      setIsAnonymous(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process donation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6 text-rasta-red" />
            SUPPORT THE GENERAL
          </DialogTitle>
          <DialogDescription>
            Help support the movement. Every donation helps keep the music alive!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDonate} className="space-y-4">
          {/* Amount Selection */}
          <div className="space-y-2">
            <Label>Select Amount</Label>
            <div className="grid grid-cols-5 gap-2">
              {DONATION_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant={amount === amt && !customAmount ? 'gold' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount('');
                  }}
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="customAmount">Custom Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="customAmount"
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Name */}
          {!isAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a message..."
              rows={2}
            />
          </div>

          {/* Anonymous */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <Label htmlFor="anonymous" className="text-sm">
              Make this donation anonymous
            </Label>
          </div>

          <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : `Donate $${customAmount || amount}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            This records your donation intent. Payment processing coming soon.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DonationModal;