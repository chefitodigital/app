import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, className, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        initial={{ opacity: 0, transform: 'translateY(12px) scale(0.97)' }}
        animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
        exit={{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          "bg-gray-50/95 backdrop-blur-xl border border-gray-50/70 rounded-3xl shadow-[var(--shadow-overlay)] w-full max-h-[90vh] flex flex-col overflow-hidden",
          sizeClasses[size],
          className
        )}
      >
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            {title && (
              <h3 id={titleId} className="text-xl font-bold text-gray-800 font-title">
                {title}
              </h3>
            )}
            <button
              type="button"
              aria-label="Fechar janela"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <i className="fas fa-xmark text-lg text-gray-500"></i>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </motion.div>
    </motion.div>}
    </AnimatePresence>,
    document.body
  );
}
