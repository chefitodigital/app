import { createClient } from '@supabase/supabase-js';
import { uploadBlobToR2 } from './r2-core';
import type { Database } from '../types/supabase';
import { getCurrentBusinessId, scopeBusinessRequest } from './businessFetch';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)) {
  console.warn(
    '[Chefito] Variáveis do Supabase em falta. Usando placeholder para permitir render do preview. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env / Vercel para funcionar de verdade.'
  );
}

const legacyStoragePublicUrlMap = new Map<string, string>();

export const CHEFITO_STORAGE_MODE = 'cloudflare-r2-only-2026-07-11-1215-single-bundle';

console.info(`[Chefito] storage mode ${CHEFITO_STORAGE_MODE}: Supabase Storage uploads are blocked.`);

function getLegacyUploadFolder(path: string): string {
  const normalizedPath = path.toLowerCase();

  if (normalizedPath.includes('story')) return 'story';
  if (normalizedPath.includes('favicon')) return 'favicon';
  if (normalizedPath.includes('logo')) return 'logos';
  if (normalizedPath.includes('about')) return 'about';

  return 'products';
}

async function signLegacyStorageUploadWithR2(body: { filename: string; contentType: string; folder: string }) {
  const { data: { session } } = await supabaseClient.auth.getSession();
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

async function uploadLegacySupabaseStorageCallToR2(path: string, fileBody: unknown): Promise<string> {
  if (!(fileBody instanceof Blob)) {
    throw new Error('Upload legado bloqueado: o arquivo precisa ser Blob/File para envio ao R2.');
  }

  return uploadBlobToR2(
    fileBody,
    getLegacyUploadFolder(path),
    signLegacyStorageUploadWithR2,
    path
  );
}

function getChefitoObjectPath(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/storage\/v1\/object\/chefito\/(.+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;

  return String((input as { url?: string }).url || input);
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  const initMethod = init?.method;

  if (initMethod) return initMethod.toUpperCase();

  const inputMethod = (input as { method?: string }).method;
  return (inputMethod || 'GET').toUpperCase();
}

function isRequestLike(input: unknown): input is {
  clone: () => {
    headers?: Headers | { get?: (name: string) => string | null };
    formData?: () => Promise<FormData>;
    blob?: () => Promise<Blob>;
  };
} {
  return !!input && typeof (input as { clone?: unknown }).clone === 'function';
}

async function extractUploadBlob(input: RequestInfo | URL, init?: RequestInit): Promise<Blob | null> {
  const body = init?.body;

  if (body instanceof Blob) return body;

  if (body instanceof FormData) {
    for (const value of body.values()) {
      if (value instanceof Blob) return value;
    }
  }

  if (isRequestLike(input)) {
    const requestClone = input.clone();
    const contentType = requestClone.headers?.get?.('content-type') || '';

    if (contentType.includes('multipart/form-data') && requestClone.formData) {
      const formData = await requestClone.formData();
      for (const value of formData.values()) {
        if (value instanceof Blob) return value;
      }
      return null;
    }

    if (requestClone.blob) {
      return requestClone.blob();
    }
  }

  return null;
}

const nativeFetch = typeof window !== 'undefined' && typeof window.fetch === 'function'
  ? window.fetch.bind(window)
  : fetch;

async function chefitoStorageGuardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = getRequestUrl(input);
    const method = getRequestMethod(input, init);
    const path = getChefitoObjectPath(url);

    if (path && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        console.warn('[Chefito] Blocked Supabase Storage request; routing legacy upload to Cloudflare R2.');
        const uploadBlob = await extractUploadBlob(input, init);
        const publicUrl = await uploadLegacySupabaseStorageCallToR2(path, uploadBlob);

        legacyStoragePublicUrlMap.set(path, publicUrl);
        legacyStoragePublicUrlMap.set(`chefito/${path}`, publicUrl);

        return new Response(
          JSON.stringify({ Id: path, Key: `chefito/${path}`, path, publicUrl }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('[Chefito] Legacy Supabase Storage request could not be routed to R2:', error);
        return new Response(
          JSON.stringify({
            statusCode: '500',
            error: 'R2UploadError',
            message: error instanceof Error ? error.message : 'Erro ao enviar imagem ao R2',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const request = new Request(input, init);
    const scopedRequest = await scopeBusinessRequest(request, getCurrentBusinessId());
    return nativeFetch(scopedRequest);
}

function installLegacySupabaseStorageFetchGuard() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

  window.fetch = chefitoStorageGuardedFetch as typeof window.fetch;
}

installLegacySupabaseStorageFetchGuard();

const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: chefitoStorageGuardedFetch,
  },
  db: {
    schema: 'public',
  },
});

const storageClient = supabaseClient.storage;
const originalStorageFrom = storageClient.from.bind(storageClient);

storageClient.from = (bucketId: string) => {
  const bucket = originalStorageFrom(bucketId) as unknown as {
    upload: (path: string, fileBody: unknown) => Promise<unknown>;
    update: unknown;
    uploadToSignedUrl: unknown;
    createSignedUploadUrl: unknown;
    getPublicUrl: unknown;
  };

  if (bucketId !== 'chefito') {
    return bucket;
  }

  bucket.upload = async (path: string, fileBody: unknown) => {
    try {
      console.warn('[Chefito] Intercepted legacy Supabase Storage upload; routing to Cloudflare R2.');
      const normalizedPath = String(path || `legacy-${Date.now()}.jpg`);
      const publicUrl = await uploadLegacySupabaseStorageCallToR2(normalizedPath, fileBody);

      legacyStoragePublicUrlMap.set(normalizedPath, publicUrl);
      legacyStoragePublicUrlMap.set(`chefito/${normalizedPath}`, publicUrl);

      return {
        data: {
          id: normalizedPath,
          path: normalizedPath,
          fullPath: `chefito/${normalizedPath}`,
        },
        error: null,
      };
    } catch (error) {
      console.error('[Chefito] Legacy Supabase Storage upload could not be routed to R2:', error);
      return {
        data: null,
        error: {
          statusCode: '500',
          error: 'R2UploadError',
          message: error instanceof Error ? error.message : 'Erro ao enviar imagem ao R2',
        },
      };
    }
  };

  bucket.update = bucket.upload;
  bucket.uploadToSignedUrl = bucket.upload;
  bucket.createSignedUploadUrl = async () => ({
    data: null,
    error: {
      statusCode: '410',
      error: 'SupabaseStorageDisabled',
      message: 'Supabase Storage está desativado para uploads. Use uploadToR2.',
    },
  });

  bucket.getPublicUrl = (path: string) => {
    const mappedPublicUrl = legacyStoragePublicUrlMap.get(String(path));

    if (mappedPublicUrl) {
      return { data: { publicUrl: mappedPublicUrl } };
    }

    return { data: { publicUrl: '' } };
  };

  return bucket as unknown as ReturnType<typeof originalStorageFrom>;
};

Object.defineProperty(supabaseClient, 'storage', {
  configurable: true,
  get: () => storageClient,
});

export const supabase = supabaseClient;
