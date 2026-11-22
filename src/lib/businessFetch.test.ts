import { describe, expect, it } from 'vitest';
import { scopeBusinessRequest } from './businessFetch';

const businessId = 'e874ef32-40dc-442f-8c39-8cb2422d686d';

describe('business API request scope', () => {
  it('filters catalog reads by business', async () => {
    const request = new Request('https://example.supabase.co/rest/v1/products?select=*');
    const result = await scopeBusinessRequest(request, businessId);
    expect(new URL(result.url).searchParams.get('business_id')).toBe(`eq.${businessId}`);
  });

  it('adds business ID to inserts and keeps platform requests unchanged', async () => {
    const insert = new Request('https://example.supabase.co/rest/v1/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Doces' }),
    });
    const scoped = await scopeBusinessRequest(insert, businessId);
    expect(await scoped.json()).toEqual({ name: 'Doces', business_id: businessId });
    const platform = new Request('https://example.supabase.co/rest/v1/businesses?select=*');
    expect((await scopeBusinessRequest(platform, businessId)).url).toBe(platform.url);
  });
});
