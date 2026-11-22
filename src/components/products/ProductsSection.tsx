import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { DraggableProduct } from '../DraggableProduct';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ProductWithExtrasAndTags } from '../../hooks/useProducts';
import type { Database } from '../../types/supabase';

type Category = Database['public']['Tables']['categories']['Row'];

interface ProductsSectionProps {
  categories: Category[];
  products: ProductWithExtrasAndTags[];
  onAddProduct: (categoryId: string) => void;
  onEditProduct: (product: ProductWithExtrasAndTags) => void;
  onDeleteProduct: (productId: string) => void;
  onProductDragEnd: (event: DragEndEvent) => void;
  isUpdatingOrder: boolean;
}

export function ProductsSection({
  categories,
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onProductDragEnd,
  isUpdatingOrder
}: ProductsSectionProps) {
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

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryProducts = products
          .filter(product => product.category_id === category.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        return (
          <Card key={category.id} aria-busy={isUpdatingOrder}>
            <CardHeader
              action={
                <button
                  onClick={() => onAddProduct(category.id)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <i className="fas fa-plus-circle"></i>
                  <span>Adicionar</span>
                </button>
              }
            >
              <CardTitle description={`${categoryProducts.length} produto${categoryProducts.length !== 1 ? 's' : ''}`}>
                {category.name}
              </CardTitle>
            </CardHeader>

            {categoryProducts.length === 0 ? (
              <EmptyState
                icon="box-open"
                title="Nenhum produto"
                description="Adicione produtos a esta categoria"
              />
            ) : (
              <div className="space-y-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onProductDragEnd}
                >
                  <SortableContext
                    items={categoryProducts.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categoryProducts.map((product) => (
                      <DraggableProduct
                        key={product.id}
                        product={product}
                        onEdit={onEditProduct}
                        onDelete={onDeleteProduct}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
