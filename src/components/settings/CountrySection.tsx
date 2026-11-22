import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { COUNTRIES, countryPreset, type Country } from '../../lib/i18n';

interface Props {
  country: Country;
  onChange: (patch: Record<string, unknown>) => void;
}

/**
 * Seleção de país. Ao trocar aplica o preset (moeda, pagamento local).
 * Sem bandeiras — só label textual.
 */
export function CountrySection({ country, onChange }: Props) {
  const handlePick = (code: Country) => {
    onChange({ country: code, ...countryPreset(code) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle description="Define moeda, formato de telefone, terminologia e método de pagamento local (MB WAY em Portugal, Pix no Brasil).">
          País
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-2 gap-3">
        {COUNTRIES.map((c) => {
          const active = country === c.code;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => handlePick(c.code)}
              className={`flex flex-col items-center justify-center gap-1 p-4 rounded-lg border-2 transition-all ${
                active
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-base font-semibold">{c.label}</span>
              <span className="text-xs opacity-70">{c.currency === 'BRL' ? 'Real (R$)' : 'Euro (€)'}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Ao trocar de país, a moeda e o método de pagamento local são ajustados automaticamente. Salve as configurações para aplicar.
      </p>
    </Card>
  );
}
