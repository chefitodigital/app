import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { uploadToR2 } from '../lib/r2-storage';
import { processImageForUpload } from '../lib/imageProcessing';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, blurDataURL?: string) => void;
  currentImageUrl?: string;
  altText?: string;
  filenameBase?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (limite de upload antes de comprimir)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function ImageUpload({ onImageUpload, currentImageUrl, altText, filenameBase }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    }
  }, [currentImageUrl]);

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

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('O arquivo deve ser uma imagem (JPG, PNG, GIF ou WebP)');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('O arquivo deve ter no máximo 5MB');
      return false;
    }

    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    try {
      setIsUploading(true);

      // Redimensiona para máx 1440px e comprime para WebP 200–300KB
      const { file: uploadFile, blurDataURL } = await processImageForUpload(file, {
        maxWidth: 1440,
        targetMinBytes: 200 * 1024,
        targetMaxBytes: 300 * 1024,
      });

      // Slug-based filename (falls back to timestamp only if none provided)
      const slug = (filenameBase || 'produto')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60) || 'produto';
      const finalName = `${slug}-${Date.now()}.webp`;

      // Upload to Cloudflare R2 via signed URL
      const publicUrl = await uploadToR2(uploadFile, 'products', finalName);

      // Set preview immediately with the returned URL
      setPreview(publicUrl);
      
      // Notify parent component
      onImageUpload(publicUrl, blurDataURL);
      
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setPreview(currentImageUrl || null);
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      toast.error(`Erro ao enviar imagem: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageUpload('', undefined);
    toast.success('Imagem removida com sucesso!');
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-gray-200 hover:border-accent/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative aspect-[16/9]">
            <img
              src={preview}
              alt={altText || 'Pré-visualização'}
              className="w-full h-full object-cover rounded-lg"
              onError={() => {
                console.error('Error loading preview image:', preview);
                setPreview(currentImageUrl || null);
                toast.error('Erro ao carregar imagem');
              }}
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg shadow-lg transition-colors"
            >
              <i className="fas fa-xmark text-lg text-gray-500"></i>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <i className={`fas fa-cloud-upload-alt text-4xl ${isUploading ? 'text-accent animate-bounce' : 'text-gray-400'}`}></i>
            <p className="mt-2 text-sm text-gray-500">
              Arraste uma imagem ou{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-accent hover:underline"
              >
                escolha um arquivo
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              PNG, JPG, GIF ou WebP até 5MB (convertida para WebP ~250KB, máx 1440px)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />

        {isUploading && (
          <div className="absolute inset-0 bg-gray-50/50 flex items-center justify-center rounded-lg">
            <div className="w-8 h-8 border-2 border-accent rounded-full animate-spin border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}
