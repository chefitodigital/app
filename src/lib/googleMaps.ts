/** Accept Google Maps sharing links only, not arbitrary redirect or script URLs. */
export function googleMapsUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    const googleMapsPage = (host === 'google.com' || host === 'www.google.com' || host === 'google.com.br' || host === 'www.google.com.br') && (url.pathname === '/maps' || url.pathname.startsWith('/maps/'));
    const mapsHost = host === 'maps.google.com' || host === 'maps.google.com.br' || host === 'maps.app.goo.gl';
    const shortLink = host === 'goo.gl' && url.pathname.startsWith('/maps/');
    return googleMapsPage || mapsHost || shortLink ? url.href : null;
  } catch { return null; }
}
