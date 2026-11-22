import { createElement, useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface PendingReservation {
  id: string;
  customer_name: string;
  starts_at: string;
  party_size: number;
  viewed: boolean;
  status: string;
}

export function useReservationNotifications(enabled: boolean) {
  const [pending, setPending] = useState<PendingReservation[]>([]);

  const fetchPending = useCallback(async () => {
    if (!enabled) return;
    const { data } = await supabase
      .from('reservations')
      .select('id, customer_name, starts_at, party_size, viewed, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPending((data as PendingReservation[]) || []);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchPending();
    const ch = supabase
      .channel('reservations-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (payload) => {
        const r = payload.new as PendingReservation;
        if (r.status === 'pending') {
          setPending((prev) => [r, ...prev]);
          toast.success(`Nova reserva de ${r.customer_name}!`, {
            icon: createElement('i', { className: 'fas fa-calendar-day', style: { color: '#f97316' } }),
            duration: 5000,
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservations' }, (payload) => {
        const r = payload.new as PendingReservation;
        setPending((prev) => (r.status !== 'pending' ? prev.filter((p) => p.id !== r.id) : prev));
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [enabled, fetchPending]);

  return { pending, pendingCount: pending.length, refresh: fetchPending };
}