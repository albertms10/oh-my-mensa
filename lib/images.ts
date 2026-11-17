/** Same-origin URL of the server-side image proxy for a dish photo path. */
export function dishImageSrc(path: string | undefined): string | null {
  return path ? `/api/dish-image?p=${encodeURIComponent(path)}` : null;
}
