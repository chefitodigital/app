import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { uploadToR2 } from '../../lib/r2-storage';
import { Toggle } from '../ui/Toggle';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { StoryImage } from '../../types/supabase';
import {
  transcodeVideoToWebM,
  getVideoDuration,
  hasWebCodecs,
  WebCodecsUnavailableError,
  VIDEO_MAX_DURATION_SEC,
  VIDEO_MAX_INPUT_BYTES,
  VIDEO_FALLBACK_MAX_BYTES,
  VIDEO_ALLOWED_TYPES,
} from '../../lib/videoTranscode';

interface StorySectionProps {
  formData: {
    story_enabled: boolean;
    story_auto_open: boolean;
    story_images: StoryImage[];
    story_image_format: 'vertical' | 'portrait' | 'square';
  };
  onChange: (field: string, value: unknown) => void;
}

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const MAX_IMAGES = 3;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const formatStyles = {
  vertical: 'aspect-[9/16]',
  portrait: 'aspect-[3/4]',
  square: 'aspect-square',
};

const formatLabels = {
  vertical: 'Vertical (9:16)',
  portrait: 'Retrato (3:4)',
  square: 'Quadrado (1:1)',
};

interface SortableImageProps {
  image: StoryImage;
  index: number;
  format: 'vertical' | 'portrait' | 'square';
  onRemove: (id: string) => void;
}

