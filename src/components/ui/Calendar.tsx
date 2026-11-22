import React, { useMemo, useState } from 'react';

interface CalendarProps {
  value: string; // yyyy-mm-dd
  onChange: (v: string) => void;
  min?: Date;
  max?: Date;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // Mon–Sun

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function stripTime(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function Calendar({ value, onChange, min, max }: CalendarProps) {
  const today = useMemo(() => stripTime(new Date()), []);
  const initial = value ? parseLocalDate(value) : today;
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [viewYear, setViewYear] = useState(initial.getFullYear());

  const selected = value ? stripTime(parseLocalDate(value)) : null;
  const minD = min ? stripTime(min) : null;
  const maxD = max ? stripTime(max) : null;

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  // Monday-first offset
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(viewYear, viewMonth - 1, prevMonthDays - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), inMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    if (cells.length >= 42) break;
  }

  const goPrev = () => {
    const m = viewMonth - 1;
    if (m < 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(m);
  };
  const goNext = () => {
    const m = viewMonth + 1;
    if (m > 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(m);
  };

  const isDisabled = (d: Date) => {
    if (minD && d < minD) return true;
    if (maxD && d > maxD) return true;
    return false;
  };

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goPrev}
          className="w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center"
          aria-label="Mês anterior"
        >
          <i className="fas fa-chevron-left text-sm" />
        </button>
        <div className="text-sm font-semibold text-gray-800 capitalize">
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button
          type="button"
          onClick={goNext}
          className="w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center"
          aria-label="Próximo mês"
        >
          <i className="fas fa-chevron-right text-sm" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-xs font-medium text-gray-600 text-center h-6 flex items-center justify-center">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, inMonth }, i) => {
          const disabled = isDisabled(date);
          const isSelected = selected && fmt(date) === fmt(selected);
          const isToday = fmt(date) === fmt(today);
          const base = 'h-9 w-full rounded-lg text-sm font-medium transition flex items-center justify-center';
          let cls = '';
          if (disabled) {
            cls = 'text-gray-300 cursor-not-allowed';
          } else if (isSelected) {
            cls = 'bg-accent text-gray-50';
          } else if (isToday) {
            cls = 'text-accent border border-accent/30 hover:bg-accent/5';
          } else if (inMonth) {
            cls = 'text-gray-700 hover:bg-gray-100';
          } else {
            cls = 'text-gray-300 hover:bg-gray-50';
          }
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(fmt(date))}
              className={`${base} ${cls}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
