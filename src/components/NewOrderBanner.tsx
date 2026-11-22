import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NewOrderBannerProps {
  unviewedCount: number;
  accentColor: string;
}

export default function NewOrderBanner({ unviewedCount, accentColor }: NewOrderBannerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const isOnOrdersPage = location.pathname === '/pedidos';

  useEffect(() => {
    if (unviewedCount > 0 && !isOnOrdersPage) {
      setDismissed(false);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [unviewedCount, isOnOrdersPage]);

  if (!visible || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-2 rounded-full shadow-2xl border border-white/20 animate-slide-up"
      style={{ backgroundColor: accentColor }}
    >
      <div className="flex items-center gap-2 text-white">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <span className="font-semibold text-sm whitespace-nowrap">
          {unviewedCount === 1
            ? '1 novo pedido!'
            : `${unviewedCount} novos pedidos!`}
        </span>
      </div>

      <button
        onClick={() => navigate('/pedidos')}
        className="text-sm font-bold bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-full text-white whitespace-nowrap"
      >
        Ver agora
      </button>

      <button
        onClick={() => setDismissed(true)}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
        title="Fechar"
      >
        <i className="fas fa-xmark text-xs"></i>
      </button>
    </div>
  );
}
