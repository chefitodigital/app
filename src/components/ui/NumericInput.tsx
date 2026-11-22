import { useEffect, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

interface NumericInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number;
  onValueChange: (value: number) => void;
}

/**
 * Keeps the in-progress value as text so a controlled numeric setting can be
 * cleared and replaced without immediately rendering its fallback value.
 */
export function NumericInput({ value, onValueChange, onBlur, ...props }: NumericInputProps) {
  const [draft, setDraft] = useState(String(value));
  const minimum = Number(props.min);
  const fallbackValue = Number.isFinite(minimum) ? minimum : 0;

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      {...props}
      type="number"
      value={draft}
      onChange={(event) => {
        const nextValue = event.target.value;
        setDraft(nextValue);

        if (nextValue === '') return;
        // Keep decimal and exponent fragments intact until they become a number.
        if (/[-.]$|[eE][+-]?$/.test(nextValue)) return;

        const parsed = Number(nextValue);
        if (Number.isFinite(parsed)) onValueChange(Math.max(fallbackValue, parsed));
      }}
      onBlur={(event) => {
        if (draft === '' || !Number.isFinite(Number(draft))) {
          setDraft(String(fallbackValue));
          onValueChange(fallbackValue);
        }
        onBlur?.(event);
      }}
    />
  );
}
