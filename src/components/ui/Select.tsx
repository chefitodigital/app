import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({ id, value, onChange, options, placeholder = 'Selecionar...', disabled = false, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ above: boolean; maxHeight: number }>({ above: false, maxHeight: 240 });

  useLayoutEffect(() => {
    if (!isOpen) return;
    const updatePlacement = () => {
      const container = containerRef.current;
      const menu = menuRef.current;
      if (!container || !menu) return;
      const rect = container.getBoundingClientRect();
      let top = 0;
      let bottom = window.innerHeight;
      for (let parent = container.parentElement; parent; parent = parent.parentElement) {
        const style = window.getComputedStyle(parent);
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
          const bounds = parent.getBoundingClientRect();
          top = Math.max(top, bounds.top + parent.clientTop);
          bottom = Math.min(bottom, bounds.top + parent.clientTop + parent.clientHeight);
        }
      }
      const below = Math.max(0, bottom - rect.bottom - 4);
      const above = Math.max(0, rect.top - top - 4);
      const desired = Math.min(menu.scrollHeight, 240);
      const openAbove = below < desired && above > below;
      const space = openAbove ? above : below;
      setPlacement(previous => previous.above === openAbove && previous.maxHeight === Math.min(240, space) ? previous : { above: openAbove, maxHeight: Math.min(240, space) });
    };
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => { window.removeEventListener('resize', updatePlacement); window.removeEventListener('scroll', updatePlacement, true); };
  }, [isOpen, options.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'Escape') { setIsOpen(false); return; }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${isOpen ? 'dropdown-open z-20' : ''} ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={id ? `${id}-options` : undefined}
        className={`w-full h-[var(--btn-height-md)] px-4 py-2 pr-10 rounded-lg border border-gray-200 bg-gray-50 text-left transition-colors ${
          disabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'
        } ${!value ? 'text-gray-400' : 'text-gray-800'}`}
      >
        {displayValue}
      </button>

      <i className={`fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>

      {isOpen && !disabled && (
        <div ref={menuRef} id={id ? `${id}-options` : undefined} role="listbox" style={{ maxHeight: placement.maxHeight }} className={`absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-auto ${placement.above ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-2 text-left transition-colors ${
                option.value === value
                  ? 'bg-accent/10 text-accent font-medium hover:bg-accent/15'
                  : 'text-gray-800 hover:bg-accent/10 hover:text-accent'
              } ${option.value === '' ? 'text-gray-400' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
