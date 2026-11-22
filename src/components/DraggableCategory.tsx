import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Database } from '../types/supabase';

type Category = Database['public']['Tables']['categories']['Row'];

interface DraggableCategoryProps {
  category: Category;
  isEditing?: boolean;
  editingCategory?: Category | null;
  onEdit: (category: Category) => void;
  onSave?: (category: Category) => void;
  onCancel?: () => void;
  onDelete: (id: string) => void;
  onAddProduct?: () => void;
  productCount?: number;
  isUpdatingOrder?: boolean;
}

export const DraggableCategory = React.memo(function DraggableCategory({
  category,
  isEditing,
  editingCategory,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onAddProduct,
  productCount,
  isUpdatingOrder,
}: DraggableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  const getOrderDisplay = (order: number) => {
    if (order === 0) return 'Página inicial';
    return `Posição ${order + 1}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-lg p-3 sm:p-4 transition-all group hover:bg-gray-100 ${
        isDragging ? 'shadow-card-hover ring-2 ring-accent/20 bg-gray-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 touch-none rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="Reordenar categoria"
          >
            <i className="fas fa-grip-vertical text-base sm:text-lg"></i>
          </button>

          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1 min-w-0">
              <input
                type="text"
                value={editingCategory?.name || ''}
                onChange={(e) => onEdit({ ...category, name: e.target.value })}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm sm:text-base"
                placeholder="Nome da categoria"
                autoFocus
              />
              <input
                type="number"
                value={editingCategory?.order || ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    onEdit({ ...category, order: 0 });
                    return;
                  }
                  const value = parseInt(raw);
                  if (value >= 0) {
                    onEdit({ ...category, order: value });
                  }
                }}
                className="w-20 sm:w-24 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm sm:text-base"
                placeholder="Ordem"
                min="0"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-folder text-accent text-sm sm:text-base"></i>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 truncate text-sm sm:text-base">{category.name}</h3>
                <span className="text-xs sm:text-sm text-gray-500">{getOrderDisplay(category.order)}{productCount !== undefined ? ` · ${productCount} ${productCount === 1 ? 'produto' : 'produtos'}` : ''}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  if (!editingCategory?.name.trim()) return;
                  onSave?.(category);
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-accent hover:bg-accent/10 rounded-lg transition-colors"
              >
                <i className="fas fa-check-circle text-sm sm:text-base"></i>
              </button>
              <button
                onClick={onCancel}
                aria-label="Cancelar edição da categoria"
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <i className="fas fa-xmark text-sm sm:text-base"></i>
              </button>
            </>
          ) : (
            <>
              {onAddProduct && <button
                type="button"
                onClick={onAddProduct}
                disabled={isUpdatingOrder}
                aria-label={`Adicionar produto à categoria ${category.name}`}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-accent hover:bg-accent/10 rounded-lg transition-colors disabled:opacity-50"
              ><i className="fas fa-plus text-sm" aria-hidden="true" /></button>}
              <button
                onClick={() => onEdit(category)}
                aria-label={`Editar categoria ${category.name}`}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <i className="fas fa-pen text-xs sm:text-sm"></i>
              </button>
              <button
                onClick={() => onDelete(category.id)}
                aria-label={`Excluir categoria ${category.name}`}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
              >
                <i className="fas fa-trash text-xs sm:text-sm"></i>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
