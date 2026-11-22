import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useThemeStore } from '../store/theme';
import { useFinancials } from '../hooks/useFinancials';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { IngredientConsumption } from '../components/financial/IngredientConsumption';

export default function Financial() {
  const { authInitialized, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const { formatCurrency } = useThemeStore();
  const restaurantName = useThemeStore((s) => s.settings?.name || 'Restaurante');
  const canLoadFinancials = authInitialized && isAuthenticated && userRole === 'super_admin';
  const { summary, loading, reload, allTime, allTimeLoading, reloadAllTime } = useFinancials(canLoadFinancials);
  const [showAllTime, setShowAllTime] = useState(false);

  const downloadMD = () => {
    if (!allTime) return;
    const lines: string[] = [];
    lines.push(`# ${restaurantName} — Histórico completo`);
    if (allTime.firstOrderAt) lines.push(`\n_Desde ${new Date(allTime.firstOrderAt).toLocaleDateString('pt-BR')}_`);
    lines.push('');
    lines.push('## Resumo geral');
    lines.push('');
    lines.push(`- **Faturamento total:** ${formatCurrency(allTime.totalSales)}`);
    lines.push(`- **Pedidos totais:** ${allTime.totalOrders}`);
    lines.push(`- **Produtos vendidos (unidades):** ${allTime.totalItems}`);
    lines.push(`- **Clientes cadastrados:** ${allTime.totalCustomers}`);
    lines.push(`- **Ticket médio:** ${formatCurrency(allTime.avgTicket)}`);
    lines.push('');
    lines.push('## Produtos vendidos');
    lines.push('');
    lines.push('| Produto | Quantidade | Total |');
    lines.push('|---|---:|---:|');
    allTime.products.forEach(p => {
      lines.push(`| ${p.name} | ${p.quantity} | ${formatCurrency(p.total)} |`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${restaurantName.toLowerCase().replace(/\s+/g,'-')}-financeiro-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    if (!allTime) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    const today = new Date().toLocaleDateString('pt-BR');

    // ==== Header band (monochrome) ====
    doc.setFillColor(24, 24, 27); // zinc-900
    doc.rect(0, 0, pageW, 34, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(restaurantName, margin, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200);
    doc.text('Relatório Financeiro — Histórico completo', margin, 23);
    doc.setFontSize(9);
    doc.setTextColor(160);
    const sinceLabel = allTime.firstOrderAt
      ? `Desde ${new Date(allTime.firstOrderAt).toLocaleDateString('pt-BR')}`
      : '';
    doc.text(sinceLabel, margin, 29);
    doc.text(`Emitido em ${today}`, pageW - margin, 29, { align: 'right' });

    // ==== Section: Resumo geral ====
    const y = 46;
    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Resumo geral', margin, y);
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1.5, pageW - margin, y + 1.5);

    autoTable(doc, {
      startY: y + 5,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3.5,
        lineColor: [228, 228, 231],
        lineWidth: 0.2,
        textColor: [39, 39, 42],
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [82, 82, 91], fillColor: [244, 244, 245] },
        1: { halign: 'right' },
      },
      body: [
        ['Faturamento total', formatCurrency(allTime.totalSales)],
        ['Pedidos totais', String(allTime.totalOrders)],
        ['Produtos vendidos', `${allTime.totalItems} un.`],
        ['Clientes cadastrados', String(allTime.totalCustomers)],
        ['Ticket médio', formatCurrency(allTime.avgTicket)],
      ],
    });

    // ==== Section: Produtos ====
    const tableDocument = doc as typeof doc & { lastAutoTable: { finalY: number } };
    const afterSummary = tableDocument.lastAutoTable.finalY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27);
    doc.text('Detalhe por produto', margin, afterSummary);
    doc.line(margin, afterSummary + 1.5, pageW - margin, afterSummary + 1.5);

    autoTable(doc, {
      startY: afterSummary + 5,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Produto', 'Qtd', 'Total']],
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3,
        lineColor: [228, 228, 231],
        lineWidth: 0.2,
        textColor: [39, 39, 42],
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        1: { halign: 'right', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 36 },
      },
      body: allTime.products.map((p) => [p.name, String(p.quantity), formatCurrency(p.total)]),
    });

    // ==== Footer on every page ====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.2);
      doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(restaurantName, margin, pageH - 6);
      doc.text(`Página ${i} de ${pageCount}`, pageW - margin, pageH - 6, { align: 'right' });
    }

    doc.save(`${restaurantName.toLowerCase().replace(/\s+/g,'-')}-financeiro-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  useEffect(() => {
    if (!authInitialized) return;
    if (isAuthenticated && userRole === null) return; // aguarda hidratação do role
    if (!isAuthenticated || userRole !== 'super_admin') navigate('/');
  }, [authInitialized, isAuthenticated, userRole, navigate]);

  const StatCard = ({ icon, label, value, hint }: { icon: string; label: string; value: string; hint?: string }) => (
    <Card>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <i className={`fas fa-${icon} text-lg`} />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-2xl font-bold text-gray-800 font-title truncate">{value}</div>
          {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <PageHeader
        title="Financeiro"
        description="Visão geral das vendas do dia e da semana"
        icon="box-dollar"
        action={
          <button
            onClick={reload}
            className="btn btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <i className={`fas fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} />
            Atualizar
          </button>
        }
      />

      {!authInitialized || (isAuthenticated && userRole === null) || (loading && !summary) ? (
        <div className="text-center py-16 text-gray-400">
          <i className="fas fa-spinner fa-spin text-2xl" />
        </div>
      ) : summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              icon="sun"
              label="Vendas de hoje"
              value={formatCurrency(summary.salesToday)}
              hint={`${summary.ordersToday} ${summary.ordersToday === 1 ? 'pedido' : 'pedidos'}`}
            />
            <StatCard
              icon="calendar-week"
              label="Vendas da semana"
              value={formatCurrency(summary.salesWeek)}
              hint={`${summary.ordersWeek} ${summary.ordersWeek === 1 ? 'pedido' : 'pedidos'}`}
            />
            <StatCard
              icon="receipt"
              label="Ticket médio (semana)"
              value={formatCurrency(summary.avgTicketWeek)}
            />
            <StatCard
              icon="crown"
              label="Produto campeão"
              value={summary.championProduct?.name || '—'}
              hint={summary.championProduct ? `${summary.championProduct.quantity} unidades` : 'Sem dados'}
            />
          </div>

          <Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <i className="fas fa-vault text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-500">Vendas totais (desde a ativação)</div>
                <div className="text-2xl font-bold text-gray-800 font-title truncate">
                  {allTime ? formatCurrency(allTime.totalSales) : (allTimeLoading ? '…' : '—')}
                </div>
                {allTime && (
                  <div className="text-xs text-gray-400 mt-1">
                    {allTime.totalOrders} {allTime.totalOrders === 1 ? 'pedido' : 'pedidos'}
                    {allTime.firstOrderAt && ` · desde ${new Date(allTime.firstOrderAt).toLocaleDateString('pt-BR')}`}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setShowAllTime(true); reloadAllTime(); }}
                className="btn btn-secondary flex items-center gap-2"
                disabled={allTimeLoading}
              >
                <i className="fas fa-chart-simple" />
                Ver detalhes
              </button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <i className="fas fa-trophy text-accent" />
              <h2 className="text-lg font-semibold text-gray-800 font-title">
                Top 5 Clientes da Semana
              </h2>
            </div>
            {summary.topCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Ainda sem clientes esta semana.</div>
            ) : (
              <div className="space-y-2">
                {summary.topCustomers.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                      idx === 0 ? 'bg-accent/15 text-accent'
                      : idx === 1 ? 'bg-gray-200 text-gray-700'
                      : idx === 2 ? 'bg-gray-100 text-gray-600'
                      : 'bg-gray-100 text-gray-500'
                    }`}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.orders} {c.orders === 1 ? 'pedido' : 'pedidos'}</div>
                    </div>
                    <div className="font-semibold text-accent">{formatCurrency(c.total)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {canLoadFinancials && <div className="mt-6"><IngredientConsumption /></div>}

      {showAllTime && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAllTime(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <i className="fas fa-vault" />
                </div>
                <div>
                  <h3 className="font-title text-lg font-bold text-gray-800">{restaurantName}</h3>
                  <p className="text-xs text-gray-500">
                    Histórico completo
                    {allTime?.firstOrderAt && ` · desde ${new Date(allTime.firstOrderAt).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadPDF}
                    disabled={!allTime}
                    className="btn btn-secondary flex items-center gap-2 text-sm"
                  >
                    <i className="fas fa-file-pdf" />
                    PDF
                  </button>
                  <button
                    onClick={downloadMD}
                    disabled={!allTime}
                    className="btn btn-secondary flex items-center gap-2 text-sm"
                  >
                    <i className="fas fa-file-lines" />
                    MD
                  </button>
                  <button
                    onClick={() => setShowAllTime(false)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                    aria-label="Fechar"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>
            </div>
            <div className="p-4 overflow-y-auto">
              {allTimeLoading && !allTime ? (
                <div className="text-center py-10 text-gray-400">
                  <i className="fas fa-spinner fa-spin text-2xl" />
                </div>
              ) : allTime ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                      Resumo geral
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { icon: 'sack-dollar', label: 'Faturamento total', value: formatCurrency(allTime.totalSales) },
                        { icon: 'receipt', label: 'Pedidos totais', value: String(allTime.totalOrders) },
                        { icon: 'bag-shopping', label: 'Produtos vendidos', value: `${allTime.totalItems} un.` },
                        { icon: 'users', label: 'Clientes', value: String(allTime.totalCustomers) },
                        { icon: 'chart-line', label: 'Ticket médio', value: formatCurrency(allTime.avgTicket) },
                      ].map((s, i) => (
                        <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <i className={`fas fa-${s.icon} text-accent`} />
                            {s.label}
                          </div>
                          <div className="text-lg font-bold text-gray-800 font-title truncate">{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-bag-shopping text-accent" />
                        Detalhe por produto
                      </h4>
                      <span className="text-xs text-gray-400">{allTime.products.length} {allTime.products.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                    {allTime.products.length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-6">Sem produtos ainda.</div>
                    ) : (
                      <div className="space-y-1 max-h-80 overflow-y-auto">
                        {allTime.products.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 bg-gray-50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 truncate">{p.name}</div>
                              <div className="text-xs text-gray-500">{p.quantity} un.</div>
                            </div>
                            <div className="font-semibold text-accent text-sm">{formatCurrency(p.total)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">Sem dados.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
