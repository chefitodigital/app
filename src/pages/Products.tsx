import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { ProductsSection } from '../components/products/ProductsSection';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { CategoriesSection } from '../components/products/CategoriesSection';
import { ExtrasSection } from '../components/products/ExtrasSection';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency } from '../lib/utils';
import type { DragEndEvent } from '@dnd-kit/core';

type Category = Database['public']['Tables']['categories']['Row'];
type Extra = Database['public']['Tables']['extras']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

interface CategoryWithCount extends Category {
  productCount: number;
}

export default function Products() {
  const navigate = useNavigate();
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const {
    products,
    isUpdatingOrder: isUpdatingProductOrder,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductOrder
  } = useProducts();

  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [editingProduct, setEditingProduct] = useState<ReturnType<typeof useProducts>['products'][0] | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'extras'>('products');

  const loadData = useCallback(async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('order');

      if (categoriesError) throw categoriesError;

      const categoriesWithCount = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('active', true);

          return {
            ...category,
            productCount: count || 0
          };
        })
      );

      setCategories(categoriesWithCount);

      const { data: extrasData, error: extrasError } = await supabase
        .from('extras')
        .select('*')
        .order('name');

      if (extrasError) throw extrasError;
      setExtras(extrasData || []);

      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (tagsError) throw tagsError;
      setAvailableTags(tagsData || []);

      await loadProducts();

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    }
  }, [loadProducts]);

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin()) {
      navigate('/');
      return;
    }

    loadData();
  }, [isAuthenticated, navigate, isSuperAdmin, loadData]);

  const handleAddProduct = async (categoryId: string) => {
    const newProduct = await addProduct(categoryId);
    if (newProduct) {
      setEditingProduct(newProduct);
    }
  };

  const handleUpdateProduct = async (product: typeof editingProduct) => {
    if (!product) return;
    const success = await updateProduct(product);
    if (success) {
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct(productId);
  };

  const handleProductDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const draggedProduct = products.find(p => p.id === active.id);
    const targetProduct = products.find(p => p.id === over.id);

    if (!draggedProduct || !targetProduct) {
      console.error('Products not found:', { active: active.id, over: over.id });
      return;
    }

    const categoryProducts = products
      .filter(p => p.category_id === targetProduct.category_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const oldIndex = categoryProducts.findIndex(p => p.id === active.id);
    const newIndex = categoryProducts.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      console.error('Invalid indices:', { oldIndex, newIndex });
      return;
    }

    await updateProductOrder(targetProduct.category_id, oldIndex, newIndex);
  };

  const currencyFormatter = (value: number) => {
    return formatCurrency(value, 'BRL');
  };

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <PageHeader
        title="Produtos"
        description="Gestão de categorias, produtos e extras do cardápio"
      />

      <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 bg-gray-100 p-1 sm:p-1.5 rounded-lg">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${
            activeTab === 'products'
              ? 'bg-gray-50 text-gray-800 shadow-soft'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <i className="fas fa-utensils text-xs sm:text-sm"></i>
          <span>Produtos</span>
        </button>
        <button
          onClick={() => setActiveTab('extras')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${
            activeTab === 'extras'
              ? 'bg-gray-50 text-gray-800 shadow-soft'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <i className="fas fa-plus-circle text-xs sm:text-sm"></i>
          <span>Extras</span>
          <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">{extras.length}</span>
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-6 animate-fade-in">
          <CategoriesSection
            categories={categories}
            onRefresh={loadData}
            onAddProduct={handleAddProduct}
          />

          <ProductsSection
            categories={categories}
            products={products}
            onAddProduct={handleAddProduct}
            onEditProduct={setEditingProduct}
            onDeleteProduct={handleDeleteProduct}
            onProductDragEnd={handleProductDragEnd}
            isUpdatingOrder={isUpdatingProductOrder}
          />
        </div>
      )}

      {activeTab === 'extras' && (
        <div className="animate-fade-in">
          <ExtrasSection
            extras={extras}
            formatCurrency={currencyFormatter}
            onRefresh={loadData}
          />
        </div>
      )}

      {editingProduct && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          extras={extras}
          availableTags={availableTags}
          onUpdate={handleUpdateProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}
