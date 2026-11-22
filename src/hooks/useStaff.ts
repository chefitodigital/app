import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';

type Staff = Database['public']['Tables']['staff']['Row'];
type StaffInsert = Database['public']['Tables']['staff']['Insert'];
type StaffUpdate = Database['public']['Tables']['staff']['Update'];
type StaffSchedule = Database['public']['Tables']['staff_schedules']['Row'];
type StaffScheduleInsert = Database['public']['Tables']['staff_schedules']['Insert'];

export interface StaffWithSchedule extends Staff {
  schedules: StaffSchedule[];
  weeklyHours: number;
}

export interface DaySchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const STAFF_ROLES = [
  'Cozinheiro(a)',
  'Auxiliar de Cozinha',
  'Chefe de Cozinha',
  'Garcom/Garconete',
  'Barman/Barwoman',
  'Gerente',
  'Rececionista',
  'Entregador(a)',
  'Limpeza',
  'Outro',
];

function calculateWeeklyHours(schedules: StaffSchedule[]): number {
  let totalMinutes = 0;

  schedules.forEach(schedule => {
    if (schedule.is_day_off) return;

    const [startHour, startMin] = schedule.start_time.split(':').map(Number);
    const [endHour, endMin] = schedule.end_time.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes > startMinutes) {
      totalMinutes += endMinutes - startMinutes;
    }
  });

  return Math.round((totalMinutes / 60) * 10) / 10;
}

interface UseStaffReturn {
  staff: StaffWithSchedule[];
  isLoading: boolean;
  fetchStaff: () => Promise<void>;
  createStaff: (data: StaffInsert) => Promise<Staff | null>;
  updateStaff: (id: string, data: StaffUpdate) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<boolean>;
  getSchedules: (staffId: string) => Promise<StaffSchedule[]>;
  updateSchedules: (staffId: string, schedules: DaySchedule[]) => Promise<boolean>;
  getDayName: (dayOfWeek: number) => string;
}

export function useStaff(): UseStaffReturn {
  const [staff, setStaff] = useState<StaffWithSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getDayName = useCallback((dayOfWeek: number): string => {
    return DAY_NAMES[dayOfWeek] || '';
  }, []);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .order('name', { ascending: true });

      if (staffError) throw staffError;

      const { data: schedulesData, error: schedulesError } = await supabase
        .from('staff_schedules')
        .select('*');

      if (schedulesError) throw schedulesError;

      const schedulesByStaffId = new Map<string, StaffSchedule[]>();
      (schedulesData || []).forEach((schedule) => {
        const existing = schedulesByStaffId.get(schedule.staff_id) || [];
        existing.push(schedule);
        schedulesByStaffId.set(schedule.staff_id, existing);
      });

      const staffWithSchedules: StaffWithSchedule[] = (staffData || []).map((member) => {
        const schedules = schedulesByStaffId.get(member.id) || [];
        return {
          ...member,
          schedules,
          weeklyHours: calculateWeeklyHours(schedules),
        };
      });

      setStaff(staffWithSchedules);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Erro ao carregar funcionários');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const staffChannel = supabase
      .channel('staff-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff',
        },
        () => {
          fetchStaff();
        }
      )
      .subscribe();

    const schedulesChannel = supabase
      .channel('staff-schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_schedules',
        },
        () => {
          fetchStaff();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(schedulesChannel);
    };
  }, [fetchStaff]);

  const createStaff = useCallback(async (data: StaffInsert): Promise<Staff | null> => {
    try {
      const { data: newStaff, error } = await supabase
        .from('staff')
        .insert([data])
        .select()
        .maybeSingle();

      if (error) throw error;

      const newStaffWithSchedule: StaffWithSchedule = {
        ...newStaff as Staff,
        schedules: [],
        weeklyHours: 0,
      };

      setStaff(prev => [...prev, newStaffWithSchedule].sort((a, b) => a.name.localeCompare(b.name)));

      toast.success('Funcionário criado com sucesso!');
      return newStaff as Staff;
    } catch (error) {
      console.error('Error creating staff:', error);
      toast.error('Erro ao criar funcionário');
      return null;
    }
  }, []);

  const updateStaff = useCallback(async (id: string, data: StaffUpdate): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('staff')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      toast.success('Funcionário atualizado com sucesso!');
      await fetchStaff();
      return true;
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Erro ao atualizar funcionário');
      return false;
    }
  }, [fetchStaff]);

  const deleteStaff = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Funcionário excluído com sucesso!');
      await fetchStaff();
      return true;
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Erro ao excluir funcionário');
      return false;
    }
  }, [fetchStaff]);

  const getSchedules = useCallback(async (staffId: string): Promise<StaffSchedule[]> => {
    try {
      const { data, error } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('staff_id', staffId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching schedules:', error);
      return [];
    }
  }, []);

  const updateSchedules = useCallback(async (
    staffId: string,
    schedules: DaySchedule[]
  ): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('staff_schedules')
        .delete()
        .eq('staff_id', staffId);

      if (deleteError) throw deleteError;

      const schedulesToInsert: StaffScheduleInsert[] = schedules.map(schedule => ({
        staff_id: staffId,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_day_off: schedule.is_day_off,
      }));

      const { error: insertError } = await supabase
        .from('staff_schedules')
        .insert(schedulesToInsert);

      if (insertError) throw insertError;

      toast.success('Horários atualizados com sucesso!');
      await fetchStaff();
      return true;
    } catch (error) {
      console.error('Error updating schedules:', error);
      toast.error('Erro ao atualizar horários');
      return false;
    }
  }, [fetchStaff]);

  return {
    staff,
    isLoading,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    getSchedules,
    updateSchedules,
    getDayName,
  };
}
