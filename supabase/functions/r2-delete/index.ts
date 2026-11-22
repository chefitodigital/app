import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!;
const ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
const SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
const BUCKET = 'app';
const PUBLIC_BASE_URL = 'https://app.chefi.to';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const REGION = 'auto';
const SERVICE = 's3';
const HOST = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const ENDPOINT = `https://${HOST}`;

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

async function signedDelete(key: string): Promise<Response> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const canonicalUri = '/' + uriEncode(`${BUCKET}/${key}`, false);
  const payloadHash = await sha256Hex('');
  const canonicalHeaders =
    `host:${HOST}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'DELETE',
    canonicalUri,
    '',
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

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(`${ENDPOINT}${canonicalUri}`, {
    method: 'DELETE',
    headers: {
      host: HOST,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authorization,
    },
  });
}

/**
 * Extract the R2 object key from a public URL. Supports both the custom
 * `R2_PUBLIC_BASE_URL/<key>` form and the raw `endpoint/<bucket>/<key>` form.
 */
function keyFromUrl(url: string): string | null {
  try {
    if (PUBLIC_BASE_URL && url.startsWith(PUBLIC_BASE_URL)) {
      return url.slice(PUBLIC_BASE_URL.replace(/\/$/, '').length + 1);
    }
    const u = new URL(url);
    const prefix = `/${BUCKET}/`;
    if (u.pathname.startsWith(prefix)) return u.pathname.slice(prefix.length);
    // Fall back to path minus leading slash (bucket-less domain mapping)
    return u.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    const imageUrl: string = body.imageUrl || '';
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Missing imageUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const key = keyFromUrl(imageUrl);
    if (!key) {
      return new Response(JSON.stringify({ error: 'Invalid imageUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Security: an admin may only delete objects under their own folder prefix,
    // matching the layout enforced by r2-sign-upload (<clientSlug>/...).
    if (!key.startsWith(`businesses/${business.id}/`)) {
      return new Response(JSON.stringify({ error: 'Forbidden: key outside your namespace' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await signedDelete(key);
    // R2 returns 204 on success; 404 is also fine (object already gone).
    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => '');
      console.error('R2 delete failed:', res.status, text);
      return new Response(JSON.stringify({ error: `R2 delete failed (${res.status})`, detail: text }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, key }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('r2-delete error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
