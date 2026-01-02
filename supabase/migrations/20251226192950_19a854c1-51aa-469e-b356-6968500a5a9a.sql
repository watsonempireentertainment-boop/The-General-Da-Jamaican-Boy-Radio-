-- Create embed_analytics table to track embedded player plays
CREATE TABLE public.embed_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  referrer_url TEXT,
  embed_type TEXT NOT NULL DEFAULT 'track',
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  country TEXT
);

-- Enable RLS
ALTER TABLE public.embed_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (embeds are public)
CREATE POLICY "Anyone can insert embed analytics"
ON public.embed_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view embed analytics"
ON public.embed_analytics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_embed_analytics_track_id ON public.embed_analytics(track_id);
CREATE INDEX idx_embed_analytics_played_at ON public.embed_analytics(played_at DESC);