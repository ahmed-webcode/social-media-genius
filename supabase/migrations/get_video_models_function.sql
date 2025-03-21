
-- Function to get video models
CREATE OR REPLACE FUNCTION public.get_video_models()
RETURNS SETOF public.video_models
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.video_models ORDER BY created_at DESC;
$$;
