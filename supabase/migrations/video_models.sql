
-- Create table for video models
CREATE TABLE IF NOT EXISTS public.video_models (
  id UUID PRIMARY KEY,
  platform TEXT NOT NULL,
  video_type TEXT NOT NULL,
  style_features JSONB NOT NULL,
  reference_videos TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for platform and video_type
CREATE INDEX IF NOT EXISTS video_models_platform_type_idx ON public.video_models (platform, video_type);
