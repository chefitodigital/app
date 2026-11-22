import { supabase } from '../lib/supabase';
import { handleAsyncOperation } from '../lib/errorHandler';
import type { Database } from '../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];
type Extra = Database['public']['Tables']['extras']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

type ProductWithRelations = Product & {
  extras?: Array<{ extra: Extra | null }> | null;
  tags?: Array<{ tag: Tag | null }> | null;
};

function mapProductRelations(product: ProductWithRelations) {
  return {
    ...product,
    extras: product.extras?.map((relation) => relation.extra).filter((extra): extra is Extra => extra !== null) || [],
    tags: product.tags?.map((relation) => relation.tag).filter((tag): tag is Tag => tag !== null) || [],
  };
}

export const productService = {
  async getAll() {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            extras:product_extras(
              extra:extras(*)
            ),
            tags:product_tags(
              tag:tags(*)
            )
          `)
          .order('order');

        if (error) throw error;

        return ((data || []) as unknown as ProductWithRelations[]).map(mapProductRelations);
      },
      'Erro ao carregar produtos'
    );
  },

  async getByCategory(categoryId: string) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            extras:product_extras(
              extra:extras(*)
            ),
            tags:product_tags(
              tag:tags(*)
            )
          `)
          .eq('category_id', categoryId)
          .order('order');

        if (error) throw error;

        return ((data || []) as unknown as ProductWithRelations[]).map(mapProductRelations);
      },
      'Erro ao carregar produtos da categoria'
    );
  },

  async getById(id: string) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            extras:product_extras(
              extra:extras(*)
            ),
            tags:product_tags(
              tag:tags(*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        return mapProductRelations(data as unknown as ProductWithRelations);
      },
      'Erro ao carregar produto'
    );
  },

  async create(product: Omit<ProductInsert, 'id' | 'created_at'>) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao criar produto'
    );
  },

  async update(id: string, updates: ProductUpdate) {
    return handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'Erro ao atualizar produto'
    );
  },

  async delete(id: string) {
    return handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      },
      'Erro ao excluir produto'
    );
  },

  async updateOrder(products: Array<{ id: string; order: number }>) {
    return handleAsyncOperation(
      async () => {
        const updates = products.map((prod) =>
          supabase
            .from('products')
            .update({ order: prod.order })
            .eq('id', prod.id)
        );

        await Promise.all(updates);
        return true;
      },
      'Erro ao atualizar ordem dos produtos'
    );
  },

  async updateExtras(productId: string, extraIds: string[]) {
    return handleAsyncOperation(
      async () => {
        await supabase
          .from('product_extras')
          .delete()
          .eq('product_id', productId);

        if (extraIds.length > 0) {
          const { error } = await supabase
            .from('product_extras')
            .insert(
              extraIds.map((extraId) => ({
                product_id: productId,
                extra_id: extraId,
              }))
            );

          if (error) throw error;
        }

        return true;
      },
      'Erro ao atualizar extras do produto'
    );
  },

  async updateTags(productId: string, tagIds: string[]) {
    return handleAsyncOperation(
      async () => {
        await supabase
          .from('product_tags')
          .delete()
          .eq('product_id', productId);

        if (tagIds.length > 0) {
          const { error } = await supabase
            .from('product_tags')
            .insert(
              tagIds.map((tagId) => ({
                product_id: productId,
                tag_id: tagId,
              }))
            );

          if (error) throw error;
        }

        return true;
      },
      'Erro ao atualizar etiquetas do produto'
    );
  }
};
