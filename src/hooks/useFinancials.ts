import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { OrderItem } from '../types/supabase';

export interface FinancialSummary {
  salesToday: number;
  salesWeek: number;
  avgTicketWeek: number;
  championProduct: { name: string; quantity: number } | null;
  topCustomers: { name: string; total: number; orders: number }[];
  ordersToday: number;
  ordersWeek: number;
}

export interface AllTimeSummary {
  totalSales: number;
  totalOrders: number;
  totalItems: number;
  totalCustomers: number;
  avgTicket: number;
  products: { name: string; quantity: number; total: number }[];
  firstOrderAt: string | null;
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const dow = x.getDay(); // 0=Sun
  const diff = (dow + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  return x;
}

function getFinancialDate(order: { delivered_at?: string | null; created_at?: string | null }) {
  return new Date(order.delivered_at || order.created_at || 0).getTime();
}

export function useFinancials(enabled = true) {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [allTime, setAllTime] = useState<AllTimeSummary | null>(null);
  const [allTimeLoading, setAllTimeLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const now = new Date();
      const weekStart = startOfWeek(now);
      const { data, error } = await supabase
        .from('orders')
        .select('total, customer_name, customer_id, items, delivered_at, created_at')
        .or(`delivered_at.gte.${weekStart.toISOString()},created_at.gte.${weekStart.toISOString()}`);
      if (error) throw error;

      const rows = data || [];
      const todayStart = startOfDay(now).getTime();
      const weekStartTime = weekStart.getTime();

      let salesToday = 0, ordersToday = 0;
      let salesWeek = 0, ordersWeek = 0;
      const productMap = new Map<string, number>();
      const customerMap = new Map<string, { name: string; total: number; orders: number }>();

      rows.forEach((o) => {
        const financialDate = getFinancialDate(o);

        if (financialDate < weekStartTime) return;

        const total = Number(o.total) || 0;
        salesWeek += total;
        ordersWeek += 1;
        if (financialDate >= todayStart) { salesToday += total; ordersToday += 1; }

        (o.items as OrderItem[] | null)?.forEach((it) => {
          productMap.set(it.name, (productMap.get(it.name) || 0) + (it.quantity || 0));
        });

        const key = o.customer_id || o.customer_name || 'anon';
        const prev = customerMap.get(key) || { name: o.customer_name || 'Cliente', total: 0, orders: 0 };
        prev.total += total;
        prev.orders += 1;
        customerMap.set(key, prev);
      });

      const champion = [...productMap.entries()].sort((a, b) => b[1] - a[1])[0];
      const topCustomers = [...customerMap.values()]
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setSummary({
        salesToday,
        salesWeek,
        avgTicketWeek: ordersWeek > 0 ? salesWeek / ordersWeek : 0,
        championProduct: champion ? { name: champion[0], quantity: champion[1] } : null,
        topCustomers,
        ordersToday,
        ordersWeek,
      });
    } catch (e) {
      console.error('financials error', e);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const loadAllTime = useCallback(async () => {
    if (!enabled) return;
    setAllTimeLoading(true);
    try {
      const [ordersRes, customersRes] = await Promise.all([
        supabase
          .from('orders')
          .select('total, items, created_at, delivered_at')
          .order('created_at', { ascending: true }),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true }),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      const data = ordersRes.data;
      const totalCustomers = customersRes.count || 0;
      const rows = data || [];
      let totalSales = 0;
      let totalItems = 0;
      const productMap = new Map<string, { quantity: number; total: number }>();
      let firstOrderAt: string | null = null;
      rows.forEach((o) => {
        totalSales += Number(o.total) || 0;
        if (!firstOrderAt) firstOrderAt = o.created_at || o.delivered_at || null;
        (o.items as OrderItem[] | null)?.forEach((it) => {
          totalItems += it.quantity || 0;
          const prev = productMap.get(it.name) || { quantity: 0, total: 0 };
          prev.quantity += it.quantity || 0;
          prev.total += (Number(it.price) || 0) * (it.quantity || 0);
          productMap.set(it.name, prev);
        });
      });
      const products = [...productMap.entries()]
        .map(([name, v]) => ({ name, quantity: v.quantity, total: v.total }))
        .sort((a, b) => b.quantity - a.quantity);
      setAllTime({
        totalSales,
        totalOrders: rows.length,
        totalItems,
        totalCustomers,
        avgTicket: rows.length > 0 ? totalSales / rows.length : 0,
        products,
        firstOrderAt,
      });
    } catch (e) {
      console.error('all-time financials error', e);
    } finally {
      setAllTimeLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSummary(null);
      setLoading(false);
      return;
    }

    load();
    loadAllTime();
  }, [enabled, load, loadAllTime]);

  return { summary, loading, reload: load, allTime, allTimeLoading, reloadAllTime: loadAllTime };
}
