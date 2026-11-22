import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useArchivedOrders } from '../hooks/useArchivedOrders';
import { useThemeStore } from '../store/theme';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import type { Database, OrderItem } from '../types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];

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

interface ArchivedOrderCardProps {
  order: Order;
  formatCurrency: (value: number) => string;
}

function formatDeliveryTime(acceptedAt: string | null, deliveredAt: string | null): string | null {
  if (!acceptedAt || !deliveredAt) return null;

  const accepted = new Date(acceptedAt).getTime();
  const delivered = new Date(deliveredAt).getTime();
  const diffMs = delivered - accepted;

  if (diffMs < 0) return null;

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

function ArchivedOrderCard({ order, formatCurrency }: ArchivedOrderCardProps) {
  const items = order.items as OrderItem[];
  const deliveryTime = formatDeliveryTime(order.accepted_at, order.delivered_at);

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
    <Card padding="none" className="overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div className="flex items-center gap-3">
            <OrderTypeBadge type={order.order_type} />
            <span className="px-2.5 py-1 text-xs font-semibold bg-accent/10 text-accent rounded-full">
              Enviado
            </span>
            {deliveryTime && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <i className="fas fa-stopwatch"></i>
                {deliveryTime}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-400">
            {new Date(order.created_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-800 font-title mb-1">
            {order.customer_name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-phone text-xs text-gray-400"></i>
              {order.customer_phone}
            </span>
            <span className="flex items-center gap-1.5 truncate">
              <i className="fas fa-envelope text-xs text-gray-400"></i>
              {order.customer_email}
            </span>
          </div>
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
        </div>
      </div>
    </Card>
  );
}

export default function Archive() {
  const navigate = useNavigate();
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const { formatCurrency } = useThemeStore();
  const {
    orders,
    totalCount,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    fetchArchivedOrders,
  } = useArchivedOrders();

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin()) {
      navigate('/');
      return;
    }
    fetchArchivedOrders();
  }, [isAuthenticated, navigate, fetchArchivedOrders, isSuperAdmin]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArchivedOrders();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchArchivedOrders();
    }
  }, [currentPage, isAuthenticated, fetchArchivedOrders]);

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="mb-4">
        <Link
          to="/pedidos"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          Voltar aos Pedidos
        </Link>
      </div>

      <PageHeader
        title="Arquivo"
        description="Histórico de pedidos enviados"
        icon="layer-group"
      />

      <form onSubmit={handleSearch} className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Pesquisar por nome, telefone, email, endereço ou notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 h-12 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
          />
        </div>
        <Button type="submit" className="sm:w-auto">
          Pesquisar
        </Button>
      </form>

      {orders.length === 0 ? (
        <EmptyState
          icon="layer-group"
          title={searchQuery ? 'Nenhum pedido encontrado' : 'Arquivo vazio'}
          description={
            searchQuery
              ? 'Tente uma pesquisa diferente'
              : 'Os pedidos enviados aparecerão aqui'
          }
        />
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-500">
            {totalCount} pedido{totalCount !== 1 && 's'} no arquivo
          </div>

          <div className="space-y-4 mb-6">
            {orders.map(order => (
              <ArchivedOrderCard
                key={order.id}
                order={order}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-accent text-gray-50'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
