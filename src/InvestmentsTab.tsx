import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Wallet, ChevronLeft, ChevronRight,
  Plus, Trash2, Edit2, Check, X, TrendingDown
} from 'lucide-react';
import type { SalaryCalculation } from './hooks/useSalaryHistory';
import { useInvestmentsData } from './hooks/useInvestmentsData';
import { usePortfolios } from './hooks/usePortfolios';

interface InvestmentsTabProps {
  salaryHistory: SalaryCalculation[];
  investmentsData: ReturnType<typeof useInvestmentsData>;
  referenceMonth: string;
  setReferenceMonth: (v: string) => void;
}

const PORTFOLIO_COLORS: Record<string, { bg: string; text: string; dot: string; border: string; icon_bg: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500', border: 'border-indigo-200', icon_bg: 'bg-indigo-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-200', icon_bg: 'bg-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-200', icon_bg: 'bg-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', border: 'border-rose-200', icon_bg: 'bg-rose-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-200', icon_bg: 'bg-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500', border: 'border-purple-200', icon_bg: 'bg-purple-100' },
};

const COLOR_OPTIONS = ['indigo', 'emerald', 'amber', 'rose', 'blue', 'purple'];
const ICON_OPTIONS = ['💰', '📈', '📊', '🏦', '🪙', '🏛️', '⚡', '💎', '🚀', '🌱'];

