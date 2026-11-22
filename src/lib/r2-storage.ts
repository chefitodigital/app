import { supabase } from './supabase';
import { uploadBlobToR2 } from './r2-core';

// Build bump: force redeploy to invalidate stale bundles (index-FPKJGJg6.js)
// Uploads now go through R2 exclusively — no Supabase Storage.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-anon-key';

async function signR2Upload(body: { filename: string; contentType: string; folder: string }) {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error('Sessão expirada. Faça login novamente para enviar imagens ao R2.');
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/r2-sign-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erro ao assinar upload R2 (${res.status})`);
  }

  return data;
}

export async function uploadToR2(
  file: File | Blob,
  folder: string = 'general',
  filenameOverride?: string
): Promise<string> {
  return uploadBlobToR2(
    file,
    folder,
    signR2Upload,
    filenameOverride
  );
}

/**
 * Delete an object from R2 via the `r2-delete` edge function.
 * Silently no-ops for empty / non-R2 URLs (data:, blob:, etc.) so callers
 * don't need to filter.
 */
export async function deleteFromR2(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) return;

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) return;

  const res = await fetch(`${supabaseUrl}/functions/v1/r2-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ imageUrl }),
  });

  if (!res.ok) {
    // Non-fatal: log and move on so orphan cleanup never blocks the UX.
    console.warn('r2-delete failed (leaving as orphan):', await res.text().catch(() => ''));
  }
}