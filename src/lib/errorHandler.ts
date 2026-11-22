import toast from 'react-hot-toast';
import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  message: string;
  code?: string;
  details?: string;
}

export const handleError = (error: unknown, fallbackMessage = 'Ocorreu um erro'): AppError => {
  console.error('Error:', error);

  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      details: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const pgError = error as PostgrestError;
    if (pgError.message) {
      return {
        message: translatePostgresError(pgError),
        code: pgError.code,
        details: pgError.details,
      };
    }
  }

  return {
    message: fallbackMessage,
  };
};

export const showError = (error: unknown, fallbackMessage = 'Ocorreu um erro'): void => {
  const appError = handleError(error, fallbackMessage);
  toast.error(appError.message);
};

export const translatePostgresError = (error: PostgrestError): string => {
  const errorMessages: Record<string, string> = {
    '23505': 'Este registro já existe',
    '23503': 'Não é possível excluir porque existem registros relacionados',
    '23502': 'Campo obrigatório não preenchido',
    '22P02': 'Formato de dados inválido',
    '42501': 'Sem permissão para realizar esta operação',
  };

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  if (error.message.includes('duplicate key')) {
    return 'Este registro já existe';
  }

  if (error.message.includes('foreign key')) {
    return 'Não é possível excluir porque existem registros relacionados';
  }

  if (error.message.includes('not null')) {
    return 'Campo obrigatório não preenchido';
  }

  return error.message || 'Erro na base de dados';
};

export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const appError = handleError(error, errorMessage);
    return { data: null, error: appError };
  }
};

export const withErrorHandling = <T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  errorMessage?: string
) => {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | null> => {
    try {
      return await fn(...args) as Awaited<ReturnType<T>>;
    } catch (error) {
      showError(error, errorMessage);
      return null;
    }
  };
};
