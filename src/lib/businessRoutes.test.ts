import { describe, expect, it } from 'vitest';
import { getBusinessSlug, normalizeBusinessSlug } from './businessRoutes';

describe('business routes', () => {
  it('keeps platform routes separate from business slugs', () => {
    expect(getBusinessSlug('/')).toBeNull();
    expect(getBusinessSlug('/entrar')).toBeNull();
    expect(getBusinessSlug('/cadastro')).toBeNull();
    expect(getBusinessSlug('/criar-negocio')).toBeNull();
    expect(getBusinessSlug('/redefinir-senha')).toBeNull();
    expect(getBusinessSlug('/sabor-da-vila/produto/bolo')).toBe('sabor-da-vila');
  });

  it('normalizes a business name and rejects reserved slugs', () => {
    expect(normalizeBusinessSlug('  Café da Vila  ')).toBe('cafe-da-vila');
    expect(normalizeBusinessSlug('Entrar')).toBeNull();
  });
});
