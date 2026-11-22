import { t, type Country } from '../lib/i18n';

/**
 * Hook para traduzir strings PT-PT → PT-BR conforme o país do restaurante.
 *
 * Uso: `const t = useT(); <h1>{t('Encomendas')}</h1>`
 */
export function useT() {
  return (key: string) => t(key, 'BR');
}

/** Devolve directamente o código do país actual. */
export function useCountry(): Country {
  return 'BR';
}
