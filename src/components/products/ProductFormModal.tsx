import React from 'react';
import ImageUpload from '../ImageUpload';
import { Select } from '../ui/Select';
import { ProductIngredients } from './ProductIngredients';
import { useThemeStore } from '../../store/theme';
import type { ProductWithExtrasAndTags } from '../../hooks/useProducts';
import type { Database } from '../../types/supabase';

type Category = Database['public']['Tables']['categories']['Row'];
type Extra = Database['public']['Tables']['extras']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

interface ProductFormModalProps {
  product: ProductWithExtrasAndTags;
  categories: Category[];
  extras: Extra[];
  availableTags: Tag[];
  onUpdate: (product: ProductWithExtrasAndTags) => void;
  onClose: () => void;
}

export function ProductFormModal({
  product,
  categories,
  extras,
  availableTags,
  onUpdate,
  onClose
}: ProductFormModalProps) {
  const { formatCurrency, settings } = useThemeStore();
  const [editingProduct, setEditingProduct] = React.useState(product);

  const handleSave = () => {
    onUpdate(editingProduct);
  };

  return (
    <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <i className="fas fa-pen text-accent"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Editar Produto</h3>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="fas fa-xmark text-lg text-gray-500"></i>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem do Produto
              </label>
              <ImageUpload
                onImageUpload={(url, blur) =>
                  setEditingProduct({
                    ...editingProduct,
                    image_url: url,
                    ...(blur !== undefined ? { image_blur: blur || null } : {}),
                  } as ProductWithExtrasAndTags)
                }
                currentImageUrl={editingProduct.image_url}
                altText={editingProduct.name || 'Produto'}
                filenameBase={editingProduct.name || editingProduct.slug}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                  placeholder="Nome do produto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {settings?.currency === 'EUR' ? '€' : 'R$'}
                  </span>
                  <input
                    type="number"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 resize-none"
                rows={3}
                placeholder="Descreva o produto..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <Select
                  value={editingProduct.category_id}
                  onChange={(value) => setEditingProduct({ ...editingProduct, category_id: value })}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <label className="flex items-center gap-3 px-4 py-2 h-[42px] bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={editingProduct.active}
                    onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                    className="hidden"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${editingProduct.active ? 'bg-accent border-accent' : 'border-gray-300 bg-white'}`}>
                    {editingProduct.active && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                  <span className="text-gray-700">Produto ativo</span>
                </label>
              </div>
            </div>

            {extras.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Extras Disponíveis</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {extras.map((extra) => (
                    <label
                      key={extra.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editingProduct.extras.some(e => e.id === extra.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingProduct({
                                ...editingProduct,
                                extras: [...editingProduct.extras, extra]
                              });
                            } else {
                              setEditingProduct({
                                ...editingProduct,
                                extras: editingProduct.extras.filter(e => e.id !== extra.id)
                              });
                            }
                          }}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${editingProduct.extras.some(e => e.id === extra.id) ? 'bg-accent border-accent' : 'border-gray-300 bg-white'}`}>
                          {editingProduct.extras.some(e => e.id === extra.id) && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                        <span className="text-gray-700">{extra.name}</span>
                      </div>
                      <span className="text-accent font-medium text-sm">
                        +{formatCurrency(Number(extra.price))}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={editingProduct.require_extra}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        require_extra: e.target.checked
                      })}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${editingProduct.require_extra ? 'bg-accent border-accent' : 'border-gray-300 bg-white'}`}>
                      {editingProduct.require_extra && <i className="fas fa-check text-white text-xs"></i>}
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-700 block">Exigir escolha de um extra (variação)</span>
                      <span className="text-xs text-gray-500">O cliente só poderá adicionar ao carrinho após escolher uma das opções acima.</span>
                    </div>
                  </label>

                  {editingProduct.require_extra && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título do grupo (opcional)
                      </label>
                      <input
                        type="text"
                        value={editingProduct.extras_label || ''}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          extras_label: e.target.value || null
                        })}
                        className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                        placeholder="Ex: Marca, Tamanho, Escolha a versão"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {availableTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <label
                      key={tag.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                        editingProduct.tags.some(t => t.id === tag.id)
                          ? 'bg-accent text-gray-50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editingProduct.tags.some(t => t.id === tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingProduct({
                              ...editingProduct,
                              tags: [...editingProduct.tags, tag]
                            });
                          } else {
                            setEditingProduct({
                              ...editingProduct,
                              tags: editingProduct.tags.filter(t => t.id !== tag.id)
                            });
                          }
                        }}
                        className="hidden"
                      />
                      <i className={`fas fa-${tag.icon}`}></i>
                      <span>{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Tag Personalizada</label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-3">
                <input
                  type="checkbox"
                  checked={editingProduct.has_custom_tag}
                  onChange={(e) => {
                    setEditingProduct({
                      ...editingProduct,
                      has_custom_tag: e.target.checked,
                      custom_tag_text: e.target.checked ? editingProduct.custom_tag_text : null
                    });
                  }}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${editingProduct.has_custom_tag ? 'bg-accent border-accent' : 'border-gray-300 bg-white'}`}>
                  {editingProduct.has_custom_tag && <i className="fas fa-check text-white text-xs"></i>}
                </div>
                <i className="fas fa-tag text-accent"></i>
                <span className="text-gray-700">{settings?.custom_tag_name || 'Personalizado'}</span>
              </label>

              {editingProduct.has_custom_tag && (
                <input
                  type="text"
                  value={editingProduct.custom_tag_text || ''}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    custom_tag_text: e.target.value
                  })}
                  className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                  placeholder="Ex: Sem Lactose, Vegano, etc."
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Atributos dietéticos</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'is_vegan', icon: 'leaf', label: 'Vegano' },
                  { key: 'is_vegetarian', icon: 'carrot', label: 'Vegetariano' },
                  { key: 'is_gluten_free', icon: 'wheat-awn', label: 'Sem glúten' },
                  { key: 'is_spicy', icon: 'pepper-hot', label: 'Picante' },
                ] as const).map(({ key, icon, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                      editingProduct[key]
                        ? 'bg-accent text-gray-50'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editingProduct[key]}
                      onChange={(e) => setEditingProduct({ ...editingProduct, [key]: e.target.checked })}
                      className="hidden"
                    />
                    <i className={`fas fa-${icon}`}></i>
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              {editingProduct.is_spicy && (
                <div className="mt-3 p-4 bg-gray-100 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-3">Nível de ardência</p>
                  <div className="flex gap-2">
                    {([
                      { level: 1 as const, label: 'Leve' },
                      { level: 2 as const, label: 'Moderado' },
                      { level: 3 as const, label: 'Intenso' },
                    ]).map(({ level, label }) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, spicy_level: level })}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border-2 transition-all ${
                          editingProduct.spicy_level === level
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-base flex gap-0.5">
                          {Array.from({ length: level }).map((_, i) => (
                            <i key={i} className="fas fa-pepper-hot text-sm"></i>
                          ))}
                        </span>
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ProductIngredients productId={product.id} />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex-shrink-0">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
