const DEFAULT_FAVICON = '/favicon.png';

export function setFaviconUrl(url: string | null): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  link.type = 'image/png';
  link.href = url || DEFAULT_FAVICON;
}

export function updateThemeColor(color: string): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

let faviconRequest = 0;

export async function setChefFavicon(color: string): Promise<void> {
  const request = ++faviconRequest;
  try {
    await document.fonts.load('900 48px "Font Awesome 7 Pro"', '\ue3d2');
    if (request !== faviconRequest) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = color;
    context.font = '900 48px "Font Awesome 7 Pro"';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('\ue3d2', 32, 33);
    setFaviconUrl(canvas.toDataURL('image/png'));
  } catch (error) {
    console.error('Não foi possível carregar o favicon:', error);
  }
}
