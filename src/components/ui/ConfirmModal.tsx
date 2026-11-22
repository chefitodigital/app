import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  icon?: string;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  isLoading = false,
  onConfirm,
  onClose,
  icon = 'circle-question',
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <i className={`fas fa-${icon} text-lg`} aria-hidden="true" />
        </div>
        <p className="text-sm leading-6 text-gray-600">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isLoading} className="btn btn-secondary justify-center">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={isLoading} className="btn btn-primary justify-center min-w-28 disabled:opacity-60">
            {isLoading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
