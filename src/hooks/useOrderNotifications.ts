import { createElement, useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  customer_name: string;
  order_type: 'delivery' | 'table' | 'takeaway';
  status: string;
  viewed: boolean;
  created_at: string;
}

export interface OrderNotificationsResult {
  unviewedCount: number;
  unviewedOrders: Order[];
  markAsViewed: (orderId: string) => Promise<void>;
  markAllAsViewed: () => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  testSound: () => void;
}

export function useOrderNotifications(
  isAdmin: boolean,
): OrderNotificationsResult {
  const [unviewedOrders, setUnviewedOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    const stored = localStorage.getItem('notification_sound_enabled');
    return stored !== 'false';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [originalTitle] = useState(document.title);

  const location = useLocation();
  const isOnOrdersPage = location.pathname === '/pedidos';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const titleIntervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/alert.mp3');
      audioRef.current.volume = 0.7;
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    const permissionRequested = localStorage.getItem('notification_permission_requested');

    if (!permissionRequested && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      localStorage.setItem('notification_permission_requested', 'true');
      setNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }

    setNotificationsEnabled(Notification.permission === 'granted');
    return Notification.permission === 'granted';
  }, []);

  useEffect(() => {
    if (isAdmin) {
      requestNotificationPermission();
    }
  }, [isAdmin, requestNotificationPermission]);

  const showBrowserNotification = useCallback((order: Order) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    const notificationTitle = 'Novo Pedido!';
    const orderTypeLabels = {
      delivery: 'Entrega',
      table: 'Mesa',
      takeaway: 'Retirada'
    };
    const notificationBody = `${order.customer_name} - ${orderTypeLabels[order.order_type] || 'Pedido'}`;

    const notification = new Notification(notificationTitle, {
      body: notificationBody,
      icon: '/app.png',
      badge: '/app.png',
      tag: order.id,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `/${window.location.pathname.split('/').filter(Boolean)[0]}/pedidos`;
      notification.close();
    };
  }, [notificationsEnabled]);

  const playAudioLoop = useCallback(() => {
    if (!soundEnabled || !audioRef.current || isPlayingRef.current) {
      return;
    }

    isPlayingRef.current = true;

    const playSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.error('Erro ao reproduzir som de notificação:', error);
          toast.error('Erro ao tocar som. Clique em "Testar" para ativar.', {
            duration: 4000,
          });
          isPlayingRef.current = false;
          if (audioIntervalRef.current) {
            clearInterval(audioIntervalRef.current);
            audioIntervalRef.current = null;
          }
        });
      }
    };

    playSound();
    audioIntervalRef.current = window.setInterval(playSound, 2000);
  }, [soundEnabled]);

  const stopAudioLoop = useCallback(() => {
    isPlayingRef.current = false;

    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const startTitleBlink = useCallback((count: number) => {
    if (titleIntervalRef.current) {
      return;
    }

    let toggle = false;
    titleIntervalRef.current = window.setInterval(() => {
      toggle = !toggle;
      if (toggle) {
        document.title = `(${count}) Novo Pedido!`;
      } else {
        document.title = originalTitle;
      }
    }, 2000);
  }, [originalTitle]);

  const stopTitleBlink = useCallback(() => {
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
    }
    document.title = originalTitle;
  }, [originalTitle]);

  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, []);

  const fetchUnviewedOrders = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from('orders')
      .select('id, customer_name, order_type, status, viewed, created_at')
      .eq('viewed', false)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUnviewedOrders(data);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    fetchUnviewedOrders();

    const channel = supabase
      .channel('orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending',
        },
        (payload) => {
          const newOrder = payload.new as Order;

          if (!newOrder.viewed) {
            setUnviewedOrders((prev) => [newOrder, ...prev]);

            showBrowserNotification(newOrder);
            vibrate();
            toast.success(`Novo pedido de ${newOrder.customer_name}!`, {
              icon: createElement('i', { className: 'fas fa-bell-ring text-accent' }),
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const updatedOrder = payload.new as Order;

          if (updatedOrder.viewed || updatedOrder.status !== 'pending') {
            setUnviewedOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAdmin, fetchUnviewedOrders, showBrowserNotification, vibrate]);

  useEffect(() => {
    const hasUnviewed = unviewedOrders.length > 0;

    const shouldRing =
      hasUnviewed && !isOnOrdersPage;

    if (shouldRing) {
      playAudioLoop();
      startTitleBlink(unviewedOrders.length);
    } else {
      stopAudioLoop();
      stopTitleBlink();
    }
  }, [
    unviewedOrders.length,
    isOnOrdersPage,
    playAudioLoop,
    stopAudioLoop,
    startTitleBlink,
    stopTitleBlink,
  ]);

  useEffect(() => {
    return () => {
      stopAudioLoop();
      stopTitleBlink();
    };
  }, [stopAudioLoop, stopTitleBlink]);

  const markAsViewed = useCallback(async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ viewed: true })
      .eq('id', orderId);

    if (!error) {
      setUnviewedOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  }, []);

  const markAllAsViewed = useCallback(async () => {
    const ids = unviewedOrders.map(order => order.id);
    if (!ids.length) return;
    const { error } = await supabase.from('orders').update({ viewed: true }).in('id', ids);
    if (error) { toast.error('Não foi possível atualizar as notificações'); return; }
    setUnviewedOrders([]);
    toast.success('Notificações marcadas como lidas');
  }, [unviewedOrders]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('notification_sound_enabled', String(enabled));

    if (!enabled) {
      stopAudioLoop();
    } else {
      if (audioRef.current) {
        audioRef.current.volume = 0;
        audioRef.current.play()
          .then(() => {
            audioRef.current!.pause();
            audioRef.current!.currentTime = 0;
            audioRef.current!.volume = 0.7;

            if (unviewedOrders.length > 0) {
              playAudioLoop();
            }

            toast.success('Som de notificação ativado!', { duration: 2000 });
          })
          .catch((error) => {
            console.error('Erro ao ativar som:', error);
            toast.error('Clique em "Testar" para ativar o som', { duration: 3000 });
          });
      }
    }
  }, [stopAudioLoop, playAudioLoop, unviewedOrders.length]);

  const testSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          toast.success('Som tocado com sucesso!', { duration: 2000 });
        })
        .catch((error) => {
          console.error('Erro ao testar som:', error);
          toast.error('Não foi possível reproduzir o som. Permissão negada pelo navegador.', {
            duration: 4000,
          });
        });
    }
  }, []);

  return {
    unviewedCount: unviewedOrders.length,
    unviewedOrders,
    markAsViewed,
    markAllAsViewed,
    soundEnabled,
    setSoundEnabled,
    notificationsEnabled,
    testSound,
  };
}