function SortableImage({ image, index, format, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
      {...attributes}
    >
      <div
        {...listeners}
        className={`${formatStyles[format]} w-full bg-gray-100 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border-2 border-gray-200 hover:border-accent transition-colors`}
      >
        {image.media_type === 'video' ? (
          <video
            src={image.url}
            className="w-full h-full object-cover pointer-events-none"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={image.url}
            alt={`Story ${index + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        )}
        <div className="absolute top-2 left-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
          {index + 1}
        </div>
        {image.media_type === 'video' && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-gray-950/70 text-white text-xs font-semibold uppercase tracking-wide">
            <i className="fa-solid fa-video mr-1"></i>Vídeo
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(image.id)}
        className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-900 text-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
}

export function StorySection({ formData, onChange }: StorySectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [transcodeProgress, setTranscodeProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const isVideoFile = (file: File) =>
    file.type.startsWith('video/') || VIDEO_ALLOWED_TYPES.includes(file.type);

  const validateImageFile = (file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Imagem deve ser JPG, PNG, GIF ou WebP');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('A imagem deve ter no máximo 3MB');
      return false;
    }
    return true;
  };

  const validateVideoFile = (file: File): boolean => {
    if (file.size > VIDEO_MAX_INPUT_BYTES) {
      toast.error('O vídeo original deve ter no máximo 100MB');
      return false;
    }
    return true;
  };

  const resizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxDimension = 1920;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          file.type,
          0.85
        );

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleFileUpload = async (file: File) => {
    if (formData.story_images.length >= MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens atingido`);
      return;
    }

    const isVideo = isVideoFile(file);
    if (isVideo ? !validateVideoFile(file) : !validateImageFile(file)) return;

    try {
      setIsUploading(true);
      setTranscodeProgress(0);

      const timestamp = Date.now();
      const safeOriginalName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_');

      let uploadBlob: File | Blob;
      let uploadFilename: string;
      let mediaType: 'image' | 'video' = 'image';
      let mediaDuration: number | undefined;

      if (isVideo) {
        // 1) Validate duration up-front so we never transcode a >15s file.
        const rawDuration = await getVideoDuration(file);
        if (rawDuration > VIDEO_MAX_DURATION_SEC + 0.25) {
          toast.error(`O vídeo deve ter no máximo ${VIDEO_MAX_DURATION_SEC}s (tem ${rawDuration.toFixed(1)}s)`);
          return;
        }

        // 2) If the browser can't transcode, enforce a stricter size cap so we
        //    never upload a 60MB+ original. Do this BEFORE the try so the user
        //    gets a clear error instead of an "upload original" fallback.
        const canTranscode = hasWebCodecs();
        if (!canTranscode && file.size > VIDEO_FALLBACK_MAX_BYTES) {
          const mb = (file.size / 1024 / 1024).toFixed(1);
          toast.error(
            `Este navegador não consegue comprimir vídeo. Envie um arquivo até ${VIDEO_FALLBACK_MAX_BYTES / 1024 / 1024}MB (o seu tem ${mb}MB) ou use Chrome/Edge/Safari.`
          );
          return;
        }

        // 3) Transcode to WebM VP8/Opus via WebCodecs. Fallback: upload original.
        mediaType = 'video';
        try {
          if (!canTranscode) throw new WebCodecsUnavailableError();
          const toastId = toast.loading('A converter vídeo para WebM…');
          const { blob, duration } = await transcodeVideoToWebM(file, (p) => {
            setTranscodeProgress(Math.round(p * 100));
          });
          toast.dismiss(toastId);
          uploadBlob = blob;
          uploadFilename = `story-r2-${timestamp}-${safeOriginalName.replace(/\.[^.]+$/, '')}.webm`;
          mediaDuration = duration || rawDuration;
        } catch (err) {
          // Fallback path — also cap size here in case transcode failed mid-way.
          if (file.size > VIDEO_FALLBACK_MAX_BYTES) {
            const mb = (file.size / 1024 / 1024).toFixed(1);
            toast.error(
              `Falha ao converter e arquivo muito grande (${mb}MB). Envie um vídeo até ${VIDEO_FALLBACK_MAX_BYTES / 1024 / 1024}MB.`
            );
            return;
          }
          if (err instanceof WebCodecsUnavailableError) {
            toast('Navegador sem WebCodecs — enviando o vídeo original', { icon: <i className="fas fa-circle-info text-blue-500" /> });
          } else {
            console.error('Transcode failed, uploading original:', err);
            toast('Falha ao converter — enviando o vídeo original', { icon: <i className="fas fa-triangle-exclamation text-yellow-500" /> });
          }
          uploadBlob = file;
          uploadFilename = `story-r2-${timestamp}-${safeOriginalName}`;
          mediaDuration = rawDuration;
        }
      } else {
        const uniqueFile = new File([file], `story_${timestamp}_${file.name}`, { type: file.type });
        uploadBlob = file.size > MAX_FILE_SIZE * 0.8 ? await resizeImage(uniqueFile) : uniqueFile;
        uploadFilename = `story-r2-${timestamp}-${safeOriginalName}`;
      }

      const publicUrl = await uploadToR2(uploadBlob, 'story', uploadFilename);

      const newImage: StoryImage = {
        id: crypto.randomUUID(),
        url: publicUrl,
        order: formData.story_images.length,
        media_type: mediaType,
        ...(mediaDuration ? { duration: mediaDuration } : {}),
      };

      onChange('story_images', [...formData.story_images, newImage]);
      toast.success(isVideo ? 'Vídeo enviado com sucesso!' : 'Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading story media:', error);
      toast.error(`Erro ao enviar: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    } finally {
      setIsUploading(false);
      setTranscodeProgress(0);
    }
  };

  const handleRemoveImage = (id: string) => {
    const updatedImages = formData.story_images
      .filter(img => img.id !== id)
      .map((img, index) => ({ ...img, order: index }));
    onChange('story_images', updatedImages);
    toast.success('Imagem do story removida');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formData.story_images.findIndex(img => img.id === active.id);
      const newIndex = formData.story_images.findIndex(img => img.id === over.id);

      const reorderedImages = arrayMove(formData.story_images, oldIndex, newIndex).map((img, index) => ({
        ...img,
        order: index
      }));

      onChange('story_images', reorderedImages);
    }
  };

  const canAddMore = formData.story_images.length < MAX_IMAGES;
  const canTranscodeVideo = hasWebCodecs();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Configurações do Story</h2>
        <p className="text-sm text-gray-600">
          Configure stories/anúncios que serão exibidos aos clientes ao acessarem o cardápio
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-medium text-gray-800">Ativar Story</label>
            <p className="text-sm text-gray-600 mt-1">
              Exibe um botão de story no cardápio
            </p>
          </div>
          <Toggle
            checked={formData.story_enabled}
            onChange={(checked) => onChange('story_enabled', checked)}
          />
        </div>

        {formData.story_enabled && (
          <>
            {!canTranscodeVideo && (
              <div className="flex gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <i className="fa-solid fa-triangle-exclamation text-gray-600 flex-shrink-0 mt-0.5"></i>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Compressão de vídeo indisponível neste navegador</p>
                  <p>
                    O seu navegador (provavelmente Firefox) não suporta a API WebCodecs, usada
                    para comprimir vídeos automaticamente. Você ainda pode enviar vídeos até{' '}
                    <strong>{VIDEO_FALLBACK_MAX_BYTES / 1024 / 1024}MB</strong>, mas para arquivos
                    maiores use <strong>Chrome</strong>, <strong>Edge</strong>, <strong>Opera</strong>{' '}
                    ou <strong>Safari 16.4+</strong> — nesses navegadores o vídeo é comprimido para
                    WebM automaticamente (aceita até 100MB de origem).
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="block font-medium text-gray-800">
                Formato das Imagens
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Escolha o formato que melhor se adapta às suas imagens
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(['vertical', 'portrait', 'square'] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => onChange('story_image_format', format)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.story_image_format === format
                        ? 'border-accent bg-accent/5'
                        : 'border-gray-200 hover:border-accent/30'
                    }`}
                  >
                    <div className={`${formatStyles[format]} w-full bg-gray-200 rounded-lg mb-2 mx-auto max-w-[80px]`}></div>
                    <p className="text-sm font-medium text-gray-800 text-center">
                      {formatLabels[format]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-medium text-gray-800">
                  Imagens do Story
                </label>
                <span className="text-sm font-medium text-gray-600">
                  {formData.story_images.length}/{MAX_IMAGES} imagens
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Faça upload de até {MAX_IMAGES} imagens (máximo 3MB cada). Arraste para reordenar.
              </p>

              {formData.story_images.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.story_images.map(img => img.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {formData.story_images.map((image, index) => (
                        <SortableImage
                          key={image.id}
                          image={image}
                          index={index}
                          format={formData.story_image_format}
                          onRemove={handleRemoveImage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {canAddMore && (
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                    isDragging
                      ? 'border-accent bg-accent/5'
                      : 'border-gray-200 hover:border-accent/50'
                  } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center">
                    <i className={`fa-solid fa-image text-4xl ${isUploading ? 'text-accent animate-pulse' : 'text-gray-400'}`}></i>
                    <p className="mt-2 text-sm text-gray-500">
                      Arraste uma imagem ou{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-accent hover:underline"
                        disabled={isUploading}
                      >
                        escolha um arquivo
                      </button>
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Imagem (PNG/JPG/GIF/WebP até 3MB) ou vídeo MP4/MOV/WebM até {VIDEO_MAX_DURATION_SEC}s
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-matroska"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = '';
                    }}
                    disabled={isUploading}
                  />

                  {isUploading && (
                    <div className="absolute inset-0 bg-gray-50/50 flex items-center justify-center rounded-lg">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-accent rounded-full animate-spin border-t-transparent"></div>
                        {transcodeProgress > 0 && (
                          <span className="text-xs font-medium text-accent">
                            Convertendo… {transcodeProgress}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="font-medium text-gray-800">Abrir Automaticamente</label>
                <p className="text-sm text-gray-600 mt-1">
                  O modal do story abrirá automaticamente uma vez por sessão
                </p>
              </div>
              <Toggle
                checked={formData.story_auto_open}
                onChange={(checked) => onChange('story_auto_open', checked)}
                disabled={formData.story_images.length === 0}
              />
            </div>

            {formData.story_auto_open && (
              <div className="bg-accent/5 border border-accent/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <i className="fa-solid fa-circle-info text-accent flex-shrink-0 mt-0.5"></i>
                  <div className="text-sm text-gray-800">
                    <p className="font-semibold mb-1">Abertura Automática Ativada</p>
                    <p className="text-gray-600">
                      Os stories serão exibidos automaticamente quando o cliente acessar o cardápio,
                      mas apenas uma vez por sessão. Se o cliente fechar o navegador e voltar,
                      os stories serão exibidos novamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
