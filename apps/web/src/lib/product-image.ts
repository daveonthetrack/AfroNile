/**
 * Resolves a product image URL from the database, with keyword-based fallbacks
 * when no imageUrl is stored.
 */
export function resolveProductImageUrl(
  imageUrl: string | null | undefined,
  title: string
): string | null {
  if (imageUrl?.trim()) {
    return imageUrl.trim();
  }

  const name = title.toLowerCase();
  if (name.includes('vinyl') || name.includes('record')) {
    return '/nile_waves_album_art.jpg';
  }
  if (
    name.includes('shirt') ||
    name.includes('tee') ||
    name.includes('hoodie') ||
    name.includes('apparel')
  ) {
    return '/Tshirt.png';
  }

  return null;
}
