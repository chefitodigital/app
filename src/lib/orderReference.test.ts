import { describe, expect, it } from 'vitest';
import { pixOrderReference } from './orderReference';

describe('referência Pix do pedido', () => {
  it('usa o número de pedido fornecido pelo banco', () => {
    expect(pixOrderReference(123)).toBe('PEDIDO 123');
  });
  it('não inventa referência quando o número é inválido ou indisponível', () => {
    expect(pixOrderReference(null)).toBeNull();
    expect(pixOrderReference(undefined)).toBeNull();
    expect(pixOrderReference(0)).toBeNull();
    expect(pixOrderReference(1.5)).toBeNull();
  });
});
