// Authentication constants
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
  GENERIC_ERROR: 'Ocorreu um erro. Tente novamente.',
};

// Image handling constants
export const IMAGE_CONSTANTS = {
  MAX_FILE_SIZE: 3 * 1024 * 1024, // 3MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  STORAGE_BUCKET: 'product-images',
};

// Currency formatting options
export const CURRENCY_OPTIONS = {
  BRL: {
    locale: 'pt-BR',
    currency: 'BRL',
  },
  EUR: {
    locale: 'pt-PT',
    currency: 'EUR',
  },
} as const;

// API rate limiting
export const API_RATE_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 60,
  THROTTLE_TIME_MS: 1000,
};

// Validation constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  PRICE_MIN: 0,
  PRICE_MAX: 99999.99,
};
