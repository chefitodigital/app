interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

interface Product {
  slug: string;
  name: string;
  description: string;
  image_url: string;
}

interface Settings {
  name: string;
  about_us: string | null;
  logo_url: string | null;
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

async function query<T>(env: Env, table: string, params: URLSearchParams): Promise<T[]> {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?${params}`;
  const response = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  });
  return response.ok ? response.json() as Promise<T[]> : [];
}

function metaTags({ title, description, image, canonical, type }: {
  title: string;
  description: string;
  image?: string | null;
  canonical: string;
  type: 'website' | 'product';
}) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description.slice(0, 200));
  const safeCanonical = escapeHtml(canonical);
  const safeImage = image ? `\n    <meta property="og:image" content="${escapeHtml(image)}" />\n    <meta name="twitter:image" content="${escapeHtml(image)}" />` : '';

  return `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <link rel="canonical" href="${safeCanonical}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${safeCanonical}" />${safeImage}
    <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />`;
}

function injectHead(html: string, tags: string) {
  const withoutDefaultMetadata = html
    .replace(/<title>[^<]*<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/i, '');
  return withoutDefaultMetadata.replace(/<head>/i, `<head>${tags}`);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const requestUrl = new URL(context.request.url);
  const path = requestUrl.pathname;

  if (path === '/robots.txt') {
    return new Response(`User-agent: *\nAllow: /\nDisallow: /ajustes\nDisallow: /pedidos\nDisallow: /clientes\nDisallow: /colaboradores\nDisallow: /produtos\nDisallow: /financeiro\nDisallow: /reservas\nDisallow: /perfil\nDisallow: /pedido/\nSitemap: ${requestUrl.origin}/sitemap.xml\n`, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
    });
  }

  if (path === '/sitemap.xml') {
    const products = await query<Product>(context.env, 'products', new URLSearchParams({ select: 'slug', active: 'eq.true' }));
    const urls = [requestUrl.origin, ...products.map((product) => `${requestUrl.origin}/produto/${encodeURIComponent(product.slug)}`)];
    const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeHtml(url)}</loc></url>`).join('')}</urlset>`;
    return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
  }

  const asset = await context.next();
  if (context.request.method !== 'GET' || !asset.headers.get('content-type')?.includes('text/html')) return asset;

  const settings = (await query<Settings>(context.env, 'restaurant_settings', new URLSearchParams({ select: 'name,about_us,logo_url', limit: '1' })))[0];
  if (!settings) return asset;

  const productMatch = path.match(/^\/produto\/([^/]+)$/);
  const requestedSlug = productMatch ? decodeURIComponent(productMatch[1]) : null;
  const product = requestedSlug
    ? (await query<Product>(context.env, 'products', new URLSearchParams({ select: 'slug,name,description,image_url', slug: `eq.${requestedSlug}`, active: 'eq.true', limit: '1' })))[0]
    : undefined;

  const canonical = `${requestUrl.origin}${path}`;
  const tags = product
    ? metaTags({ title: `${product.name} | ${settings.name}`, description: product.description || `Peça ${product.name} em ${settings.name}.`, image: product.image_url, canonical, type: 'product' })
    : metaTags({ title: settings.name, description: settings.about_us || `Ementa e pedidos online de ${settings.name}.`, image: settings.logo_url, canonical, type: 'website' });

  const html = injectHead(await asset.text(), tags);
  const headers = new Headers(asset.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300');
  return new Response(html, { status: asset.status, headers });
};
