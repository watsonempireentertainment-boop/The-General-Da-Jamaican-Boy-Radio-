-- Create albums/mixtapes table
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  album_type TEXT NOT NULL DEFAULT 'album', -- 'album', 'mixtape', 'ep', 'single'
  cover_url TEXT,
  release_date DATE,
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add album_id to media table to link tracks to albums
ALTER TABLE public.media ADD COLUMN album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view published albums" 
ON public.albums 
FOR SELECT 
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage albums" 
ON public.albums 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_albums_updated_at
BEFORE UPDATE ON public.albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();