const formatCurrency = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export const InvestmentsTab: React.FC<InvestmentsTabProps> = ({ 
  salaryHistory, 
  investmentsData,
  referenceMonth,
  setReferenceMonth,
}) => {
  const [yearStr, monthStr_raw] = referenceMonth.split('-');
  const year = parseInt(yearStr || '2026');
  const month = parseInt(monthStr_raw || '7') - 1; // 0-indexed month
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const prevMonth = () => {
    let prevM = month;
    let prevY = year;
    if (prevM === 0) {
      prevM = 12;
      prevY -= 1;
    }
    setReferenceMonth(`${prevY}-${String(prevM).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    let nextM = month + 2;
    let nextY = year;
    if (nextM === 13) {
      nextM = 1;
      nextY += 1;
    }
    setReferenceMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  const { portfolios, dividends, addPortfolio, updatePortfolio, deletePortfolio, addDividend, deleteDividend } = usePortfolios();

  // Add Portfolio Modal State
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newIcon, setNewIcon] = useState('💰');
  const [newColor, setNewColor] = useState('indigo');
  const [newBalance, setNewBalance] = useState('');
  const [newRate, setNewRate] = useState('0.15');

  // Edit Portfolio State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editRate, setEditRate] = useState('');

  // Add Dividend State
  const [addDividendPortfolioId, setAddDividendPortfolioId] = useState<string | null>(null);
  const [newDividendDate, setNewDividendDate] = useState('');
  const [newDividendAmount, setNewDividendAmount] = useState('');
  const [newDividendPaymentDate, setNewDividendPaymentDate] = useState('');

  // Summary metrics
  const totalPatrimonio = useMemo(() => {
    return portfolios.reduce((acc, p) => acc + (p.current_balance || 0), 0);
  }, [portfolios]);

  const totalRendimentoMes = useMemo(() => {
    return portfolios.reduce((acc, p) => {
      const monthly = (p.current_balance * (p.monthly_rate / 100));
      return acc + monthly;
    }, 0);
  }, [portfolios]);

  const rendimentoPct = useMemo(() => {
    if (totalPatrimonio === 0) return 0;
    return (totalRendimentoMes / totalPatrimonio) * 100;
  }, [totalPatrimonio, totalRendimentoMes]);

  const monthDividends = useMemo(() => {
    return dividends.filter(d => d.date.startsWith(monthStr));
  }, [dividends, monthStr]);

  const totalDividendsMes = useMemo(() => {
    return monthDividends.reduce((acc, d) => acc + d.amount, 0);
  }, [monthDividends]);

  const nextDividends = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    return dividends
      .filter(d => d.payment_date && d.payment_date >= today)
      .sort((a, b) => (a.payment_date || '').localeCompare(b.payment_date || ''))
      .slice(0, 2);
  }, [dividends]);

  const handleAddPortfolio = async () => {
    if (!newName.trim()) return;
    const bal = parseFloat(newBalance.replace(',', '.')) || 0;
    const rate = parseFloat(newRate.replace(',', '.')) || 0;
    await addPortfolio({
      name: newName.trim(),
      subtitle: newSubtitle.trim(),
      icon: newIcon,
      color: newColor,
      current_balance: bal,
      monthly_rate: rate,
    });
    setShowAddPortfolio(false);
    setNewName(''); setNewSubtitle(''); setNewIcon('💰');
    setNewColor('indigo'); setNewBalance(''); setNewRate('0.15');
  };

  const startEdit = (p: typeof portfolios[0]) => {
    setEditingId(p.id);
    setEditBalance(p.current_balance.toFixed(2).replace('.', ','));
    setEditRate(p.monthly_rate.toString().replace('.', ','));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const bal = parseFloat(editBalance.replace(',', '.')) || 0;
    const rate = parseFloat(editRate.replace(',', '.')) || 0;
    await updatePortfolio(editingId, { current_balance: bal, monthly_rate: rate });
    setEditingId(null);
  };

  const handleAddDividend = async () => {
    if (!addDividendPortfolioId || !newDividendDate || !newDividendAmount) return;
    const amt = parseFloat(newDividendAmount.replace(',', '.')) || 0;
    await addDividend({
      portfolio_id: addDividendPortfolioId,
      date: newDividendDate,
      amount: amt,
      payment_date: newDividendPaymentDate || undefined,
    });
    setAddDividendPortfolioId(null);
    setNewDividendDate(''); setNewDividendAmount(''); setNewDividendPaymentDate('');
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return d.split('-').reverse().join('/');
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Investimentos</h2>
          <p className="text-slate-500 font-medium text-sm">Acompanhe seus investimentos e rendimentos.</p>
        </div>
        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="font-bold text-slate-700 text-sm w-28 text-center">
            {monthNames[month]}/{year}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </header>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patrimônio Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patrimônio total</p>
          <p className="text-xl font-black text-slate-800">{formatCurrency(totalPatrimonio)}</p>
          <p className="text-[10px] text-slate-400 font-medium">Valor atual</p>
        </div>

        {/* Rendimento no Mês */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rendimento no mês</p>
          <p className="text-xl font-black text-emerald-600">+{formatCurrency(totalRendimentoMes)}</p>
          <p className="text-[10px] text-slate-400 font-medium">{rendimentoPct.toFixed(2)}% do patrimônio</p>
        </div>

        {/* Dividendos Recebidos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
            <span className="text-lg">📅</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dividendos recebidos</p>
          <p className="text-xl font-black text-slate-800">{formatCurrency(totalDividendsMes)}</p>
          <p className="text-[10px] text-slate-400 font-medium">Até o momento</p>
        </div>

        {/* Próximos Dividendos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
            <span className="text-lg">📆</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Próximos dividendos</p>
          {nextDividends.length > 0 ? (
            <p className="text-lg font-black text-slate-800 leading-tight">
              {nextDividends.map(d => formatDate(d.payment_date)).join(' e ')}
            </p>
          ) : (
            <p className="text-sm font-bold text-slate-400">—</p>
          )}
          <p className="text-[10px] text-slate-400 font-medium">Datas dos pagamentos</p>
        </div>
      </div>

      {/* Meus Investimentos */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800">Meus Investimentos</h3>
          <button
            onClick={() => setShowAddPortfolio(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Carteira
          </button>
        </div>

        {portfolios.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="font-bold text-slate-500 mb-1">Nenhuma carteira cadastrada</p>
            <p className="text-sm">Clique em "Nova Carteira" para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {portfolios.map(p => {
              const colors = PORTFOLIO_COLORS[p.color] || PORTFOLIO_COLORS.indigo;
              const monthlyYield = p.current_balance * (p.monthly_rate / 100);
              const isEditing = editingId === p.id;

              return (
                <div key={p.id} className="px-6 py-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-2xl ${colors.icon_bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                      {p.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-black text-slate-800">{p.name}</h4>
                          {p.subtitle && <p className="text-xs text-slate-400 font-medium">{p.subtitle}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setAddDividendPortfolioId(p.id)} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Adicionar dividendo">
                                <span className="text-sm">📅</span>
                              </button>
                              <button onClick={() => startEdit(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => deletePortfolio(p.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Atual (R$)</label>
                            <input
                              type="text"
                              value={editBalance}
                              onChange={e => setEditBalance(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa Mensal (%)</label>
                            <input
                              type="text"
                              value={editRate}
                              onChange={e => setEditRate(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo atual</p>
                            <p className="font-black text-slate-800 text-base mt-0.5">{formatCurrency(p.current_balance)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rendimento no mês</p>
                            <p className={`font-black text-base mt-0.5 ${monthlyYield >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {monthlyYield >= 0 ? '+' : ''}{formatCurrency(monthlyYield)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rentabilidade</p>
                            <p className="font-black text-slate-800 text-base mt-0.5">{p.monthly_rate.toFixed(2)}%</p>
                          </div>
                        </div>
                      )}

                      {/* Dividends for this portfolio */}
                      {dividends.filter(d => d.portfolio_id === p.id && d.date.startsWith(monthStr)).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {dividends
                            .filter(d => d.portfolio_id === p.id && d.date.startsWith(monthStr))
                            .map(d => (
                              <div key={d.id} className="flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-100 rounded-lg">
                                <span className="text-xs font-bold text-orange-600">📅 {formatDate(d.date)} — {formatCurrency(d.amount)}</span>
                                <button onClick={() => deleteDividend(d.id)} className="text-orange-300 hover:text-rose-500 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="px-6 py-4 flex items-center gap-2 text-slate-400">
              <span className="text-sm">💡</span>
              <p className="text-xs font-medium text-slate-400">Continue investindo e acompanhe seu patrimônio crescer.</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Portfolio Modal */}
      {showAddPortfolio && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">Nova Carteira</h3>
              <button onClick={() => setShowAddPortfolio(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ex: Caixinha Turbo"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subtítulo</label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={e => setNewSubtitle(e.target.value)}
                    placeholder="Ex: Rendimento diário"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Atual (R$)</label>
                  <input
                    type="text"
                    value={newBalance}
                    onChange={e => setNewBalance(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa Mensal (%)</label>
                  <input
                    type="text"
                    value={newRate}
                    onChange={e => setNewRate(e.target.value)}
                    placeholder="0.15"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ícone</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setNewIcon(ic)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${newIcon === ic ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cor</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(c => {
                    const colors = PORTFOLIO_COLORS[c];
                    return (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={`w-8 h-8 rounded-full ${colors.dot} transition-all ${newColor === c ? 'ring-4 ring-offset-2 ring-slate-400' : ''}`}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleAddPortfolio}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm"
              >
                Criar Carteira
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dividend Modal */}
      {addDividendPortfolioId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">Registrar Dividendo</h3>
              <button onClick={() => setAddDividendPortfolioId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de referência</label>
                <input type="date" value={newDividendDate} onChange={e => setNewDividendDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor (R$)</label>
                <input type="text" value={newDividendAmount} onChange={e => setNewDividendAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de pagamento (opcional)</label>
                <input type="date" value={newDividendPaymentDate} onChange={e => setNewDividendPaymentDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handleAddDividend}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm">
                Salvar Dividendo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
