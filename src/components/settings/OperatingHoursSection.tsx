import React from 'react';
import {
  DAY_ORDER, DAY_LABELS, DEFAULT_SCHEDULE,
  type OperatingSchedule, type DayKey,
} from '../../lib/operatingHours';

interface Props {
  schedule: OperatingSchedule | null;
  onChange: (schedule: OperatingSchedule) => void;
}

function clampPart(raw: string, max: number): string {
  const digits = raw.replace(/\D/g, '').slice(-2);
  if (!digits) return '00';
  const n = Math.min(parseInt(digits, 10), max);
  return String(n).padStart(2, '0');
}

function TimeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [hh = '00', mm = '00'] = (value || '00:00').split(':');

  const inputCls =
    'w-full min-w-0 h-9 text-center text-sm text-gray-800 bg-white border border-gray-200 rounded-lg ' +
    'hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ' +
    'transition disabled:opacity-50 disabled:cursor-not-allowed tabular-nums ' +
    '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        aria-label="Horas"
        value={hh}
        disabled={disabled}
        onChange={(e) => onChange(`${e.target.value.replace(/\D/g, '').slice(0, 2) || '0'}:${mm}`)}
        onBlur={(e) => onChange(`${clampPart(e.target.value, 23)}:${mm}`)}
        className={inputCls}
      />
      <span className="text-gray-400 text-sm select-none">:</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        aria-label="Minutos"
        value={mm}
        disabled={disabled}
        onChange={(e) => onChange(`${hh}:${e.target.value.replace(/\D/g, '').slice(0, 2) || '0'}`)}
        onBlur={(e) => onChange(`${hh}:${clampPart(e.target.value, 59)}`)}
        className={inputCls}
      />
    </div>
  );
}

export function OperatingHoursSection({ schedule, onChange }: Props) {
  const current: OperatingSchedule = schedule || DEFAULT_SCHEDULE;

  const updateDay = (day: DayKey, patch: Partial<OperatingSchedule[DayKey]>) => {
    onChange({ ...current, [day]: { ...current[day], ...patch } });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Horário de Funcionamento
      </label>
      <p className="text-sm text-gray-500 mb-3">
        Configure o horário de cada dia. Fora desse período, o cliente verá um aviso no carrinho.
      </p>
      <div className="space-y-2">
        {DAY_ORDER.map((day) => {
          const d = current[day];
          return (
            <div key={day} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
              <label className="flex items-center gap-2 w-40 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={d.open}
                  onChange={(e) => updateDay(day, { open: e.target.checked })}
                  className="w-4 h-4 accent-accent"
                />
                <span className="text-sm font-medium text-gray-700">{DAY_LABELS[day]}</span>
              </label>
              <div className={`flex items-center gap-2 flex-1 ${d.open ? '' : 'opacity-40 pointer-events-none'}`}>
                <TimeInput
                  value={d.from}
                  onChange={(v) => updateDay(day, { from: v })}
                  disabled={!d.open}
                />
                <span className="text-gray-400 text-sm px-1">até</span>
                <TimeInput
                  value={d.to}
                  onChange={(v) => updateDay(day, { to: v })}
                  disabled={!d.open}
                />
                {!d.open && <span className="text-xs text-gray-400 ml-2">Fechado</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
