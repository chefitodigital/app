export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DaySchedule {
  open: boolean;
  from: string; // "HH:MM"
  to: string;   // "HH:MM"
}

export type OperatingSchedule = Record<DayKey, DaySchedule>;

export const DAY_ORDER: DayKey[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export const DEFAULT_SCHEDULE: OperatingSchedule = {
  monday:    { open: true,  from: '11:00', to: '23:00' },
  tuesday:   { open: true,  from: '11:00', to: '23:00' },
  wednesday: { open: true,  from: '11:00', to: '23:00' },
  thursday:  { open: true,  from: '11:00', to: '23:00' },
  friday:    { open: true,  from: '11:00', to: '23:59' },
  saturday:  { open: true,  from: '11:00', to: '23:59' },
  sunday:    { open: false, from: '11:00', to: '23:00' },
};

function dayKeyFromDate(d: Date): DayKey {
  // Date.getDay(): 0 = Sunday .. 6 = Saturday
  const map: Record<number, DayKey> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
    4: 'thursday', 5: 'friday', 6: 'saturday',
  };
  return map[d.getDay()];
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isOpenNow(schedule: OperatingSchedule | null | undefined, now: Date = new Date()): boolean {
  if (!schedule) return true;
  const day = schedule[dayKeyFromDate(now)];
  if (!day || !day.open) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= toMinutes(day.from) && cur <= toMinutes(day.to);
}

export function nextOpening(schedule: OperatingSchedule | null | undefined, now: Date = new Date()): { label: string } | null {
  if (!schedule) return null;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const key = dayKeyFromDate(d);
    const day = schedule[key];
    if (!day || !day.open) continue;
    if (i === 0) {
      const cur = now.getHours() * 60 + now.getMinutes();
      if (cur < toMinutes(day.from)) {
        return { label: `hoje às ${day.from}` };
      }
      continue;
    }
    if (i === 1) return { label: `amanhã às ${day.from}` };
    return { label: `${DAY_LABELS[key]} às ${day.from}` };
  }
  return null;
}