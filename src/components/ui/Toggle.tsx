import React from 'react';
import { cn } from '../../lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, description, icon, disabled, className }: ToggleProps) {
  return (
    <label
      className={cn(
        'flex items-start justify-between gap-4 p-5 rounded-lg border border-gray-200 bg-gray-50 transition-all duration-200 cursor-pointer',
        !disabled && 'hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className={`fas fa-${icon} text-accent text-base`}></i>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {label && (
            <span className="block font-semibold text-gray-800 font-title leading-tight mb-1.5">
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-12 h-7 rounded-full transition-all duration-200 ease-in-out flex-shrink-0 mt-1',
          checked ? 'bg-accent shadow-sm' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-6 h-6 bg-gray-50 rounded-full shadow-md transition-transform duration-200 ease-in-out',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </label>
  );
}

interface ToggleGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ToggleGroup({ children, className }: ToggleGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
}
