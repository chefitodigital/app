const GOOGLE_FONTS_BASE_URL = 'https://fonts.googleapis.com/css2';
const FONT_WEIGHTS = '400;700';
const FONT_DISPLAY = 'swap';

let currentFontLink: HTMLLinkElement | null = null;

export function loadGoogleFonts(fonts: string[]): void {
  try {
    const uniqueFonts = [...new Set(fonts)].filter(Boolean);

    if (uniqueFonts.length === 0) {
      return;
    }

    const fontFamilies = uniqueFonts
      .map(font => `family=${encodeURIComponent(font)}:wght@${FONT_WEIGHTS}`)
      .join('&');

    const fontUrl = `${GOOGLE_FONTS_BASE_URL}?${fontFamilies}&display=${FONT_DISPLAY}`;

    if (!currentFontLink) {
      currentFontLink = document.querySelector<HTMLLinkElement>('link[data-font-link]');
    }

    if (!currentFontLink) {
      currentFontLink = document.createElement('link');
      currentFontLink.rel = 'stylesheet';
      currentFontLink.setAttribute('data-font-link', 'true');
      document.head.appendChild(currentFontLink);
    }

    if (currentFontLink.href !== fontUrl) {
      currentFontLink.href = fontUrl;

      currentFontLink.onerror = () => {
        console.error('Failed to load Google Fonts');
      };
    }
  } catch (error) {
    console.error('Error loading Google Fonts:', error);
  }
}

export function ensurePreconnect(): void {
  const preconnectUrls = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];

  preconnectUrls.forEach(url => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="preconnect"][href="${url}"]`);

    if (!link) {
      link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;

      if (url === 'https://fonts.gstatic.com') {
        link.crossOrigin = 'anonymous';
      }

      document.head.insertBefore(link, document.head.firstChild);
    }
  });
}
