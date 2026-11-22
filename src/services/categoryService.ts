import { supabase } from '../lib/supabase';
import { handleAsyncOperation } from '../lib/errorHandler';
import type { Database } from '../types/supabase';

type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export const categoryService = {
  async getAll() {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('order');

        if (error) throw error;
        return data || [];
      },
      'Erro ao carregar categorias'
    );
  },

  async getById(id: string) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao carregar categoria'
    );
  },

  async create(category: Omit<CategoryInsert, 'id' | 'created_at'>) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .insert([category])
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao criar categoria'
    );
  },

  async update(id: string, updates: CategoryUpdate) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao atualizar categoria'
    );
  },

  async delete(id: string) {
    return handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      },
      'Erro ao excluir categoria'
    );
  },

  async updateOrder(categories: Array<{ id: string; order: number }>) {
    return handleAsyncOperation(
      async () => {
        const updates = categories.map((cat) =>
          supabase
            .from('categories')
            .update({ order: cat.order })
            .eq('id', cat.id)
        );

        await Promise.all(updates);
        return true;
      },
      'Erro ao atualizar ordem das categorias'
    );
  },

  async getProductCount(categoryId: string) {
    return handleAsyncOperation(
      async () => {
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', categoryId)
          .eq('active', true);

        if (error) throw error;
        return count || 0;
      },
      'Erro ao contar produtos da categoria'
    );
  }
};
