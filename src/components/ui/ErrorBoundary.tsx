import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-50 rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-accent"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 font-title">
                Algo correu mal
              </h2>
              <p className="text-gray-600 mb-6 font-body">
                Ocorreu um erro inesperado. Por favor, tente novamente.
              </p>
              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                    Detalhes técnicos
                  </summary>
                  <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-40 text-gray-700">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="primary"
                  className="flex-1"
                >
                  <i className="fas fa-refresh mr-2"></i>
                  Tentar novamente
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="secondary"
                  className="flex-1"
                >
                  <i className="fas fa-home mr-2"></i>
                  Voltar ao início
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <i className="fas fa-exclamation-circle text-2xl text-accent"></i>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Erro ao carregar esta seção
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            {error.message || 'Ocorreu um erro inesperado'}
          </p>
          <Button onClick={resetError} variant="secondary" className="text-sm">
            <i className="fas fa-refresh mr-2"></i>
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  );
}
