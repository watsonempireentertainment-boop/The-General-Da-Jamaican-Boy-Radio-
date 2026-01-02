-- Add explicit column to media table for content filtering
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_explicit boolean DEFAULT false;

-- Create radio_settings table for admin to manage radio station
CREATE TABLE IF NOT EXISTS public.radio_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shuffle_mode boolean DEFAULT true,
  announcement_enabled boolean DEFAULT false,
  announcement_text text,
  announcement_interval integer DEFAULT 5,
  auto_play boolean DEFAULT true,
  volume_default integer DEFAULT 30,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on radio_settings
ALTER TABLE public.radio_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage radio settings
CREATE POLICY "Admins can manage radio settings" 
ON public.radio_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view radio settings (for the player)
CREATE POLICY "Anyone can view radio settings" 
ON public.radio_settings 
FOR SELECT 
USING (true);

-- Insert default radio settings
INSERT INTO public.radio_settings (shuffle_mode, announcement_enabled, auto_play, volume_default)
VALUES (true, false, true, 30)
ON CONFLICT DO NOTHING;