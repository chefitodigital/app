import React from 'react';
import { useThemeStore } from '../../store/theme';

type PaymentMethod = 'cash' | 'mbway' | 'pix';

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  mbwayEnabled: boolean;
}

export default function PaymentMethodSelector({ value, onChange, mbwayEnabled }: PaymentMethodSelectorProps) {
  const { settings } = useThemeStore();
  const country = 'BR';
  const pixEnabled = country === 'BR' && !!(settings?.pix_enabled && settings?.pix_key);
  const localMethod = country === 'BR' ? 'pix' : 'mbway';
  const localEnabled = country === 'BR' ? pixEnabled : mbwayEnabled;

  if (!localEnabled) return null;

  const localLabel = country === 'BR' ? 'Pix' : 'MBWay';
  const localIcon = country === 'BR' ? 'qrcode' : 'mobile-screen-button';

  return (
    <div className="input-group">
      <label className="input-label">Método de Pagamento</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange('cash')}
          className={`flex items-center justify-center gap-2.5 h-12 rounded-lg border-2 font-medium transition-all ${
            value === 'cash'
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <i className="fas fa-money-bill-wave text-sm"></i>
          <span>Dinheiro</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(localMethod)}
          className={`flex items-center justify-center gap-2.5 h-12 rounded-lg border-2 font-medium transition-all ${
            value === localMethod
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <i className={`fas fa-${localIcon} text-sm`}></i>
          <span>{localLabel}</span>
        </button>
      </div>
      {(value === 'mbway' || value === 'pix') && (
        <p className="mt-2 text-sm text-gray-500">
          Na etapa seguinte verá os dados para efetuar o pagamento.
        </p>
      )}
    </div>
  );
}
