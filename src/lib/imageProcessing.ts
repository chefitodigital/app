// Client-side image pipeline: resize to max width, convert to WebP,
// iteratively adjust quality to hit a target file-size window.

export interface ProcessOptions {
  maxWidth?: number;          // default 1440
  targetMinBytes?: number;    // default 200 KB
  targetMaxBytes?: number;    // default 300 KB
  minQuality?: number;        // default 0.4
  maxQuality?: number;        // default 0.92
}

const DEFAULTS: Required<ProcessOptions> = {
  maxWidth: 1440,
  targetMinBytes: 200 * 1024,
  targetMaxBytes: 300 * 1024,
  minQuality: 0.4,
  maxQuality: 0.92,
};

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao ler a imagem'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem'))),
      type,
      quality
    );
  });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate a tiny (~24px wide) JPEG data URL to use as an LQIP blur placeholder.
 * Output is typically well under 1KB.
 */
export async function generateBlurDataURL(img: HTMLImageElement, targetWidth = 24): Promise<string> {
  const ratio = img.height / img.width;
  const w = targetWidth;
  const h = Math.max(1, Math.round(w * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.5);
  return blobToDataURL(blob);
}

/**
 * Resize (max width) + convert to WebP, aiming for [targetMin..targetMax] bytes
 * via binary search on quality. Returns a File with .webp extension.
 */
export async function processImageForUpload(
  file: File,
  opts: ProcessOptions = {}
): Promise<{ file: File; blurDataURL: string }> {
  const o = { ...DEFAULTS, ...opts };

  const img = await loadImage(file);
  let { width, height } = img;

  if (width > o.maxWidth) {
    height = Math.round((height * o.maxWidth) / width);
    width = o.maxWidth;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  ctx.drawImage(img, 0, 0, width, height);

  // Binary search quality to land in the target window.
  let low = o.minQuality;
  let high = o.maxQuality;
  let best: Blob | null = null;

  for (let i = 0; i < 8; i++) {
    const q = (low + high) / 2;
    const blob = await canvasToBlob(canvas, 'image/webp', q);

    if (blob.size > o.targetMaxBytes) {
      high = q; // too big → lower quality
    } else if (blob.size < o.targetMinBytes) {
      // too small → keep as candidate and try higher quality for better fidelity
      if (!best || blob.size > best.size) best = blob;
      low = q;
    } else {
      best = blob;
      break;
    }
    if (!best) best = blob;
  }

  if (!best) throw new Error('Falha ao comprimir imagem');

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  const outFile = new File([best], `${baseName}.webp`, { type: 'image/webp' });
  const blurDataURL = await generateBlurDataURL(img);
  return { file: outFile, blurDataURL };
}