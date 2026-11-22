import { useState, useEffect } from 'react';
import type { Database } from '../../types/supabase';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmModal } from '../ui/ConfirmModal';
import { GenericFormModal, FormFieldConfig } from '../ui/GenericFormModal';
import { validate, validationSchemas } from '../../lib/validation';
import { showError } from '../../lib/errorHandler';
import { categoryService } from '../../services';
import { DraggableCategory } from '../DraggableCategory';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryWithCount extends Category {
  productCount: number;
}

interface CategoriesSectionProps {
  categories: CategoryWithCount[];
  onRefresh: () => void;
  onAddProduct: (categoryId: string) => void;
}

export function CategoriesSection({ categories, onRefresh, onAddProduct }: CategoriesSectionProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', order: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localCategories, setLocalCategories] = useState<CategoryWithCount[]>(categories);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, order: category.order || 0 });
    } else {
      setEditingCategory(null);
      const maxOrder = Math.max(...categories.map(c => c.order || 0), -1);
      setFormData({ name: '', order: maxOrder + 1 });
    }
    setErrors({});
    setShowCategoryModal(true);
  };

  const handleCloseModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setFormData({ name: '', order: 0 });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validate(formData, validationSchemas.category);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const { error } = await categoryService.update(editingCategory.id, {
          name: formData.name.trim(),
          order: formData.order,
        });

        if (error) throw error;
        toast.success('Categoria atualizada com sucesso!');
      } else {
        const { error } = await categoryService.create({
          name: formData.name.trim(),
          order: formData.order,
        });

        if (error) throw error;
        toast.success('Categoria criada com sucesso!');
      }

      handleCloseModal();
      onRefresh();
    } catch (error) {
      showError(error, editingCategory ? 'Erro ao atualizar categoria' : 'Erro ao criar categoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setIsDeleting(true);
    try {
      const { error } = await categoryService.delete(deleteConfirm.id);
      if (error) throw error;
      toast.success('Categoria excluída com sucesso!');
      onRefresh();
    } catch (error) {
      showError(error, 'Erro ao excluir categoria');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    try {
      setIsUpdatingOrder(true);

      const oldIndex = localCategories.findIndex(c => c.id === active.id);
      const newIndex = localCategories.findIndex(c => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newCategories = arrayMove(localCategories, oldIndex, newIndex);
      const updatedCategories = newCategories.map((category, index) => ({
        ...category,
        order: index
      }));

      setLocalCategories(updatedCategories);

      const { error } = await categoryService.updateOrder(
        updatedCategories.map(c => ({ id: c.id, order: c.order || 0 }))
      );

      if (error) throw error;

      toast.success('Ordem atualizada com sucesso!');
      onRefresh();
    } catch (error) {
      showError(error, 'Erro ao atualizar ordem das categorias');
      onRefresh();
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const formFields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Nome da Categoria',
      type: 'text',
      placeholder: 'Ex: Entradas',
      required: true,
      gridSpan: 2,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle description="Organize os produtos em categorias">
              Categorias
            </CardTitle>
            <button
              onClick={() => handleOpenModal()}
              className="btn btn-primary"
            >
              <i className="fas fa-plus-circle mr-2"></i>
              Nova Categoria
            </button>
          </div>
        </CardHeader>

        {localCategories.length === 0 ? (
          <EmptyState
            icon="layer-group"
            title="Nenhuma categoria criada"
            description="Crie categorias para organizar os produtos"
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localCategories.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {localCategories.map((category) => (
                  <DraggableCategory
                    key={category.id}
                    category={category}
                    onEdit={() => handleOpenModal(category)}
                    onDelete={() => handleDelete(category.id)}
                    onAddProduct={() => onAddProduct(category.id)}
                    productCount={category.productCount}
                    isUpdatingOrder={isUpdatingOrder}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Card>

      <GenericFormModal
        isOpen={showCategoryModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
        fields={formFields}
        values={formData}
        onChange={(field, value) => setFormData({ ...formData, [field]: value })}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errors={errors}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Excluir categoria"
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
        confirmLabel="Excluir categoria"
        isLoading={isDeleting}
      />
    </>
  );
}
