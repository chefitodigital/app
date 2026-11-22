import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  let truncated = text.slice(0, maxChars).trimEnd();
  if ((truncated.match(/\*/g) || []).length % 2 !== 0) truncated += '*';
  if ((truncated.match(/_/g) || []).length % 2 !== 0) truncated += '_';
  return truncated + '...';
}

export function formatDescription(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*[^*]+\*)|(_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const raw = match[0];
    if (raw.startsWith('*')) {
      parts.push(React.createElement('span', { key: key++, className: 'font-black text-gray-900', style: { WebkitTextStroke: '0.4px currentColor' } }, raw.slice(1, -1)));
    } else {
      parts.push(React.createElement('span', { key: key++, className: 'italic' }, raw.slice(1, -1)));
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Combines Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Safely parse JSON with type checking
 */
export function safeJSONParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Debounce function for rate limiting
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Formats a date string to locale date
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Sanitizes HTML content
 */
export function sanitizeHTML(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates price format and range
 */
export function isValidPrice(price: number): boolean {
  return !isNaN(price) && price >= 0 && price <= 99999.99;
}

/**
 * Optimizes image URLs for better performance
 * Supports Gumlet CDN (multi-tenant) and Unsplash URLs
 */
export function optimizeImageUrl(url: string | null, options: { width?: number; quality?: number; format?: string } = {}): string {
  if (!url) return '';

  const GUMLET_DOMAIN = import.meta.env.VITE_GUMLET_DOMAIN;
  const defaultWidth = options.width || 800;
  const defaultQuality = options.quality || 80;
  const defaultFormat = options.format || 'webp';

  try {
    if (GUMLET_DOMAIN && url.includes(GUMLET_DOMAIN)) {
      try {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;

        if (!params.has('w')) {
          params.set('w', defaultWidth.toString());
        }
        if (!params.has('q')) {
          params.set('q', defaultQuality.toString());
        }
        if (!params.has('fm')) {
          params.set('fm', defaultFormat);
        }

        return urlObj.toString();
      } catch (e) {
        console.warn('Failed to parse Gumlet URL, returning original:', e);
        return url;
      }
    }

    if (url.includes('images.unsplash.com')) {
      try {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;

        if (options.width && !params.has('w')) {
          params.set('w', options.width.toString());
        }
        if (options.quality && !params.has('q')) {
          params.set('q', options.quality.toString());
        }
        if (!params.has('fm')) {
          params.set('fm', defaultFormat);
        }

        return urlObj.toString();
      } catch (e) {
        console.warn('Failed to parse Unsplash URL, returning original:', e);
        return url;
      }
    }

    return url;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return url || '';
  }
}

/**
 * Tests if an image URL is valid and loadable
 */
export async function testImageUrl(url: string, timeoutMs: number = 8000): Promise<{ valid: boolean; error?: string }> {
  if (!url || !url.match(/^https?:\/\/.+/)) {
    return { valid: false, error: 'URL inválida' };
  }

  return new Promise((resolve) => {
    const img = new Image();

    const timeoutId = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      resolve({ valid: false, error: 'Timeout' });
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timeoutId);
      if (img.width > 0 && img.height > 0) {
        resolve({ valid: true });
      } else {
        resolve({ valid: false, error: 'Imagem inválida' });
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve({ valid: false, error: 'Erro ao carregar' });
    };

    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

/**
 * Generates a random string for unique identifiers
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((x) => chars[x % chars.length])
    .join('');
}

/**
 * Checks if the device is offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Registers a background sync
 */
export async function registerSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register(tag);
    } catch (error) {
      console.error('Error registering sync:', error);
    }
  }
}

/**
 * Updates service worker
 */
export async function updateServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    } catch (error) {
      console.error('Error updating service worker:', error);
    }
  }
}

/**
 * Formats a number as currency based on the given currency code
 */
export function formatCurrency(value: number, currency: 'EUR' | 'BRL' = 'BRL'): string {
  const formatter = new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}
