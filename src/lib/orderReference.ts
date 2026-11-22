export function pixOrderReference(sequence: number | null | undefined): string | null {
  return typeof sequence === 'number' && Number.isSafeInteger(sequence) && sequence > 0
    ? `PEDIDO ${sequence}`
    : null;
}
