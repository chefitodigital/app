import { useState, useCallback } from 'react';
import { productService } from '../services';
import toast from 'react-hot-toast';
import { deleteFromR2 } from '../lib/r2-storage';
import type { Database } from '../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];
type Extra = Database['public']['Tables']['extras']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

export interface ProductWithExtrasAndTags extends Product {
  extras: Extra[];
  tags: Tag[];
}

export function useProducts() {
  const [products, setProducts] = useState<ProductWithExtrasAndTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await productService.getAll();

      if (error) {
        toast.error('Erro ao carregar produtos');
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (categoryId: string) => {
    try {
      const categoryProducts = products.filter(p => p.category_id === categoryId);
      const maxOrder = Math.max(...categoryProducts.map(p => p.order || 0), -1);

      const { data, error } = await productService.create({
        name: '',
        description: '',
        price: 0,
        image_url: '',
        category_id: categoryId,
        slug: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        order: maxOrder + 1,
        active: true,
        has_custom_tag: false,
        custom_tag_text: null,
        is_vegan: false,
        is_vegetarian: false,
        is_gluten_free: false,
        is_spicy: false,
        spicy_level: 1,
        require_extra: false,
        extras_label: null
      });

      if (error || !data) {
        toast.error('Erro ao adicionar produto');
        return null;
      }

      const newProduct: ProductWithExtrasAndTags = {
        ...data,
        extras: [],
        tags: [],
        has_custom_tag: false,
        is_vegan: false,
        is_vegetarian: false,
        is_gluten_free: false,
        is_spicy: false,
        spicy_level: 1,
        require_extra: false,
        extras_label: null
      };

      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Erro ao adicionar produto');
      return null;
    }
  }, [products]);

  const updateProduct = useCallback(async (product: ProductWithExtrasAndTags) => {
    try {
      const previous = products.find((p) => p.id === product.id);
      const oldImageUrl = previous?.image_url || null;

      const { error: productError } = await productService.update(product.id, {
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        image_blur: product.image_blur ?? null,
        category_id: product.category_id,
        active: product.active,
        slug: product.name.toLowerCase().replace(/\s+/g, '-'),
        order: product.order,
        has_custom_tag: product.has_custom_tag,
        custom_tag_text: product.custom_tag_text,
        is_vegan: product.is_vegan,
        is_vegetarian: product.is_vegetarian,
        is_gluten_free: product.is_gluten_free,
        is_spicy: product.is_spicy,
        spicy_level: product.spicy_level,
        require_extra: product.require_extra,
        extras_label: product.extras_label
      });

      if (productError) {
        toast.error('Erro ao atualizar produto');
        return false;
      }

      // Clean up orphan R2 object when the admin replaced or removed the image.
      if (oldImageUrl && oldImageUrl !== product.image_url) {
        deleteFromR2(oldImageUrl);
      }

      const extraIds = product.extras.map(e => e.id);
      const { error: extrasError } = await productService.updateExtras(product.id, extraIds);

      if (extrasError) {
        toast.error('Erro ao atualizar extras');
        return false;
      }

      const tagIds = product.tags.map(t => t.id);
      const { error: tagsError } = await productService.updateTags(product.id, tagIds);

      if (tagsError) {
        toast.error('Erro ao atualizar tags');
        return false;
      }

      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      toast.success('Produto atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
      return false;
    }
  }, [products]);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      const target = products.find((p) => p.id === productId);
      const { error } = await productService.delete(productId);

      if (error) {
        toast.error('Erro ao excluir produto');
        return false;
      }

      if (target?.image_url) {
        deleteFromR2(target.image_url);
      }

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Produto excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
      return false;
    }
  }, [products]);

  const updateProductOrder = useCallback(async (categoryId: string, oldIndex: number, newIndex: number) => {
    try {
      setIsUpdatingOrder(true);

      const categoryProducts = products
        .filter(p => p.category_id === categoryId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const reorderedProducts = [...categoryProducts];
      const [movedProduct] = reorderedProducts.splice(oldIndex, 1);
      reorderedProducts.splice(newIndex, 0, movedProduct);

      const updatedProducts = reorderedProducts.map((product, index) => ({
        ...product,
        order: index
      }));

      setProducts(prevProducts => {
        const productsInOtherCategories = prevProducts.filter(
          p => p.category_id !== categoryId
        );
        return [...productsInOtherCategories, ...updatedProducts].sort((a, b) => {
          if (a.category_id === b.category_id) {
            return (a.order || 0) - (b.order || 0);
          }
          return a.category_id.localeCompare(b.category_id);
        });
      });

      const orderUpdates = updatedProducts.map(p => ({ id: p.id, order: p.order || 0 }));
      const { error } = await productService.updateOrder(orderUpdates);

      if (error) {
        toast.error('Erro ao atualizar ordem');
        await loadProducts();
        return false;
      }

      toast.success('Ordem atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Error updating product order:', error);
      toast.error('Erro ao atualizar ordem dos produtos');
      await loadProducts();
      return false;
    } finally {
      setIsUpdatingOrder(false);
    }
  }, [products, loadProducts]);

  const getProductsByCategory = useCallback((categoryId: string) => {
    return products
      .filter(p => p.category_id === categoryId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [products]);

  return {
    products,
    isLoading,
    isUpdatingOrder,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductOrder,
    getProductsByCategory
  };
}
