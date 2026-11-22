/**
 * Video validation + transcoding to WebM (VP8/Opus) using Mediabunny + WebCodecs.
 *
 * - Duration is validated up-front (client-side) with a hidden <video> element.
 * - Transcoding uses WebCodecs when available (no ffmpeg.wasm bundle bloat).
 * - When WebCodecs is unavailable (older Safari/Firefox), we throw a specific
 *   error so the caller can fall back to uploading the original file.
 */
import {
  Conversion,
  Input,
  Output,
  BlobSource,
  BufferTarget,
  WebMOutputFormat,
  ALL_FORMATS,
} from 'mediabunny';

export const VIDEO_MAX_DURATION_SEC = 15;
export const VIDEO_MAX_INPUT_BYTES = 100 * 1024 * 1024; // 100MB input cap
/**
 * Cap for the fallback path (WebCodecs unavailable OR transcode failed):
 * the original file is uploaded as-is, so we must keep it small.
 */
export const VIDEO_FALLBACK_MAX_BYTES = 15 * 1024 * 1024; // 15MB
export const VIDEO_ALLOWED_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-matroska',
];

export class WebCodecsUnavailableError extends Error {
  constructor() {
    super('WebCodecs não disponível neste navegador');
    this.name = 'WebCodecsUnavailableError';
  }
}

type WebCodecsWindow = Window & {
  VideoEncoder?: unknown;
  VideoDecoder?: unknown;
  AudioEncoder?: unknown;
};

export function hasWebCodecs(): boolean {
  const codecs = window as WebCodecsWindow;
  return (
    typeof window !== 'undefined' &&
    typeof codecs.VideoEncoder === 'function' &&
    typeof codecs.VideoDecoder === 'function' &&
    typeof codecs.AudioEncoder === 'function'
  );
}

export function getVideoDuration(file: File | Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadedmetadata = () => {
      const d = video.duration;
      cleanup();
      if (!isFinite(d) || d <= 0) {
        reject(new Error('Não foi possível ler a duração do vídeo'));
      } else {
        resolve(d);
      }
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('Falha ao ler o vídeo. Formato pode ser incompatível.'));
    };
  });
}

export interface TranscodeResult {
  blob: Blob;
  duration: number;
}

/**
 * Transcode any supported input video to WebM (VP8 video + Opus audio).
 * Throws WebCodecsUnavailableError if the browser lacks WebCodecs.
 */
export async function transcodeVideoToWebM(
  file: File,
  onProgress?: (progress: number) => void
): Promise<TranscodeResult> {
  if (!hasWebCodecs()) {
    throw new WebCodecsUnavailableError();
  }

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  const output = new Output({
    format: new WebMOutputFormat(),
    target: new BufferTarget(),
  });

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      codec: 'vp8',
      bitrate: 4_500_000, // ~4.5 Mbps — alta qualidade para story vertical de 15s
    },
    audio: {
      codec: 'opus',
      bitrate: 96_000,
    },
  });

  if (!conversion.isValid) {
    throw new Error('Não foi possível preparar a conversão para WebM');
  }

  if (onProgress) {
    conversion.onProgress = (p) => onProgress(p);
  }

  const duration = await input.computeDuration().catch(() => 0);

  await conversion.execute();

  const buf = (output.target as BufferTarget).buffer;
  if (!buf) throw new Error('Saída WebM vazia');

  return {
    blob: new Blob([buf], { type: 'video/webm' }),
    duration,
  };
}
