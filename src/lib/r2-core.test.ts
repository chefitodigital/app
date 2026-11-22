import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadBlobToR2 } from './r2-core';

const uploadUrl = 'https://example.r2.cloudflarestorage.com/app/businesses/business-id/products/image.jpg?signature=test';
const publicUrl = 'https://app.chefi.to/businesses/business-id/products/image.jpg';

afterEach(() => vi.unstubAllGlobals());

describe('R2 upload destination', () => {
  it('accepts the app bucket and sends bytes only to Cloudflare R2', async () => {
    const put = vi.fn(async (input: RequestInfo | URL) => { void input; return new Response(null, { status: 200 }); });
    vi.stubGlobal('fetch', put);
    const result = await uploadBlobToR2(new Blob(['image'], { type: 'image/png' }), 'products', async () => ({
      storageProvider: 'cloudflare-r2', bucket: 'app', uploadUrl, publicUrl,
    }));
    expect(result).toBe(publicUrl);
    expect(put).toHaveBeenCalledTimes(1);
    expect(String(put.mock.calls[0][0])).toBe(uploadUrl);
  });

  it('rejects the legacy bucket before upload', async () => {
    const put = vi.fn();
    vi.stubGlobal('fetch', put);
    await expect(uploadBlobToR2(new Blob(['image']), 'products', async () => ({
      storageProvider: 'cloudflare-r2', bucket: 'chefito', uploadUrl, publicUrl,
    }))).rejects.toThrow('Bucket R2 inválido');
    expect(put).not.toHaveBeenCalled();
  });
});
