import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProductStats } from '../hooks/useProductStats';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function ProductStats() {
  const navigate = useNavigate();
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const { stats, isLoading, fetchProductStats } = useProductStats();

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin()) {
      navigate('/');
      return;
    }
    fetchProductStats();
  }, [isAuthenticated, navigate, fetchProductStats, isSuperAdmin]);

  const maxQuantity = stats.length > 0 ? stats[0].quantity : 0;
  const totalOrdered = stats.reduce((sum, s) => sum + s.quantity, 0);

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
        title="Estatísticas de Produtos"
        description="Ranking dos produtos mais pedidos"
        icon="chart-simple"
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : stats.length === 0 ? (
        <EmptyState
          icon="chart-simple"
          title="Sem dados"
          description="As estatísticas aparecerão quando houver pedidos enviados"
        />
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <i className="fas fa-box text-accent"></i>
              {stats.length} produto{stats.length !== 1 && 's'} diferente{stats.length !== 1 && 's'}
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2">
              <i className="fas fa-shopping-cart text-accent"></i>
              {totalOrdered} unidade{totalOrdered !== 1 && 's'} pedida{totalOrdered !== 1 && 's'}
            </span>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {stats.map((stat, index) => {
                const progressWidth = maxQuantity > 0 ? (stat.quantity / maxQuantity) * 100 : 0;
                const isTop3 = index < 3;

                return (
                  <div key={stat.name} className="relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-accent/5 transition-all duration-500"
                      style={{ width: `${progressWidth}%` }}
                    />
                    <div className="relative flex items-center gap-4 p-4 sm:p-5">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isTop3
                            ? 'bg-accent text-gray-50'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-800 font-semibold truncate">
                          {stat.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-2xl font-bold text-accent">
                          {stat.quantity}
                        </span>
                        <span className="text-sm text-gray-400">
                          {stat.quantity === 1 ? 'un.' : 'un.'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
