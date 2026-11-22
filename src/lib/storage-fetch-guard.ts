const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-anon-key';

declare global {
  interface Window {
    __CHEFITO_STORAGE_FETCH_GUARD__?: boolean;
  }
}

const nativeFetch = typeof window !== 'undefined' && typeof window.fetch === 'function'
  ? window.fetch.bind(window)
  : fetch;

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;

  return String((input as { url?: string }).url || input);
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();

  return ((input as { method?: string }).method || 'GET').toUpperCase();
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

function getLegacyUploadFolder(path: string): string {
  const normalizedPath = path.toLowerCase();

  if (normalizedPath.includes('story')) return 'story';
  if (normalizedPath.includes('favicon')) return 'favicon';
  if (normalizedPath.includes('logo')) return 'logos';
  if (normalizedPath.includes('about')) return 'about';

  return 'products';
}

function getHeaderValue(headers: HeadersInit | undefined, name: string): string | null {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  if (Array.isArray(headers)) {
    const found = headers.find(([key]) => key.toLowerCase() === name.toLowerCase());

    return found?.[1] || null;
  }

  const record = headers as Record<string, string>;
  const key = Object.keys(record).find((item) => item.toLowerCase() === name.toLowerCase());

  return key ? record[key] : null;
}

function getAuthorizationHeader(input: RequestInfo | URL, init?: RequestInit): string | null {
  const initAuth = getHeaderValue(init?.headers, 'authorization');
  if (initAuth) return initAuth;

  const requestHeaders = (input as { headers?: Headers }).headers;
  const requestAuth = requestHeaders?.get?.('authorization');
  if (requestAuth) return requestAuth;

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;

      const rawSession = localStorage.getItem(key);
      if (!rawSession) continue;

      const session = JSON.parse(rawSession);
      const accessToken = session?.access_token || session?.currentSession?.access_token;
      if (accessToken) return `Bearer ${accessToken}`;
    }
  } catch {
    return null;
  }

  return null;
}

async function extractUploadBlob(input: RequestInfo | URL, init?: RequestInit): Promise<Blob | null> {
  const body = init?.body;

  if (body instanceof Blob) return body;

  if (body instanceof FormData) {
    for (const value of body.values()) {
      if (value instanceof Blob) return value;
    }
  }

  const clone = (input as { clone?: () => Request }).clone?.();
  if (!clone) return null;

  const contentType = clone.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await clone.formData();
    for (const value of formData.values()) {
      if (value instanceof Blob) return value;
    }
  }

  return clone.blob();
}

function assertSignedUploadIsR2(data: { uploadUrl?: string; publicUrl?: string; storageProvider?: string; bucket?: string }) {
  if (data.storageProvider !== 'cloudflare-r2') {
    throw new Error('A assinatura de upload não confirmou Cloudflare R2. Redeploy da edge function r2-sign-upload é obrigatório.');
  }

  if ((data.bucket || '').toLowerCase() !== 'app') {
    throw new Error(`Bucket R2 inválido (${data.bucket || 'não informado'}).`);
  }

  if (!data.uploadUrl || !data.publicUrl) {
    throw new Error('A edge function R2 não retornou uploadUrl/publicUrl.');
  }

  const uploadHostname = new URL(data.uploadUrl).hostname;
  if (!uploadHostname.endsWith('.r2.cloudflarestorage.com')) {
    throw new Error(`Upload bloqueado: destino não é Cloudflare R2 (${uploadHostname}).`);
  }

  if (data.publicUrl.includes('.supabase.co/storage/')) {
    throw new Error('Upload bloqueado: publicUrl ainda aponta para Supabase Storage.');
  }
}

async function uploadLegacyStorageRequestToR2(
  path: string,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ publicUrl: string }> {
  const file = await extractUploadBlob(input, init);
  if (!file) throw new Error('Upload bloqueado: arquivo não encontrado na requisição antiga.');

  const authorization = getAuthorizationHeader(input, init);
  if (!authorization) throw new Error('Sessão expirada. Faça login novamente para enviar imagens.');

  const contentType = file.type || getHeaderValue(init?.headers, 'content-type') || 'application/octet-stream';
  const signResponse = await nativeFetch(`${supabaseUrl}/functions/v1/r2-sign-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: authorization,
    },
    body: JSON.stringify({
      filename: path,
      contentType,
      folder: getLegacyUploadFolder(path),
    }),
  });
  const signedUpload = await signResponse.json().catch(() => ({}));

  if (!signResponse.ok) {
    throw new Error(signedUpload.error || `Erro ao assinar upload R2 (${signResponse.status}).`);
  }

  assertSignedUploadIsR2(signedUpload);

  const uploadResponse = await nativeFetch(signedUpload.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text().catch(() => '');
    throw new Error(`R2 upload failed (${uploadResponse.status}): ${text}`);
  }

  return { publicUrl: signedUpload.publicUrl };
}

async function guardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = getRequestUrl(input);
  const method = getRequestMethod(input, init);
  const path = getChefitoObjectPath(url);

  if (path && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      console.warn('[Chefito] Supabase Storage request blocked before network; routing upload to Cloudflare R2.');
      const { publicUrl } = await uploadLegacyStorageRequestToR2(path, input, init);

      return new Response(
        JSON.stringify({ Id: path, Key: `chefito/${path}`, path, publicUrl }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('[Chefito] Legacy Storage upload could not be routed to R2:', error);

      return new Response(
        JSON.stringify({
          statusCode: '500',
          error: 'R2UploadError',
          message: error instanceof Error ? error.message : 'Erro ao enviar imagem ao R2',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return nativeFetch(input as RequestInfo, init);
}

if (typeof window !== 'undefined' && typeof window.fetch === 'function' && !window.__CHEFITO_STORAGE_FETCH_GUARD__) {
  window.__CHEFITO_STORAGE_FETCH_GUARD__ = true;
  window.fetch = guardedFetch as typeof window.fetch;
}

export {};
