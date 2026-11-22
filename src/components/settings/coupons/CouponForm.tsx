import { useState } from 'react';
import toast from 'react-hot-toast';

type DiscountType = 'percentage' | 'fixed' | 'free_product';

interface CouponFormData {
  code: string;
  discount_type: DiscountType;
  discount_value: string;
  free_product_description: string;
  ambassador_name: string;
  usage_limit: string;
  minimum_order_value: string;
}

interface CouponFormProps {
  currency: string;
  onSubmit: (data: {
    code: string;
    discount_type: DiscountType;
    discount_value: number;
    free_product_description: string | null;
    ambassador_name: string | null;
    usage_limit: number | null;
    minimum_order_value: number | null;
  }) => Promise<boolean>;
}

const initialFormState: CouponFormData = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  free_product_description: '',
  ambassador_name: '',
  usage_limit: '',
  minimum_order_value: '',
};

export function CouponForm({ currency, onSubmit }: CouponFormProps) {
  const [formData, setFormData] = useState<CouponFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast.error('O código do cupom é obrigatório');
      return false;
    }

    if (formData.discount_type === 'free_product') {
      if (!formData.free_product_description.trim()) {
        toast.error('Descreva o produto oferecido');
        return false;
      }
    } else {
      if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
        toast.error('O valor do desconto deve ser maior que zero');
        return false;
      }
      if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
        toast.error('O desconto em percentagem não pode ser maior que 100%');
        return false;
      }
    }

    if (formData.minimum_order_value && parseFloat(formData.minimum_order_value) <= 0) {
      toast.error('O valor mínimo da compra deve ser maior que zero');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    const success = await onSubmit({
      code: formData.code,
      discount_type: formData.discount_type,
      discount_value: formData.discount_type === 'free_product' ? 0 : parseFloat(formData.discount_value),
      free_product_description: formData.discount_type === 'free_product' ? formData.free_product_description.trim() : null,
      ambassador_name: formData.ambassador_name.trim() || null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      minimum_order_value: formData.minimum_order_value ? parseFloat(formData.minimum_order_value) : null,
    });

    if (success) {
      setFormData(initialFormState);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de Desconto
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              formData.discount_type === 'percentage'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <i className="fas fa-percent text-xl"></i>
            <span className="text-sm font-medium">Percentagem</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              formData.discount_type === 'fixed'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <i className="fas fa-coin text-xl"></i>
            <span className="text-sm font-medium">Valor Fixo</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, discount_type: 'free_product', discount_value: '' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              formData.discount_type === 'free_product'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <i className="fas fa-gift text-xl"></i>
            <span className="text-sm font-medium">Produto Grátis</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-gray-50 uppercase"
            placeholder="DESCONTO10"
          />
        </div>
        {formData.discount_type === 'free_product' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produto Oferecido
            </label>
            <input
              type="text"
              value={formData.free_product_description}
              onChange={(e) => setFormData({ ...formData, free_product_description: e.target.value })}
              className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-gray-50"
              placeholder="Ex: Sobremesa à escolha, Bebida grátis..."
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className="w-full h-12 px-4 pr-10 rounded-lg border border-gray-200 bg-gray-50"
                placeholder="10"
                min="0"
                step="0.01"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {formData.discount_type === 'percentage' ? '%' : currency === 'EUR' ? '€' : 'R$'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Embaixador (opcional)
          </label>
          <input
            type="text"
            value={formData.ambassador_name}
            onChange={(e) => setFormData({ ...formData, ambassador_name: e.target.value })}
            className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-gray-50"
            placeholder="Nome do embaixador"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Limite de Uso (opcional)
          </label>
          <input
            type="number"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
            className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-gray-50"
            placeholder="Sem limite"
            min="0"
          />
        </div>
      </div>

      {(formData.discount_type === 'fixed' || formData.discount_type === 'free_product') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Mínimo de Compra (opcional)
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.minimum_order_value}
              onChange={(e) => setFormData({ ...formData, minimum_order_value: e.target.value })}
              className="w-full h-12 px-4 pr-10 rounded-lg border border-gray-200 bg-gray-50"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {currency === 'EUR' ? '€' : 'R$'}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            O cliente precisa atingir este valor mínimo para usar o cupom
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full h-12 btn btn-primary"
      >
        {isSubmitting ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          <>
            <i className="fas fa-plus-circle mr-2"></i>
            Criar Cupom
          </>
        )}
      </button>
    </div>
  );
}
