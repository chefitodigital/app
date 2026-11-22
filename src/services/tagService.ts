import { supabase } from '../lib/supabase';
import { handleAsyncOperation } from '../lib/errorHandler';
import type { Database } from '../types/supabase';

type TagInsert = Database['public']['Tables']['tags']['Insert'];
type TagUpdate = Database['public']['Tables']['tags']['Update'];

export const tagService = {
  async getAll() {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name');

        if (error) throw error;
        return data || [];
      },
      'Erro ao carregar etiquetas'
    );
  },

  async getById(id: string) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao carregar etiqueta'
    );
  },

  async create(tag: Omit<TagInsert, 'id' | 'created_at'>) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('tags')
          .insert([tag])
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao criar etiqueta'
    );
  },

  async update(id: string, updates: TagUpdate) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('tags')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao atualizar etiqueta'
    );
  },

  async delete(id: string) {
    return handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('tags')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      },
      'Erro ao excluir etiqueta'
    );
  }
};
