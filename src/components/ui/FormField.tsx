import React from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, error, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-accent">{error}</p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  error?: boolean;
}

export function Input({ className, icon, error, ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <i className={`fas fa-${icon}`}></i>
        </div>
      )}
      <input
        className={cn(
          'w-full px-4 h-12 rounded-lg border border-gray-200 bg-gray-50 transition-colors duration-150',
          'placeholder:text-gray-400',
          'hover:border-gray-300',
          'focus:border-gray-500 focus:outline-none',
          icon && 'pl-11',
          error && 'border-accent focus:border-accent',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 transition-colors duration-150',
        'placeholder:text-gray-400',
        'hover:border-gray-300',
        'focus:border-gray-500 focus:outline-none',
        'resize-none',
        error && 'border-accent focus:border-accent',
        className
      )}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ className, error, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full appearance-none px-4 pr-10 h-12 rounded-lg border border-gray-200 bg-gray-50 transition-colors duration-150',
          'hover:border-gray-300',
          'focus:border-gray-500 focus:outline-none',
          'cursor-pointer disabled:cursor-not-allowed',
          error && 'border-accent focus:border-accent',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>
    </div>
  );
}
