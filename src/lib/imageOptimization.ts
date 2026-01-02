/**
 * Utility functions for optimizing image delivery
 */

const SUPABASE_STORAGE_URL = 'https://oqxfqkwxelcwqndenyzx.supabase.co/storage/v1/object/public';

/**
 * Optimizes a Supabase storage URL with image transformations
 * @param url - The original image URL
 * @param options - Optimization options
 * @returns Optimized image URL
 */
export function optimizeSupabaseImage(
  url: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif';
  } = {}
): string {
  if (!url) return '';
  
  // Check if this is a Supabase storage URL
  if (!url.includes('supabase.co/storage/v1/object/public')) {
    return url;
  }

  const { width, height, quality = 75, format = 'webp' } = options;

  // Build transformation query params
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('format', format);

  // Replace /object/public with /render/image/public for transformations
  const transformUrl = url.replace(
    '/storage/v1/object/public',
    '/storage/v1/render/image/public'
  );

  return `${transformUrl}?${params.toString()}`;
}

/**
 * Get responsive image srcset for Supabase images
 */
export function getResponsiveSrcSet(
  url: string | null | undefined,
  sizes: number[] = [320, 640, 960, 1280]
): string {
  if (!url) return '';
  
  return sizes
    .map(size => `${optimizeSupabaseImage(url, { width: size })} ${size}w`)
    .join(', ');
}

/**
 * Check if URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public');
}
