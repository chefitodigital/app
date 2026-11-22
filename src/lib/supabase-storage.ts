import { deleteFromR2, uploadToR2 } from './r2-storage';

function buildLegacyCompatibleFilename(file: File | Blob): string {
  const originalName = file instanceof File ? file.name : 'image.jpg';
  const extension = originalName.split('.').pop() || 'jpg';
  const baseName = originalName
    .split('.')
    .slice(0, -1)
    .join('.')
    .replace(/[^a-zA-Z0-9]/g, '_') || 'image';

  return `${baseName}-${Date.now()}.${extension}`;
}

export async function uploadToSupabaseStorage(file: File | Blob, email?: string): Promise<string> {
  console.warn('uploadToSupabaseStorage is deprecated; routing upload to Cloudflare R2 instead.');

  const folder = email ? 'products' : 'general';
  return uploadToR2(file, folder, buildLegacyCompatibleFilename(file));
}

export async function deleteFromSupabaseStorage(imageUrl: string): Promise<void> {
  console.warn('deleteFromSupabaseStorage is deprecated; routing delete to Cloudflare R2 instead.');
  await deleteFromR2(imageUrl);
}
