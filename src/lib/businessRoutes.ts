const PLATFORM_PATHS = new Set([
  'entrar',
  'cadastro',
  'criar-negocio',
  'conta',
  'pedido',
  'produto',
  'api',
  'admin',
  'redefinir-senha',
]);

export function normalizeBusinessSlug(value: string): string | null {
  const slug = value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug || slug.length > 60 || PLATFORM_PATHS.has(slug)) return null;
  return slug;
}

export function getBusinessSlug(pathname: string): string | null {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  if (!firstSegment) return null;
  return normalizeBusinessSlug(firstSegment) === firstSegment ? firstSegment : null;
}
