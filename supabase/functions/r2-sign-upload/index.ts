import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!;
const ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
const SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
const BUCKET = 'app';
const RAW_PUBLIC_BASE_URL = 'https://app.chefi.to';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const REGION = 'auto';
const SERVICE = 's3';
const HOST = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const ENDPOINT = `https://${HOST}`;

function assertR2Configuration(): void {
  const missing = [
    ['R2_ACCOUNT_ID', ACCOUNT_ID],
    ['R2_ACCESS_KEY_ID', ACCESS_KEY_ID],
    ['R2_SECRET_ACCESS_KEY', SECRET_ACCESS_KEY],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(`Missing Cloudflare R2 configuration: ${missing.map(([name]) => name).join(', ')}`);
  }
}

function getSafePublicBaseUrl(): string {
  const value = RAW_PUBLIC_BASE_URL.trim().replace(/\/$/, '');
  if (!value) return '';

  try {
    const url = new URL(value);
    const isSupabaseStorageUrl = url.hostname.endsWith('.supabase.co')
      || url.pathname.includes('/storage/v1/object/public');

    if (isSupabaseStorageUrl) {
      console.error('Ignoring invalid R2_PUBLIC_BASE_URL: it points to Supabase Storage, not R2.');
      return '';
    }

    return value;
  } catch {
    console.error('Ignoring invalid R2_PUBLIC_BASE_URL: it is not a valid URL.');
    return '';
  }
}

// ---------- SigV4 helpers ----------
const enc = new TextEncoder();

async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const buf = typeof data === 'string' ? enc.encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// RFC3986 encoding — do NOT encode "/"
function uriEncode(str: string, encodeSlash = true): string {
  return str
    .split('')
    .map((c) => {
      if (/[A-Za-z0-9\-._~]/.test(c)) return c;
      if (c === '/' && !encodeSlash) return c;
      return encodeURIComponent(c).replace(/[!'()*]/g, (m) =>
        '%' + m.charCodeAt(0).toString(16).toUpperCase()
      );
    })
    .join('');
}

async function signPresignedPutUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const credential = `${ACCESS_KEY_ID}/${credentialScope}`;

  const canonicalUri = '/' + uriEncode(`${BUCKET}/${key}`, false);
  const signedHeaders = 'host';

  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': signedHeaders,
  };

  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${uriEncode(k)}=${uriEncode(query[k])}`)
    .join('&');

  const canonicalHeaders = `host:${HOST}\n`;
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = await hmac(enc.encode('AWS4' + SECRET_ACCESS_KEY), dateStamp);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = toHex(await hmac(kSigning, stringToSign));

  return `${ENDPOINT}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

// ---------- Handler ----------
function sanitizeSegment(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    assertR2Configuration();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (!business) {
      return new Response(JSON.stringify({ error: 'Forbidden: business owner required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const filename: string = body.filename || 'image.jpg';
    const contentType: string = body.contentType || 'application/octet-stream';
    const folder: string = sanitizeSegment(body.folder || 'general');

    const safeName = sanitizeSegment(filename);
    const key = `businesses/${business.id}/${folder}/${crypto.randomUUID()}_${safeName}`;

    const uploadUrl = await signPresignedPutUrl(key, contentType);
    const publicBaseUrl = getSafePublicBaseUrl();
    const publicUrl = publicBaseUrl
      ? `${publicBaseUrl}/${key}`
      : `${ENDPOINT}/${BUCKET}/${key}`;

    return new Response(
      JSON.stringify({
        storageProvider: 'cloudflare-r2',
        bucket: BUCKET,
        uploadUrl,
        publicUrl,
        key,
        contentType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('r2-sign-upload error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
