export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: unknown) => boolean;
  message: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validate = (
  data: Record<string, unknown>,
  schema: ValidationSchema
): { isValid: boolean; errors: ValidationErrors } => {
  const errors: ValidationErrors = {};

  Object.keys(schema).forEach((field) => {
    const value = data[field];
    const rules = schema[field];

    for (const rule of rules) {
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors[field] = rule.message;
        break;
      }

      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors[field] = rule.message;
        break;
      }

      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors[field] = rule.message;
        break;
      }

      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors[field] = rule.message;
        break;
      }

      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors[field] = rule.message;
        break;
      }

      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        errors[field] = rule.message;
        break;
      }

      if (rule.custom && !rule.custom(value)) {
        errors[field] = rule.message;
        break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validationSchemas = {
  customer: {
    name: [
      { required: true, message: 'O nome é obrigatório' },
      { minLength: 2, message: 'O nome deve ter pelo menos 2 caracteres' },
    ],
    phone: [
      { required: true, message: 'O celular é obrigatório' },
      { minLength: 9, message: 'Número de celular inválido' },
    ],
    email: [
      { required: true, message: 'O email é obrigatório' },
      {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Email inválido',
      },
    ],
  },
  staff: {
    name: [
      { required: true, message: 'O nome é obrigatório' },
      { minLength: 2, message: 'O nome deve ter pelo menos 2 caracteres' },
    ],
    role: [
      { required: true, message: 'O cargo é obrigatório' },
    ],
    phone: [
      { required: true, message: 'O celular é obrigatório' },
    ],
  },
  product: {
    name: [
      { required: true, message: 'O nome do produto é obrigatório' },
    ],
    price: [
      { required: true, message: 'O preço é obrigatório' },
      { min: 0, message: 'O preço não pode ser negativo' },
    ],
  },
  category: {
    name: [
      { required: true, message: 'O nome da categoria é obrigatório' },
      { minLength: 2, message: 'O nome deve ter pelo menos 2 caracteres' },
    ],
  },
  coupon: {
    code: [
      { required: true, message: 'O código do cupom é obrigatório' },
      { minLength: 3, message: 'O código deve ter pelo menos 3 caracteres' },
    ],
    discount_value: [
      { min: 0, message: 'O valor do desconto não pode ser negativo' },
    ],
  },
  settings: {
    name: [
      { required: true, message: 'O nome do restaurante é obrigatório' },
    ],
    custom_tag_name: [
      { required: true, message: 'O nome da etiqueta personalizada é obrigatório' },
    ],
  },
};

export const validateCustomButton = (text: string, url: string): { isValid: boolean; error?: string } => {
  if (text && text.length > 30) {
    return { isValid: false, error: 'O texto do botão deve ter no máximo 30 caracteres' };
  }

  if (url && !url.match(/^https?:\/\/.+/)) {
    return { isValid: false, error: 'A URL deve começar com http:// ou https://' };
  }

  return { isValid: true };
};

export const isValidAddress = (address: string): boolean => {
  const trimmed = address.trim();
  if (!trimmed) return false;
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return false;
  if (/^\d{1,2}h\d{0,2}$/i.test(trimmed)) return false;
  if (trimmed.length < 5) return false;
  return true;
};
