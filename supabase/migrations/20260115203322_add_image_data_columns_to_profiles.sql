-- Add structured avatar data column for optimized image variants
ALTER TABLE public.profiles
ADD COLUMN avatar_data jsonb;

-- Add structured banner data column for optimized image variants
ALTER TABLE public.profiles
ADD COLUMN banner_data jsonb;

-- Add comments to document the expected JSON structure
COMMENT ON COLUMN public.profiles.avatar_data IS 'Structured avatar image data with optimized variants. Schema: {version: 1, imageId: string, baseUrl: string, blurhash: string, processingStatus: pending|complete|failed, variants: {xs: {webp, jpeg}, sm: {webp, jpeg}, md: {webp, jpeg}, lg: {webp, jpeg}, xl: {webp, jpeg}}}';

COMMENT ON COLUMN public.profiles.banner_data IS 'Structured banner image data with optimized variants. Schema: {version: 1, imageId: string, baseUrl: string, blurhash: string, processingStatus: pending|complete|failed, variants: {sm: {webp, jpeg}, md: {webp, jpeg}, lg: {webp, jpeg}}}';
