import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { trackStoryView } from '../services/analyticsService';
import { markStoryAsViewed } from '../lib/sessionManager';
import type { StoryImage } from '../types/supabase';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: StoryImage[];
  format: 'vertical' | 'portrait' | 'square';
}

const formatStyles = {
  vertical: 'aspect-[9/16] max-h-[90vh] max-w-[50vh]',
  portrait: 'aspect-[3/4] max-h-[85vh] max-w-[64vh]',
  square: 'aspect-square max-w-[600px] max-h-[90vh]',
};

const STORY_DURATION = 10000;

export function StoryModal({ isOpen, onClose, images, format }: StoryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const minSwipeDistance = 50;

  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  const currentImage = sortedImages[currentIndex];
  const hasMultipleImages = sortedImages.length > 1;
  const isCurrentVideo = currentImage?.media_type === 'video';

  const nextImage = useCallback(() => {
    if (currentIndex < sortedImages.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setImageLoaded(false);
      setImageError(false);
    } else {
      onCloseRef.current();
    }
  }, [currentIndex, sortedImages.length]);

  const prevImage = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setImageLoaded(false);
      setImageError(false);
    } else {
      setCurrentIndex(sortedImages.length - 1);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [currentIndex, sortedImages.length]);

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    setImageLoaded(false);
    setImageError(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
  };

  useEffect(() => {
    if (isOpen && currentImage) {
      trackStoryView(currentImage.url);
      const firstImageUrl = sortedImages[0]?.url;
      if (firstImageUrl) {
        markStoryAsViewed(firstImageUrl);
      }
    }
  }, [isOpen, currentImage, sortedImages]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'ArrowRight' && hasMultipleImages) {
          nextImage();
        } else if (e.key === 'ArrowLeft' && hasMultipleImages) {
          prevImage();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose, hasMultipleImages, nextImage, prevImage]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setImageLoaded(false);
      setImageError(false);
      setIsVideoPaused(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Image progress: fixed 10s timer. Videos use their own onTimeUpdate/onEnded.
    if (!isOpen || !imageLoaded || isCurrentVideo) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / STORY_DURATION) * 100);
      setProgress(pct);
      if (elapsed >= STORY_DURATION) {
        window.clearInterval(interval);
        nextImage();
      }
    }, 50);
    return () => window.clearInterval(interval);
  }, [isOpen, imageLoaded, currentIndex, isCurrentVideo, nextImage]);

  // Reset paused-state whenever the active media changes.
  useEffect(() => {
    setIsVideoPaused(false);
  }, [currentIndex]);

  const handleVideoTap = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  if (!isOpen || sortedImages.length === 0) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className={`relative ${formatStyles[format]} w-full mx-4 animate-scaleIn`}>
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-gray-950/70 text-gray-50 hover:text-gray-300 text-sm font-medium rounded-full backdrop-blur-sm transition-colors"
          aria-label="Fechar"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>Fechar</span>
        </button>

        {hasMultipleImages && (
          <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-gray-950/70 text-gray-50 text-sm font-medium rounded-full backdrop-blur-sm">
            {currentIndex + 1}/{sortedImages.length}
          </div>
        )}

        <div
          className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
            {sortedImages.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                    transition: idx === currentIndex ? 'width 50ms linear' : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-50"></div>
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-50 text-center p-4">
              <div>
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-lg">Não foi possível carregar a imagem</p>
              </div>
            </div>
          )}

          {isCurrentVideo ? (
            <>
              <video
                ref={videoRef}
                key={currentImage?.url}
                src={currentImage?.url}
                className={`w-full h-full object-cover transition-opacity duration-300 cursor-pointer ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                autoPlay
                muted
                playsInline
                preload="auto"
                onClick={handleVideoTap}
                onLoadedData={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                onPlay={() => setIsVideoPaused(false)}
                onPause={() => setIsVideoPaused(true)}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration > 0) {
                    setProgress(Math.min(100, (v.currentTime / v.duration) * 100));
                  }
                }}
                onEnded={nextImage}
              />
              {isVideoPaused && imageLoaded && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-950/60 flex items-center justify-center backdrop-blur-sm">
                    <i className="fa-solid fa-play text-2xl text-white translate-x-0.5"></i>
                  </div>
                </div>
              )}
            </>
          ) : (
            <img
              src={currentImage?.url}
              alt={`Story ${currentIndex + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-gray-950/50 hover:bg-gray-950/70 text-gray-50 rounded-full transition-all backdrop-blur-sm"
                aria-label="Imagem anterior"
              >
                <i className="fa-solid fa-angle-left text-3xl"></i>
              </button>

              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-gray-950/50 hover:bg-gray-950/70 text-gray-50 rounded-full transition-all backdrop-blur-sm"
                aria-label="Próxima imagem"
              >
                <i className="fa-solid fa-angle-right text-3xl"></i>
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {sortedImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-gray-50 w-8'
                        : 'bg-gray-50/50 hover:bg-gray-50/70'
                    }`}
                    aria-label={`Ir para imagem ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
