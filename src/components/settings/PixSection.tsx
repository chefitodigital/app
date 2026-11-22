import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Toggle } from '../ui/Toggle';
import { Select } from '../ui/Select';

interface Props {
  formData: {
    pix_enabled: boolean;
    pix_key_type: string;
    pix_key: string;
    pix_beneficiary_name: string;
  };
  onChange: (patch: Partial<Props['formData']>) => void;
}

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Celular' },
  { value: 'random', label: 'Chave aleatória' },
];

export function PixSection({ formData, onChange }: Props) {
  const disabled = !formData.pix_enabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle description="Configure a chave Pix para receber pagamentos.">
          Pagamento Pix
        </CardTitle>
      </CardHeader>

      <div className="space-y-5">
        <Toggle
          checked={formData.pix_enabled}
          onChange={(checked) => onChange({ pix_enabled: checked })}
          icon="qrcode"
          label="Aceitar Pix"
          description="Permite que os clientes paguem via Pix no checkout"
        />

        <div className={disabled ? 'opacity-50 pointer-events-none space-y-5' : 'space-y-5'}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de chave
            </label>
            <Select
              value={formData.pix_key_type}
              onChange={(value) => onChange({ pix_key_type: value })}
              options={PIX_KEY_TYPES}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave Pix
            </label>
            <input
              type="text"
              value={formData.pix_key}
              onChange={(e) => onChange({ pix_key: e.target.value })}
              className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
              placeholder="Digite a sua chave Pix"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do beneficiário
            </label>
            <input
              type="text"
              value={formData.pix_beneficiary_name}
              onChange={(e) => onChange({ pix_beneficiary_name: e.target.value })}
              className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
              placeholder="Nome que aparecerá no comprovante"
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}