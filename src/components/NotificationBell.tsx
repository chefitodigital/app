import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { OrderNotificationsResult } from '../hooks/useOrderNotifications';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface NotificationBellProps {
  accentColor: string;
  isAdmin: boolean;
  notifications: OrderNotificationsResult;
}

export default function NotificationBell({ accentColor, isAdmin, notifications }: NotificationBellProps) {
  const {
    unviewedCount,
    unviewedOrders,
    markAsViewed,
    markAllAsViewed,
    soundEnabled,
    setSoundEnabled,
    testSound,
  } = notifications;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useBodyScrollLock(isDropdownOpen);

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return time.toLocaleDateString('pt-BR');
  };

  const hasUnviewed = unviewedCount > 0;

  if (!isAdmin) return null;

  return (
    <div className="relative">
      <style>{`
        @keyframes shake-bell {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(-25deg); }
          20% { transform: rotate(25deg); }
          30% { transform: rotate(-25deg); }
          40% { transform: rotate(25deg); }
          50% { transform: rotate(-25deg); }
          60% { transform: rotate(25deg); }
          70% { transform: rotate(-25deg); }
          80% { transform: rotate(25deg); }
          90% { transform: rotate(-15deg); }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            filter: brightness(1) drop-shadow(0 0 0px ${accentColor});
          }
          50% {
            opacity: 0.7;
            filter: brightness(1.3) drop-shadow(0 0 12px ${accentColor});
          }
        }

        @keyframes pulse-badge {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 ${accentColor}80;
          }
          50% {
            transform: scale(1.15);
            box-shadow: 0 0 0 6px ${accentColor}00;
          }
        }

        .bell-icon.active {
          animation: shake-bell 0.8s ease-in-out infinite;
          transform-origin: top center;
        }

        @media (hover: hover) and (pointer: fine) {
          .bell-icon:hover {
            animation: shake-bell 0.5s ease-in-out;
            transform-origin: top center;
          }
        }

        .notification-badge {
          animation: pulse-badge 1.5s ease-in-out infinite;
        }
      `}</style>

      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative flex items-center justify-center w-10 h-10"
        title={`${unviewedCount} pedido${unviewedCount !== 1 ? 's' : ''} não visualizado${unviewedCount !== 1 ? 's' : ''}`}
      >
        <i
          className={`fas fa-bell-ring bell-icon inline-block ${hasUnviewed ? 'active' : ''}`}
          style={{ color: accentColor }}
        ></i>

        {hasUnviewed && (
          <span
            className="absolute -top-1 -right-1 notification-badge flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-bold text-white rounded-full"
            style={{ backgroundColor: accentColor }}
          >
            {unviewedCount > 99 ? '99+' : unviewedCount}
          </span>
        )}
      </button>

      {isDropdownOpen && createPortal(
        <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 pointer-events-none">
          <div className="bg-gray-50 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 font-title">Notificações</h3>
              <div className="flex items-center space-x-2">
                {hasUnviewed && (
                  <button
                    onClick={markAllAsViewed}
                    className="text-sm px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: accentColor }}
                  >
                    Marcar todos lidos
                  </button>
                )}
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <i className="fas fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <i className={`fas ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                  <span>{soundEnabled ? 'Som ativado' : 'Som desativado'}</span>
                </button>
                {soundEnabled && (
                  <button
                    onClick={testSound}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <i className="fas fa-play mr-1"></i>
                    Testar
                  </button>
                )}
              </div>

              {unviewedOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <i className="fas fa-check-circle text-4xl mb-2" style={{ color: accentColor }}></i>
                  <p className="font-medium">Sem notificações pendentes</p>
                  <p className="text-sm mt-1">Você está em dia!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {unviewedOrders.map((order) => (
                    <div key={order.id} className="p-4 hover:bg-gray-100/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <i className="fas fa-circle text-xs" style={{ color: accentColor }}></i>
                            <h4 className="font-semibold text-gray-800 truncate">
                              {order.customer_name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <i className={`fas ${
                              order.order_type === 'delivery'
                                ? 'fa-motorcycle'
                                : order.order_type === 'table'
                                  ? 'fa-utensils'
                                  : 'fa-bag-shopping'
                            }`}></i>
                            <span>
                              {order.order_type === 'delivery'
                                ? 'Entrega'
                                : order.order_type === 'table'
                                  ? 'Mesa'
                                  : 'Retirada'}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{formatTime(order.created_at)}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsViewed(order.id);
                          }}
                          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                          title="Marcar como lido"
                        >
                          <i className="fas fa-check text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                to="/pedidos"
                onClick={() => setIsDropdownOpen(false)}
                className="btn btn-primary w-full text-sm sm:text-base flex items-center justify-center"
                style={{ backgroundColor: accentColor, color: 'white' }}
              >
                Ver todos os pedidos
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
