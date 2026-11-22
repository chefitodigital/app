import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { API_RATE_LIMITS } from '../lib/constants';

interface ApiState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

interface UseApiOptions<T> {
  onSuccess?: (data: T | null) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

const requestCounts = new Map<string, number>();
const REQUEST_WINDOW = 60000; // 1 minute

function checkRateLimit(endpoint: string): boolean {
  const count = requestCounts.get(endpoint) || 0;
  
  if (count >= API_RATE_LIMITS.MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requestCounts.set(endpoint, count + 1);
  setTimeout(() => {
    requestCounts.set(endpoint, (requestCounts.get(endpoint) || 1) - 1);
  }, REQUEST_WINDOW);
  
  return true;
}

export function useApi<T>(options: UseApiOptions<T> = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (
    promise: Promise<{ data: T | null; error: unknown }>,
    endpoint: string
  ) => {
    if (!checkRateLimit(endpoint)) {
      const error = new Error('Muitas solicitações. Tente novamente mais tarde.');
      setState({ data: null, error, isLoading: false });
      if (options.showToast) {
        toast.error('Muitas solicitações. Aguarde um momento.');
      }
      if (options.onError) {
        options.onError(error);
      }
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await promise;

      if (error) throw error;

      setState({ data, error: null, isLoading: false });
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro';
      setState({ data: null, error: new Error(errorMessage), isLoading: false });
      
      if (options.showToast) {
        toast.error(errorMessage);
      }
      
      if (options.onError) {
        options.onError(error as Error);
      }
    }
  }, [options]);

  return {
    ...state,
    execute,
  };
}
