import { useState } from 'react';
import type { Database } from '../../types/supabase';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmModal } from '../ui/ConfirmModal';
import { GenericFormModal, FormFieldConfig } from '../ui/GenericFormModal';
import { validate, validationSchemas } from '../../lib/validation';
import { showError } from '../../lib/errorHandler';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

type Extra = Database['public']['Tables']['extras']['Row'];

interface ExtrasSectionProps {
  extras: Extra[];
  formatCurrency: (value: number) => string;
  onRefresh: () => void;
}

export function ExtrasSection({ extras, formatCurrency, onRefresh }: ExtrasSectionProps) {
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenModal = (extra?: Extra) => {
    if (extra) {
      setEditingExtra(extra);
      setFormData({ name: extra.name, price: Number(extra.price).toFixed(2).replace('.', ',') });
    } else {
      setEditingExtra(null);
      setFormData({ name: '', price: '' });
    }
    setErrors({});
    setShowExtraModal(true);
  };

  const handleCloseModal = () => {
    setShowExtraModal(false);
    setEditingExtra(null);
    setFormData({ name: '', price: '' });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const schema = { name: validationSchemas.product.name };

    const validation = validate(formData, schema);
    const priceText = formData.price.trim();
    const validPrice = /^\d+(?:[,.]\d{1,2})?$/.test(priceText);
    if (!validation.isValid || !validPrice) {
      setErrors({ ...validation.errors, ...(!validPrice ? { price: 'Informe um preço válido, como 1,20' } : {}) });
      return;
    }
    const price = Number(priceText.replace(',', '.'));

    setIsSubmitting(true);
    try {
      if (editingExtra) {
        const { error } = await supabase
          .from('extras')
          .update({ name: formData.name, price })
          .eq('id', editingExtra.id);

        if (error) throw error;
        toast.success('Extra atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('extras')
          .insert([{ name: formData.name, price }]);

        if (error) throw error;
        toast.success('Extra criado com sucesso!');
      }

      handleCloseModal();
      onRefresh();
    } catch (error) {
      showError(error, editingExtra ? 'Erro ao atualizar extra' : 'Erro ao criar extra');
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
      const { error } = await supabase.from('extras').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      toast.success('Extra excluído com sucesso!');
      onRefresh();
    } catch (error) {
      showError(error, 'Erro ao excluir extra');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const formFields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Nome do Extra',
      type: 'text',
      placeholder: 'Ex: Queijo extra',
      required: true,
      gridSpan: 2,
    },
    {
      name: 'price',
      label: 'Preço',
      type: 'text',
      inputMode: 'decimal',
      placeholder: '0,00',
      required: true,
      gridSpan: 2,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle description="Ingredientes adicionais para os produtos">
              Extras
            </CardTitle>
            <button
              onClick={() => handleOpenModal()}
              className="btn btn-primary"
            >
              <i className="fas fa-plus-circle mr-2"></i>
              Novo Extra
            </button>
          </div>
        </CardHeader>

        {extras.length === 0 ? (
          <EmptyState
            icon="puzzle-piece"
            title="Nenhum extra criado"
            description="Crie extras para adicionar aos produtos"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {extras.map((extra) => (
              <div
                key={extra.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-accent/30 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-800">{extra.name}</p>
                  <p className="text-sm text-accent font-medium">
                    {formatCurrency(extra.price)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(extra)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Editar"
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(extra.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-accent transition-colors"
                    title="Excluir"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <GenericFormModal
        isOpen={showExtraModal}
        onClose={handleCloseModal}
        title={editingExtra ? 'Editar Extra' : 'Novo Extra'}
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
        title="Excluir extra"
        description="Tem certeza que deseja excluir este extra? Esta ação não pode ser desfeita."
        confirmLabel="Excluir extra"
        isLoading={isDeleting}
      />
    </>
  );
}
