import type { Country } from './i18n';

/** Moeda por país. */
export function currencyForCountry(country: Country): 'EUR' | 'BRL' {
  return country === 'BR' ? 'BRL' : 'EUR';
}

export function formatCurrencyByCountry(value: number, country: Country): string {
  const currency = currencyForCountry(country);
  return new Intl.NumberFormat(country === 'BR' ? 'pt-BR' : 'pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function phoneCountryCode(country: Country): string {
  return country === 'BR' ? '+55' : '+351';
}

export function phonePlaceholder(country: Country): string {
  return country === 'BR' ? '(11) 91234-5678' : '912 345 678';
}

export function phoneLabel(country: Country): string {
  return country === 'BR' ? 'Celular' : 'Telemóvel';
}

export function addressLabel(country: Country): string {
  return country === 'BR' ? 'Endereço' : 'Morada';
}

export function postalCodeLabel(country: Country): string {
  return country === 'BR' ? 'CEP' : 'Código Postal';
}