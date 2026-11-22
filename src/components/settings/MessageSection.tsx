import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';

interface MessageSectionProps {
  formData: {
    order_confirmation_message: string;
  };
  onChange: (data: Partial<MessageSectionProps['formData']>) => void;
}

export function MessageSection({ formData, onChange }: MessageSectionProps) {
  const [charCount, setCharCount] = useState(0);
  const message = formData.order_confirmation_message || '';

  useEffect(() => {
    setCharCount(message.length);
  }, [message]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle description="Personalize a mensagem que os clientes veem após enviar um pedido">
            Mensagem de Confirmação
          </CardTitle>
        </CardHeader>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Mensagem de Confirmação de Pedido
              </label>
              <span className="text-xs text-gray-500">
                {charCount} caracteres
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => onChange({ order_confirmation_message: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 resize-none font-body"
              rows={4}
              placeholder="Pedido recebido! Em breve, confirmaremos os detalhes."
            />
            <p className="mt-2 text-sm text-gray-500">
              Esta mensagem será exibida num modal após o cliente enviar o pedido com sucesso.
            </p>
          </div>

          {message && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pré-visualização
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="inline-flex w-12 h-12 rounded-full bg-accent/10 items-center justify-center mb-3">
                    <i className="fas fa-check text-accent text-lg"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 font-title">
                    Pedido Enviado com Sucesso!
                  </h3>
                </div>
                <div className="text-gray-600 whitespace-pre-line text-left bg-gray-50 rounded-lg p-4 text-sm">
                  {message}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
