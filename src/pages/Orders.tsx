import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import { useThemeStore } from '../store/theme';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import FirstOrderBadge, { ContactFirstOrder } from '../components/FirstOrderBadge';
import type { Database, OrderItem } from '../types/supabase';
import { pixOrderReference } from '../lib/orderReference';

function formatMbwayReference(prefix: string, sequence: number): string {
  return `${prefix}-${sequence.toString().padStart(5, '0')}`;
}

type Order = Database['public']['Tables']['orders']['Row'];

function formatElapsedTime(acceptedAt: string): string {
  const accepted = new Date(acceptedAt).getTime();
  const now = Date.now();
  const diff = Math.floor((now - accepted) / 1000);

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

function OrderTypeBadge({ type }: { type: string }) {
  const typeConfig: Record<string, { label: string; icon: string }> = {
    delivery: { label: 'Entrega', icon: 'motorcycle' },
    table: { label: 'Mesa', icon: 'utensils' },
    takeaway: { label: 'Retirada', icon: 'bag-shopping' },
  };

  const config = typeConfig[type] || typeConfig.delivery;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
      <i className={`fas fa-${config.icon} text-xs`}></i>
      {config.label}
    </span>
  );
}

function ElapsedTimer({ acceptedAt }: { acceptedAt: string }) {
  const [elapsed, setElapsed] = useState(formatElapsedTime(acceptedAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsedTime(acceptedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [acceptedAt]);

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full text-sm font-semibold text-accent">
      <i className="fas fa-stopwatch"></i>
      {elapsed}
    </span>
  );
}

interface OrderCardProps {
  order: Order;
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
  onDeliver: (id: string) => void;
  onTogglePayment: (id: string, current: 'pending' | 'paid') => void;
  formatCurrency: (value: number) => string;
  isFirstOrder: boolean;
  mbwayReferencePrefix: string | null | undefined;
}

function OrderCard({ order, onAccept, onCancel, onDeliver, onTogglePayment, formatCurrency, isFirstOrder, mbwayReferencePrefix }: OrderCardProps) {
  const items = order.items as OrderItem[];
  const isPending = order.status === 'pending';
  const isAccepted = order.status === 'accepted';

  const getAddressLabel = () => {
    switch (order.order_type) {
      case 'table':
        return 'Mesa';
      case 'takeaway':
        return 'Horário de retirada';
      default:
        return 'Endereço';
    }
  };

  const getAddressIcon = () => {
    switch (order.order_type) {
      case 'table':
        return 'chair';
      case 'takeaway':
        return 'clock';
      default:
        return 'location-dot';
    }
  };

  return (
    <Card padding="none" className="overflow-hidden transition-shadow duration-300 hover:shadow-card-hover">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <OrderTypeBadge type={order.order_type} />
            {order.payment_method === 'pix' && pixOrderReference(order.order_sequence) && <span className="text-sm font-semibold text-gray-700">{pixOrderReference(order.order_sequence)}</span>}
            {isAccepted && order.accepted_at && (
              <>
                <span className="text-gray-300">|</span>
                <ElapsedTimer acceptedAt={order.accepted_at} />
              </>
            )}
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3"><span className="text-sm text-gray-600">
            {new Date(order.created_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>{isFirstOrder && <ContactFirstOrder customerPhone={order.customer_phone} />}</div>
        </div>

        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-800 font-title mb-1">
            {order.customer_name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-phone text-xs text-gray-400"></i>
              {order.customer_phone}
            </span>
            <span className="flex items-center gap-1.5 truncate">
              <i className="fas fa-envelope text-xs text-gray-400"></i>
              {order.customer_email}
            </span>
          </div>
          {isFirstOrder && (
            <FirstOrderBadge />
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <i className={`fas fa-${getAddressIcon()} text-accent text-sm`}></i>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {getAddressLabel()}
              </span>
              <p className="text-gray-800 font-medium mt-0.5">{order.address}</p>
            </div>
          </div>
          {order.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 italic">
                <i className="fas fa-quote-left text-xs text-gray-300 mr-2"></i>
                {order.notes}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-5">
          {items.map((item, index) => {
            const itemTotal = (item.price + item.extras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)) * item.quantity;
            return (
              <div key={index} className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                    {item.quantity}
                  </span>
                  <div className="min-w-0">
                    <span className="text-gray-800 font-medium">{item.name}</span>
                    {item.extras.length > 0 && (
                      <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                        {item.extras.map((extra, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="text-accent">+</span>
                            <span>{extra.quantity}x {extra.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-gray-600 font-medium flex-shrink-0">{formatCurrency(itemTotal)}</span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="flex items-center gap-2 text-gray-500">
                Desconto
                {order.coupon_code && (
                  <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 text-xs font-semibold">
                    {order.coupon_code}
                  </span>
                )}
              </span>
              <span className="text-accent font-medium">-{formatCurrency(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
            <span className="text-lg font-bold text-gray-800">Total</span>
            <span className="text-xl font-bold text-accent">{formatCurrency(order.total)}</span>
          </div>

          <div className="flex items-center justify-between pt-3 mt-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <i className={`fas ${
                order.payment_method === 'mbway' ? 'fa-mobile-screen-button'
                : order.payment_method === 'pix' ? 'fa-qrcode'
                : 'fa-money-bill-wave'
              } text-xs`}></i>
              <span>{
                order.payment_method === 'mbway' ? 'MBWay'
                : order.payment_method === 'pix' ? 'Pix'
                : 'Dinheiro'
              }</span>
            </div>
            {(order.payment_method === 'mbway' || order.payment_method === 'pix') && (
              <button
                onClick={() => onTogglePayment(order.id, order.payment_status)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  order.payment_status === 'paid'
                    ? 'bg-accent/10 text-accent hover:bg-accent/20'
                    : 'bg-gray-700 text-gray-50 hover:bg-gray-800'
                }`}
              >
                <i className={`fas ${order.payment_status === 'paid' ? 'fa-circle-check' : 'fa-clock'} text-xs`}></i>
                {order.payment_status === 'paid' ? 'Pago' : 'Por Pagar'}
              </button>
            )}
          </div>
          {order.payment_method === 'mbway' && mbwayReferencePrefix && order.order_sequence != null && (
            <div className="flex items-center justify-between pt-2 mt-1">
              <span className="text-xs text-gray-400">Referência</span>
              <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md tracking-wider">
                {formatMbwayReference(mbwayReferencePrefix, order.order_sequence)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100">
        {isPending && (
          <div className="flex gap-3">
            <button
              onClick={() => onCancel(order.id)}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border-2 border-gray-200 text-gray-600 font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
            >
              <i className="fas fa-xmark"></i>
              <span>Cancelar</span>
            </button>
            <button
              onClick={() => onAccept(order.id)}
              className="flex-[1.5] flex items-center justify-center gap-2 h-12 rounded-lg bg-accent text-gray-50 font-medium transition-all duration-200 hover:bg-accent/90 hover:shadow-md active:scale-[0.98]"
            >
              <i className="fas fa-check-circle"></i>
              <span>Aceitar Pedido</span>
            </button>
          </div>
        )}
        {isAccepted && (
          <div className="flex gap-3">
            <button
              onClick={() => onCancel(order.id)}
              className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-200 text-gray-500 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-600 active:scale-[0.98]"
            >
              <i className="fas fa-xmark"></i>
            </button>
            <button
              onClick={() => onDeliver(order.id)}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg bg-accent text-gray-50 font-medium transition-all duration-200 hover:bg-accent/90 hover:shadow-md active:scale-[0.98]"
            >
              <i className="fas fa-check-circle"></i>
              <span>Marcar como Enviado</span>
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const { formatCurrency, settings } = useThemeStore();
  const { orders, fetchOrders, acceptOrder, cancelOrder, markAsDelivered, togglePaymentStatus, isFirstOrderForCustomer } = useOrders();
  const [firstOrderEmails, setFirstOrderEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin()) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate, fetchOrders, isSuperAdmin]);

  useEffect(() => {
    const checkFirstOrders = async () => {
      const emailsToCheck = [...new Set(orders.map(o => o.customer_email))];
      const firstOrders = new Set<string>();

      await Promise.all(
        emailsToCheck.map(async (email) => {
          const isFirst = await isFirstOrderForCustomer(email);
          if (isFirst) {
            firstOrders.add(email);
          }
        })
      );

      setFirstOrderEmails(firstOrders);
    };

    if (orders.length > 0) {
      checkFirstOrders();
    }
  }, [orders, isFirstOrderForCustomer]);

  const [cancelConfirm, setCancelConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [isCancelling, setIsCancelling] = useState(false);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const acceptedOrders = orders.filter(o => o.status === 'accepted');

  const handleCancel = (id: string) => {
    setCancelConfirm({ isOpen: true, id });
  };

  const confirmCancel = async () => {
    if (!cancelConfirm.id) return;
    setIsCancelling(true);
    await cancelOrder(cancelConfirm.id);
    setIsCancelling(false);
    setCancelConfirm({ isOpen: false, id: null });
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <PageHeader
        title="Pedidos"
        description="Gestão de pedidos recebidos pelo WhatsApp"
        icon="bell-concierge"
      />

      {orders.length === 0 ? (
        <EmptyState
          icon="bell-concierge"
          title="Nenhum pedido"
          description="Os pedidos enviados pelo WhatsApp aparecerão aqui"
        />
      ) : (
        <div className="space-y-12">
          {pendingOrders.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 font-title">Pendentes</h2>
                <p className="text-sm text-gray-500">{pendingOrders.length} pedido{pendingOrders.length !== 1 && 's'} a asalvar</p>
              </div>
              <div className="space-y-4">
                {pendingOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAccept={acceptOrder}
                    onCancel={handleCancel}
                    onDeliver={markAsDelivered}
                    onTogglePayment={togglePaymentStatus}
                    formatCurrency={formatCurrency}
                    isFirstOrder={firstOrderEmails.has(order.customer_email)}
                    mbwayReferencePrefix={settings?.mbway_reference_prefix}
                  />
                ))}
              </div>
            </section>
          )}

          {acceptedOrders.length > 0 && (
            <section className="pt-8 border-t border-gray-200">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 font-title">Em Preparação</h2>
                <p className="text-sm text-gray-500">{acceptedOrders.length} pedido{acceptedOrders.length !== 1 && 's'} em andamento</p>
              </div>
              <div className="space-y-4">
                {acceptedOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAccept={acceptOrder}
                    onCancel={handleCancel}
                    onDeliver={markAsDelivered}
                    onTogglePayment={togglePaymentStatus}
                    formatCurrency={formatCurrency}
                    isFirstOrder={firstOrderEmails.has(order.customer_email)}
                    mbwayReferencePrefix={settings?.mbway_reference_prefix}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
        <Link
          to="/pedidos/arquivo"
          className="flex items-center justify-center gap-2 w-full h-[var(--btn-height-lg)] px-6 rounded-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-accent hover:text-accent transition-colors"
        >
          <i className="fas fa-layer-group"></i>
          <span className="font-medium">Ver Arquivo de Pedidos</span>
          <i className="fas fa-chevron-right text-sm"></i>
        </Link>
        <Link
          to="/pedidos/estatisticas"
          className="flex items-center justify-center gap-2 w-full h-[var(--btn-height-lg)] px-6 rounded-full bg-accent text-gray-50 font-medium hover:bg-accent/90 transition-colors shadow-sm"
        >
          <i className="fas fa-chart-simple"></i>
          <span>Estatísticas de Produtos</span>
          <i className="fas fa-chevron-right text-sm"></i>
        </Link>
      </div>

      <ConfirmModal
        isOpen={cancelConfirm.isOpen}
        onClose={() => setCancelConfirm({ isOpen: false, id: null })}
        onConfirm={confirmCancel}
        title="Cancelar pedido"
        description="Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita."
        confirmLabel="Cancelar pedido"
        cancelLabel="Voltar"
        isLoading={isCancelling}
      />
    </div>
  );
}
