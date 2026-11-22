import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useThemeStore } from '../../store/theme';
import { pixOrderReference } from '../../lib/orderReference';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  paymentMethod?: 'cash' | 'mbway' | 'pix';
  mbwayPhone?: string | null;
  mbwayReferencePrefix?: string | null;
  orderSequence?: number | null;
  publicUrl?: string;
  total?: number;
  formatCurrency?: (value: number) => string;
}

function formatReference(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(5, '0')}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      title="Copiar"
    >
      <i className={`fas ${copied ? 'fa-check text-green-600' : 'fa-copy'} text-sm`}></i>
    </button>
  );
}

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  message,
  paymentMethod,
  mbwayPhone,
  mbwayReferencePrefix,
  orderSequence,
  publicUrl,
  total,
  formatCurrency,
}: OrderConfirmationModalProps) {
  const { settings } = useThemeStore();
  const pixKey = settings?.pix_key;
  const pixBeneficiary = settings?.pix_beneficiary_name;
  const pixKeyType = settings?.pix_key_type;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMbway = paymentMethod === 'mbway' && mbwayPhone && mbwayReferencePrefix && orderSequence;
  const reference = isMbway ? formatReference(mbwayReferencePrefix, orderSequence) : null;
  const isPix = paymentMethod === 'pix' && pixKey;
  const pixReference = pixOrderReference(orderSequence);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center animate-bounce">
            <i className="fas fa-check text-accent text-2xl"></i>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 font-title mb-4">
          Pedido Enviado com Sucesso!
        </h2>

        {isPix ? (
          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-500 mb-4">
              Para finalizar o pedido, efetue o pagamento via Pix:
            </p>

            {pixBeneficiary && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Beneficiário
                </p>
                <span className="text-base font-semibold text-gray-800">{pixBeneficiary}</span>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Chave Pix {pixKeyType ? `(${pixKeyType.toUpperCase()})` : ''}
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-bold text-gray-800 break-all">{pixKey}</span>
                <CopyButton text={pixKey} />
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/30 rounded-lg p-4 text-left">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Valor a Pagar
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl font-bold text-accent">
                  {formatCurrency && total !== undefined ? formatCurrency(total) : ''}
                </span>
                <CopyButton text={total !== undefined ? String(total.toFixed(2)) : ''} />
              </div>
            </div>

            {pixReference ? <div className="rounded-lg bg-gray-100 p-4 text-left">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-600">Referência do pedido</p>
              <div className="flex items-center justify-between gap-3"><span className="text-base font-semibold text-gray-800">{pixReference}</span><CopyButton text={pixReference} /></div>
              <p className="mt-2 text-sm text-gray-600">Se o aplicativo do seu banco permitir, informe essa referência no campo de mensagem ou descrição do Pix.</p>
            </div> : <p className="text-sm text-gray-600">Não foi possível carregar a referência agora. {publicUrl ? <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">Consulte o número no acompanhamento do pedido</a> : 'Consulte o número com o restaurante.'} e, se o aplicativo do banco permitir, informe-o na descrição do Pix.</p>}

            <p className="text-xs text-gray-400 pt-1">
              O restaurante confirmará o pagamento após conferir o recebimento.
            </p>
          </div>
        ) : isMbway ? (
          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-500 mb-4">
              Para finalizar o pedido, efetue o pagamento via MBWay:
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Número MBWay
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold text-gray-800">{mbwayPhone}</span>
                <CopyButton text={mbwayPhone} />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Referência do Pedido
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold text-gray-800 font-mono">{reference}</span>
                <CopyButton text={reference!} />
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/30 rounded-lg p-4 text-left">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Valor a Pagar
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl font-bold text-accent">
                  {formatCurrency && total !== undefined ? formatCurrency(total) : ''}
                </span>
                <CopyButton text={total !== undefined ? String(total.toFixed(2)) : ''} />
              </div>
            </div>

            <p className="text-xs text-gray-400 pt-1">
              Coloque a referência na descrição do pagamento para facilitar a identificação.
            </p>
          </div>
        ) : (
          <div className="text-gray-600 whitespace-pre-line text-left bg-gray-50 rounded-lg p-4 mb-6">
            {message}
          </div>
        )}

        <Button
          onClick={onClose}
          className="w-full bg-accent text-gray-50 hover:bg-accent/90"
        >
          Fechar
        </Button>
      </div>
    </Modal>
  );
}
