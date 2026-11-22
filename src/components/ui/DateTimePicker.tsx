import { useEffect, useRef, useState } from 'react';
import { Calendar } from './Calendar';

interface DateTimePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function DateTimePicker({ id, value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(value ? value.slice(11, 16) : '00:00');
  const container = useRef<HTMLDivElement>(null);
  const day = value.slice(0, 10);

  useEffect(() => { setTime(value ? value.slice(11, 16) : '00:00'); }, [value]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); document.getElementById(id)?.focus(); } };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [id, open]);

  const display = day ? day.split('-').reverse().join('/') : 'Selecionar data';
  return <div ref={container} className="relative">
    <div className="flex gap-2">
      <button id={id} type="button" aria-expanded={open} aria-controls={`${id}-calendar`} onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-gray-800 hover:border-gray-400">
        <span className={!day ? 'text-gray-500' : ''}>{display}</span><i className="fas fa-calendar-days text-gray-500" aria-hidden="true" />
      </button>
      {day && <input type="text" inputMode="numeric" aria-label="Horário" title="Informe o horário no formato 00:00" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" required value={time} onChange={event => { const next = event.target.value; setTime(next); if (/^([01]\d|2[0-3]):[0-5]\d$/.test(next)) onChange(`${day}T${next}`); }} placeholder="00:00" maxLength={5} className="w-20 rounded-xl border border-gray-300 bg-white px-2 py-3 text-center text-gray-800" />}
    </div>
    {open && <div id={`${id}-calendar`} className="absolute left-0 z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl bg-white shadow-lg">
      <Calendar value={day} onChange={next => { onChange(`${next}T${/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '00:00'}`); setOpen(false); }} />
      {day && <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="w-full px-4 pb-3 text-left text-sm text-gray-600 hover:text-gray-900">Limpar data</button>}
    </div>}
  </div>;
}
