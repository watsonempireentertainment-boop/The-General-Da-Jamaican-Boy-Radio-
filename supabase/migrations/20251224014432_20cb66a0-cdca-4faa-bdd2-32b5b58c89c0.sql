-- Add allow_download column to albums table
ALTER TABLE public.albums ADD COLUMN IF NOT EXISTS allow_download boolean DEFAULT false;