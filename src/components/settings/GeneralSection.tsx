import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Toggle } from '../ui/Toggle';
import { OperatingHoursSection } from './OperatingHoursSection';
import type { OperatingSchedule } from '../../lib/operatingHours';
import { PixSection } from './PixSection';
import { RESTAURANT_ICONS } from '../../lib/restaurantIcons';

interface GeneralSectionProps {
  formData: {
    name: string;
    restaurant_icon: string;
    currency: string;
    custom_tag_name: string;
    country?: 'PT' | 'BR';
    mbway_phone: string;
    mbway_reference_prefix: string;
    mbway_enabled: boolean;
    pix_enabled: boolean;
    pix_key_type: string;
    pix_key: string;
    pix_beneficiary_name: string;
    delivery_fee_enabled: boolean;
    delivery_base_price: number;
    delivery_price_per_km: number;
    restaurant_lat: number | null;
    restaurant_lng: number | null;
    operating_schedule: OperatingSchedule | null;
  };
  onChange: (data: Partial<GeneralSectionProps['formData']>) => void;
}

const LEGACY_ICONS: Record<string, string> = {
  fish: 'fish-cooked',
  'beer-mug-empty': 'beer-mug',
  stroopwafel: 'shish-kebab',
  'bowl-food': 'bowl-chopsticks-noodles',
  'bread-slice': 'baguette',
};

export function GeneralSection({ formData, onChange }: GeneralSectionProps) {
  const country = 'BR';

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle description="Informações básicas do seu estabelecimento">
            Informações do Negócio
          </CardTitle>
        </CardHeader>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Negócio
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
              placeholder="Nome do seu negócio"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ícone do Negócio
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {RESTAURANT_ICONS.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => onChange({ restaurant_icon: icon.value })}
                  className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 transition-all ${
                    (LEGACY_ICONS[formData.restaurant_icon] || formData.restaurant_icon) === icon.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                  title={icon.label}
                >
                  <i className={`fas fa-${icon.value === 'burger' ? 'burger-cheese' : icon.value} text-2xl`}></i>
                </button>
              ))}
            </div>
          </div>

          {/* Moeda definida para BRL. */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Etiqueta Personalizada
            </label>
            <input
              type="text"
              value={formData.custom_tag_name}
              onChange={(e) => onChange({ custom_tag_name: e.target.value })}
              className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
              placeholder="Ex: Especial da Casa, Recomendado"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Este texto aparecerá como uma etiqueta nos produtos marcados como personalizados.
            </p>
          </div>

          <OperatingHoursSection
            schedule={formData.operating_schedule}
            onChange={(schedule) => onChange({ operating_schedule: schedule })}
          />
        </div>
      </Card>

      {country !== 'BR' && (
      <Card>
        <CardHeader>
          <CardTitle description="Configure o número e prefixo para pagamentos via MBWay">
            Pagamento MBWay
          </CardTitle>
        </CardHeader>

        <div className="space-y-5">
          <Toggle
            checked={formData.mbway_enabled}
            onChange={(checked) => onChange({ mbway_enabled: checked })}
            icon="mobile-screen-button"
            label="Pagamento MBWay"
            description="Permite que os clientes paguem via MBWay no checkout"
          />

          <div className={formData.mbway_enabled ? '' : 'opacity-50 pointer-events-none'}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número MBWay
                </label>
                <input
                  type="text"
                  value={formData.mbway_phone}
                  onChange={(e) => onChange({ mbway_phone: e.target.value })}
                  className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                  placeholder="Ex: +351 912 345 678"
                  disabled={!formData.mbway_enabled}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Número de celular associado ao seu MBWay. Será mostrado ao cliente no final do pedido.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefixo da Referência
                </label>
                <input
                  type="text"
                  value={formData.mbway_reference_prefix}
                  onChange={(e) => onChange({ mbway_reference_prefix: e.target.value })}
                  className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                  placeholder="Ex: chefito"
                  disabled={!formData.mbway_enabled}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Prefixo usado para identificar o pedido. Ex: com o prefixo <strong>chefito</strong>, a referência será <strong>chefito-00001</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      )}

      {country === 'BR' && (
        <PixSection
          formData={{
            pix_enabled: formData.pix_enabled,
            pix_key_type: formData.pix_key_type,
            pix_key: formData.pix_key,
            pix_beneficiary_name: formData.pix_beneficiary_name,
          }}
          onChange={onChange}
        />
      )}

    </div>
  );
}
