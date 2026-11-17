const IMAGE_PATH = /^assets\/fotos\/[A-Za-z0-9_\-./]+\.(?:jpe?g|png|webp|gif)$/i;

/** Only photo paths below assets/fotos/ without traversal are allowed (prevents SSRF via the proxy). */
export function isValidImagePath(p: string): boolean {
  return IMAGE_PATH.test(p) && !p.includes("..") && !p.includes("//");
}

/** Turns a src attribute from the menu HTML into a validated relative path, or null. */
export function normalizeImagePath(src: string | undefined, baseUrl: string): string | null {
  if (!src) return null;
  let p = src.trim();
  if (p.startsWith(baseUrl)) p = p.slice(baseUrl.length);
  else if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(p)) return null; // absolute URL on another host
  p = p.replace(/^\/+/, "").split(/[?#]/)[0];
  return isValidImagePath(p) ? p : null;
}
