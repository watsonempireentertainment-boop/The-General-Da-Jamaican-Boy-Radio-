-- Create artist_accounts table for artists who sign up
CREATE TABLE public.artist_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  bio TEXT,
  profile_photo_url TEXT,
  cover_photo_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create donations table for monetization
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT,
  donor_email TEXT,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create music_submissions table for artist uploads
CREATE TABLE public.music_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artist_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('track', 'video')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_submissions ENABLE ROW LEVEL SECURITY;

-- Artist accounts policies
CREATE POLICY "Anyone can view approved artists"
ON public.artist_accounts FOR SELECT
USING (is_approved = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own artist account"
ON public.artist_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artist account"
ON public.artist_accounts FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete artist accounts"
ON public.artist_accounts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Donations policies
CREATE POLICY "Anyone can create donations"
ON public.donations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all donations"
ON public.donations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Music submissions policies
CREATE POLICY "Artists can view their own submissions"
ON public.music_submissions FOR SELECT
USING (artist_id IN (SELECT id FROM public.artist_accounts WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Artists can create submissions"
ON public.music_submissions FOR INSERT
WITH CHECK (artist_id IN (SELECT id FROM public.artist_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Artists can update their pending submissions"
ON public.music_submissions FOR UPDATE
USING ((artist_id IN (SELECT id FROM public.artist_accounts WHERE user_id = auth.uid()) AND status = 'pending') OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete submissions"
ON public.music_submissions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_artist_accounts_updated_at
BEFORE UPDATE ON public.artist_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_music_submissions_updated_at
BEFORE UPDATE ON public.music_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for artist uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('artist-uploads', 'artist-uploads', true);

-- Storage policies for artist uploads
CREATE POLICY "Anyone can view artist uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'artist-uploads');

CREATE POLICY "Artists can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'artist-uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete artist uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'artist-uploads' AND has_role(auth.uid(), 'admin'::app_role));