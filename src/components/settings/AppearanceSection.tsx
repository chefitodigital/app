import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Select } from '../ui/Select';

interface AppearanceSectionProps {
  formData: {
    accent_color: string;
    title_font: string;
    body_font: string;
    button_font: string;
    favicon_url: string | null;
    product_card_description_lines: number;
  };
  onChange: (data: Partial<AppearanceSectionProps['formData']>) => void;
}

const PRESET_COLORS = [
  { hex: '#0ea5e9', name: 'Azul' },
  { hex: '#10b981', name: 'Verde' },
  { hex: '#f59e0b', name: 'Laranja' },
  { hex: '#ef4444', name: 'Vermelho' },
  { hex: '#ec4899', name: 'Rosa' },
  { hex: '#475569', name: 'Cinza' },
];

export function AppearanceSection({ formData, onChange }: AppearanceSectionProps) {
  const [customColor, setCustomColor] = useState(formData.accent_color);

  const handleColorSelect = (color: string) => {
    onChange({ accent_color: color });
    setCustomColor(color);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle description="Personalize as cores e fontes do seu cardápio">
            Aparência
          </CardTitle>
        </CardHeader>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Cor de Destaque
            </label>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => handleColorSelect(color.hex)}
                  className={`aspect-square rounded-lg transition-all relative overflow-hidden ${
                    formData.accent_color === color.hex
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {formData.accent_color === color.hex && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-950/20">
                      <i className="fas fa-check-circle text-gray-50"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    handleColorSelect(e.target.value);
                  }
                }}
                className="flex-1 px-4 h-12 rounded-lg border border-gray-200 bg-gray-50 font-mono"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              <div
                className="w-11 h-11 rounded-lg border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: customColor }}
              />

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fonte dos Títulos
              </label>
              <input
                type="text"
                value={formData.title_font}
                onChange={(e) => onChange({ title_font: e.target.value })}
                className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                placeholder="Inter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fonte do Texto
              </label>
              <input
                type="text"
                value={formData.body_font}
                onChange={(e) => onChange({ body_font: e.target.value })}
                className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                placeholder="Inter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fonte dos Botões
              </label>
              <input
                type="text"
                value={formData.button_font}
                onChange={(e) => onChange({ button_font: e.target.value })}
                className="w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50"
                placeholder="Inter"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="product-card-description-lines">
              Linhas da descrição no card do produto
            </label>
            <Select
              id="product-card-description-lines"
              value={String(formData.product_card_description_lines)}
              onChange={(value) => onChange({ product_card_description_lines: Number(value) })}
              options={Array.from({ length: 8 }, (_, value) => ({
                value: String(value),
                label: value === 0 ? 'Ocultar descrição' : `${value} ${value === 1 ? 'linha' : 'linhas'}`,
              }))}
            />
            <p className="mt-2 text-sm text-gray-500">
              A descrição completa continua disponível ao abrir o produto.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
