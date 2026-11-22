export function generatePublicOrderSlug(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function isValidPublicOrderSlug(slug: string): boolean {
  return /^[a-f0-9]{32}$/.test(slug);
}
