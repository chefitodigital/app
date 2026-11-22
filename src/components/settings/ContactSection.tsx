import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Toggle } from '../ui/Toggle';

interface ContactSectionProps {
  formData: {
    about_us: string;
    location: string;
    social_links: {
      whatsapp: string;
      maps_url: string;
    };
    whatsapp_auto_send: boolean;
  };
  onChange: (data: Partial<ContactSectionProps['formData']>) => void;
}

export function ContactSection({ formData, onChange }: ContactSectionProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle description="Informações de contato e localização">
            Contato e Localização
          </CardTitle>
        </CardHeader>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <i className="fab fa-whatsapp"></i>
              </span>
              <input
                type="text"
                value={formData.social_links?.whatsapp || ''}
                onChange={(e) => onChange({
                  social_links: {
                    ...formData.social_links,
                    whatsapp: e.target.value
                  }
                })}
                className="w-full pl-12 pr-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                placeholder="(11) 99999-9999"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Número para contato direto com clientes. Será disponibilizado como opção no modal de confirmação de pedido.
            </p>
          </div>

          <div className="pt-2">
            <Toggle
              checked={formData.whatsapp_auto_send}
              onChange={(checked) => onChange({ whatsapp_auto_send: checked })}
              icon="paper-plane"
              label="Envio Automático via WhatsApp"
              description="Quando ativo, abre automaticamente o WhatsApp com o pedido pré-preenchido após o cliente finalizar a compra"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sobre o Restaurante
            </label>
            <textarea
              value={formData.about_us}
              onChange={(e) => onChange({ about_us: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 resize-none"
              rows={4}
              placeholder="Conte-nos um pouco sobre o seu restaurante..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localização
            </label>
            <textarea
              value={formData.location}
              onChange={(e) => onChange({ location: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 resize-none"
              rows={2}
              placeholder="Endereço do restaurante..."
            />
            <p className="mt-2 text-sm text-gray-500">Este endereço aparece no rodapé do negócio.</p>
          </div>

          <div>
            <label htmlFor="google-maps-link" className="block text-sm font-medium text-gray-700 mb-2">Link do Google Maps <span className="font-normal text-gray-500">(opcional)</span></label>
            <input id="google-maps-link" type="url" inputMode="url" value={formData.social_links?.maps_url || ''} onChange={e => onChange({ social_links: { ...formData.social_links, maps_url: e.target.value } })} className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50" placeholder="https://maps.app.goo.gl/..." />
            <p className="mt-2 text-sm text-gray-500">Cole o link de compartilhamento do Google Maps para tornar o endereço do rodapé clicável.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
