import { supabase } from '../lib/supabase';
import { handleAsyncOperation } from '../lib/errorHandler';
import type { Database } from '../types/supabase';

type ExtraInsert = Database['public']['Tables']['extras']['Insert'];
type ExtraUpdate = Database['public']['Tables']['extras']['Update'];

export const extraService = {
  async getAll() {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('extras')
          .select('*')
          .order('name');

        if (error) throw error;
        return data || [];
      },
      'Erro ao carregar extras'
    );
  },

  async getById(id: string) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('extras')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao carregar extra'
    );
  },

  async create(extra: Omit<ExtraInsert, 'id' | 'created_at'>) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('extras')
          .insert([extra])
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao criar extra'
    );
  },

  async update(id: string, updates: ExtraUpdate) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('extras')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao atualizar extra'
    );
  },

  async delete(id: string) {
    return handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('extras')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      },
      'Erro ao excluir extra'
    );
  }
};
