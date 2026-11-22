import { describe, expect, it } from 'vitest';
import { generatePublicOrderSlug, isValidPublicOrderSlug } from './publicSlug';

describe('public order links', () => {
  it('uses a long random token that cannot be confused with the old short codes', () => {
    const token = generatePublicOrderSlug();
    expect(token).toMatch(/^[a-f0-9]{32}$/);
    expect(isValidPublicOrderSlug(token)).toBe(true);
    expect(isValidPublicOrderSlug('a2b3c4')).toBe(false);
  });
});
