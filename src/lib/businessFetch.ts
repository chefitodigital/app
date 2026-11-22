const BUSINESS_TABLES = new Set([
  'categories', 'tags', 'extras', 'products', 'product_extras', 'product_tags',
  'restaurant_settings', 'business_public_settings', 'customers', 'discount_coupons', 'orders', 'staff',
  'staff_schedules', 'story_views', 'product_modal_views', 'reservation_tables',
  'reservations', 'restaurant_awards',
]);

let currentBusinessId: string | null = null;
let currentOwnerId: string | null = null;

export function setCurrentBusinessId(value: string | null): void {
  currentBusinessId = value;
}

export function getCurrentBusinessId(): string | null {
  return currentBusinessId;
}

export function setCurrentOwnerId(value: string | null): void {
  currentOwnerId = value;
}

export function getCurrentOwnerId(): string | null {
  return currentOwnerId;
}

export async function scopeBusinessRequest(request: Request, businessId: string | null): Promise<Request> {
  if (!businessId) return request;
  const url = new URL(request.url);
  const table = url.pathname.match(/\/rest\/v1\/([^/]+)$/)?.[1];
  if (!table || !BUSINESS_TABLES.has(table)) return request;

  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'PATCH' || request.method === 'DELETE') {
    if (!url.searchParams.has('business_id')) url.searchParams.set('business_id', `eq.${businessId}`);
    return new Request(url, request);
  }

  if (request.method === 'POST' && request.headers.get('Content-Type')?.includes('application/json')) {
    const body = JSON.parse(await request.clone().text());
    const scoped = (row: Record<string, unknown>) => ({ ...row, business_id: businessId });
    const updated = Array.isArray(body) ? body.map(scoped) : scoped(body);
    return new Request(url, { method: request.method, headers: request.headers, body: JSON.stringify(updated) });
  }

  return request;
}
