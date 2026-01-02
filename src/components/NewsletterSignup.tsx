import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" }).max(255);

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: result.data });

      if (error) {
        if (error.code === '23505') {
          toast.info("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        toast.success('Welcome to the tribe! Check your inbox for updates.');
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="bg-gradient-to-r from-rasta-red/10 via-primary/10 to-rasta-green/10 rounded-2xl p-8 border border-primary/20">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rasta-green/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-rasta-green" />
          </div>
          <div>
            <h3 className="font-display text-2xl text-foreground">You're In!</h3>
            <p className="text-muted-foreground mt-2">
              Welcome to the movement. Stay tuned for exclusive updates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-rasta-red/10 via-primary/10 to-rasta-green/10 rounded-2xl p-8 border border-primary/20">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="w-7 h-7 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-display text-2xl text-foreground">Stay Updated</h3>
          <p className="text-muted-foreground mt-1">
            Get exclusive news, new releases, and updates from The General.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-[250px] bg-background/50 border-border"
            required
            disabled={loading}
          />
          <Button type="submit" variant="gold" disabled={loading} className="whitespace-nowrap">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join the Tribe'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NewsletterSignup;