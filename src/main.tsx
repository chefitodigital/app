import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/storage-fetch-guard';
import App from './App.tsx';
import './index.css';
import { setChefFavicon } from './lib/favicon';

void setChefFavicon('#212529');

const CHEFITO_CLIENT_BUILD = 'r2-only-2026-07-11-1215-single-bundle';

console.info(`[Chefito] client build ${CHEFITO_CLIENT_BUILD}: uploads use Cloudflare R2 only.`);

async function removeLegacyAppShellCache() {
  const cleanupKey = 'chefito-legacy-cache-cleaned-v1';
  if (localStorage.getItem(cleanupKey) === '1') return;

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.allSettled(
        registrations.map((registration) => registration.unregister())
      );
    } catch (error) {
      console.warn('Could not unregister legacy service worker:', error);
    }
  }

  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.allSettled(
        cacheNames.map((name) => caches.delete(name))
      );
    } catch (error) {
      console.warn('Could not clear legacy app cache:', error);
    }
  }

  localStorage.setItem(cleanupKey, '1');
}

void removeLegacyAppShellCache();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
