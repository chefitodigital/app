import React, { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormField } from './FormField';
import { Select } from './Select';

export interface FormFieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'custom';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  customRender?: (value: unknown, onChange: (value: unknown) => void) => ReactNode;
  min?: number;
  max?: number;
  step?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  gridSpan?: 1 | 2;
}

interface GenericFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FormFieldConfig[];
  values: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  errors?: Record<string, string>;
}

export function GenericFormModal({
  isOpen,
  onClose,
  title,
  fields,
  values,
  onChange,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  errors = {},
}: GenericFormModalProps) {
  const renderField = (field: FormFieldConfig) => {
    const value = values[field.name];
    const error = errors[field.name];

    if (field.type === 'custom' && field.customRender) {
      return (
        <div key={field.name} className={field.gridSpan === 2 ? 'col-span-2' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-accent ml-1">*</span>}
          </label>
          {field.customRender(value, (newValue) => onChange(field.name, newValue))}
          {error && <p className="mt-1 text-sm text-accent">{error}</p>}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} className={field.gridSpan === 2 ? 'col-span-2' : ''}>
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              id={field.name}
              checked={value === true}
              onChange={(e) => onChange(field.name, e.target.checked)}
              className="hidden"
            />
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${value ? 'bg-accent border-accent' : 'border-gray-300 bg-white'}`}>
              {value && <i className="fas fa-check text-white text-xs"></i>}
            </div>
            <span className="text-sm text-gray-700">
              {field.label}
              {field.required && <span className="text-accent ml-1">*</span>}
            </span>
          </label>
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <div key={field.name} className={field.gridSpan === 2 ? 'col-span-2' : ''}>
          <FormField label={field.label} required={field.required} error={error}>
            <Select
              value={typeof value === 'string' ? value : ''}
              onChange={(v) => onChange(field.name, v)}
              options={[{ value: '', label: 'Selecione...' }, ...field.options]}
            />
          </FormField>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className={field.gridSpan === 2 ? 'col-span-2' : ''}>
          <FormField label={field.label} required={field.required} error={error}>
            <textarea
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
              rows={field.rows || 3}
              placeholder={field.placeholder}
              required={field.required}
            />
          </FormField>
        </div>
      );
    }

    return (
      <div key={field.name} className={field.gridSpan === 2 ? 'col-span-2' : ''}>
        <FormField label={field.label} required={field.required} error={error}>
          <input
            type={field.type || 'text'}
            value={typeof value === 'number' || typeof value === 'string' ? value : ''}
            onChange={(e) => {
              const newValue = field.type === 'number' ? parseFloat(e.target.value) : e.target.value;
              onChange(field.name, newValue);
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
            inputMode={field.inputMode}
          />
        </FormField>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {fields.map(renderField)}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
