export interface R2SignedUploadResponse {
  uploadUrl?: string;
  publicUrl?: string;
  storageProvider?: string;
  bucket?: string;
}

export interface R2SignUploadBody {
  filename: string;
  contentType: string;
  folder: string;
}

export type R2SignUpload = (body: R2SignUploadBody) => Promise<R2SignedUploadResponse>;

function assertNotSupabaseStorageUrl(url: string | undefined, label: string): asserts url is string {
  if (!url) {
    throw new Error(`R2 não retornou ${label}`);
  }

  if (url.includes('/storage/v1/object/public/') || url.includes('.supabase.co/storage/')) {
    throw new Error(`${label} aponta para Supabase Storage. Upload bloqueado: configure o R2_PUBLIC_BASE_URL/R2 secrets para Cloudflare R2.`);
  }
}

function assertR2UploadUrl(url: string): void {
  const { hostname } = new URL(url);

  if (!hostname.endsWith('.r2.cloudflarestorage.com')) {
    throw new Error(`uploadUrl não aponta para Cloudflare R2 (${hostname}). Upload bloqueado para evitar envio fora do R2.`);
  }
}

function assertCloudflareR2Signature(data: R2SignedUploadResponse): void {
  if (data.storageProvider !== 'cloudflare-r2') {
    throw new Error(
      'A edge function r2-sign-upload está desatualizada ou mal configurada: ela não confirmou storageProvider=cloudflare-r2. Redeploy obrigatório antes de enviar imagens.'
    );
  }

  if ((data.bucket || '').toLowerCase() !== 'app') {
    throw new Error(`Bucket R2 inválido (${data.bucket || 'não informado'}). O upload deve usar o bucket app do Cloudflare R2.`);
  }
}

function getUploadFilename(file: File | Blob, filenameOverride?: string): string {
  return filenameOverride || (file instanceof File ? file.name : 'image.jpg');
}

function getUploadContentType(file: File | Blob): string {
  return file.type || 'application/octet-stream';
}

export async function uploadBlobToR2(
  file: File | Blob,
  folder: string,
  signUpload: R2SignUpload,
  filenameOverride?: string
): Promise<string> {
  const filename = getUploadFilename(file, filenameOverride);
  const contentType = getUploadContentType(file);

  const signedUpload = await signUpload({ filename, contentType, folder });
  assertCloudflareR2Signature(signedUpload);

  const { uploadUrl, publicUrl } = signedUpload;

  assertNotSupabaseStorageUrl(uploadUrl, 'uploadUrl');
  assertNotSupabaseStorageUrl(publicUrl, 'publicUrl');
  assertR2UploadUrl(uploadUrl);

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => '');
    throw new Error(`R2 upload failed (${putRes.status}): ${text}`);
  }

  return publicUrl;
}
