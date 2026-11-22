import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Database } from '../types/supabase';
import { useThemeStore } from '../store/theme';

type Product = Database['public']['Tables']['products']['Row'];
type Extra = Database['public']['Tables']['extras']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

interface ProductWithExtrasAndTags extends Product {
  extras: Extra[];
  tags: Tag[];
}

interface DraggableProductProps {
  product: ProductWithExtrasAndTags;
  onEdit: (product: ProductWithExtrasAndTags) => void;
  onDelete: (id: string) => void;
}

export const DraggableProduct = React.memo(function DraggableProduct({ product, onEdit, onDelete }: DraggableProductProps) {
  const { formatCurrency } = useThemeStore();
  const [imageError, setImageError] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-lg p-3 sm:p-4 transition-all group hover:bg-gray-100 ${
        isDragging ? 'shadow-xl ring-2 ring-accent/20 bg-gray-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 touch-none rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="Reordenar produto"
          >
            <i className="fas fa-grip-vertical text-base sm:text-lg"></i>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {product.image_url && !imageError ? (
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-image text-gray-400 text-sm sm:text-lg"></i>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h4 className="font-medium text-gray-800 truncate text-sm sm:text-base">
                  {product.name || 'Sem nome'}
                </h4>
                {!product.active && (
                  <span className="px-1.5 sm:px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-500 flex-shrink-0">
                    Inativo
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-accent font-semibold mt-0.5">
                {formatCurrency(Number(product.price))}
              </p>
              {product.extras.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">
                  {product.extras.length} extra{product.extras.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-2">
          <button
            onClick={() => onEdit(product)}
            aria-label={`Editar produto ${product.name}`}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <i className="fas fa-pen text-xs sm:text-sm"></i>
          </button>
          <button
            onClick={() => onDelete(product.id)}
            aria-label={`Excluir produto ${product.name}`}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
          >
            <i className="fas fa-trash text-xs sm:text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
});
