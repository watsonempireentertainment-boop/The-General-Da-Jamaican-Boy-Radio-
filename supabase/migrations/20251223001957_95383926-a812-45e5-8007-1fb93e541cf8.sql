-- Create function to increment play count
CREATE OR REPLACE FUNCTION public.increment_play_count(media_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE media 
  SET play_count = COALESCE(play_count, 0) + 1
  WHERE id = media_id;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.increment_play_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_play_count(uuid) TO anon;