import React, { useMemo, useState, useEffect } from 'react';
import { 
  Car, DollarSign, CalendarDays, CheckCircle2,
  ChevronRight, ChevronLeft, RefreshCw, 
  Calendar, CreditCard, Award 
} from 'lucide-react';
import { FinancingDetails } from './hooks/useFinancingData';
import { Expense } from './hooks/useExpensesData';

interface FinancingTabProps {
  financingData: FinancingDetails | null;
  saveFinancingData: (details: FinancingDetails) => void;
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id'>) => Promise<any>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  formatCurrency: (v: number) => string;
  referenceMonth: string;
  setReferenceMonth: (v: string) => void;
}

export const FinancingTab: React.FC<FinancingTabProps> = ({
  financingData,
  saveFinancingData,
  expenses,
  addExpense,
  updateExpense,
  deleteExpense,
  formatCurrency,
  referenceMonth,
  setReferenceMonth,
}) => {
  // Local state for the inputs before saving globally
  const [localData, setLocalData] = useState<FinancingDetails>({
    vehicle_name: '',
    vehicle_total_value: 0,
    vehicle_total_installments: 1,
    installment_value: 0,
    interest_rate: 0,
    due_day: 1
  });

  // Sync with global state when it loads
  useEffect(() => {
    if (financingData) {
      setLocalData(financingData);
    }
  }, [financingData]);

  const updateLocalData = (updates: Partial<FinancingDetails>) => {
    const updated = { ...localData, ...updates };
    setLocalData(updated);
  };

  const handleSaveVehicleData = () => {
    saveFinancingData(localData);
  };

  const parseCurrencyInput = (value: string) => {
    const numericString = value.replace(/\D/g, '');
    return Number(numericString) / 100;
  };

  const formatInputDisplay = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Month parse
  const [yearStr, monthStr] = referenceMonth.split('-');
  const year = parseInt(yearStr || '2026');
  const month = parseInt(monthStr || '07');
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const displayDateStr = `${monthNames[month - 1] || 'Julho'}/${year}`;

  const prevMonth = () => {
    let prevM = month - 1;
    let prevY = year;
    if (prevM === 0) {
      prevM = 12;
      prevY -= 1;
    }
    setReferenceMonth(`${prevY}-${String(prevM).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    let nextM = month + 1;
    let nextY = year;
    if (nextM === 13) {
      nextM = 1;
      nextY += 1;
    }
    setReferenceMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  // Build the installments list by merging the generated list with expenses
  const financingId = financingData?.id || 'GLOBAL';

  const installmentsDetail = useMemo(() => {
    const totalInst = localData.vehicle_total_installments || 1;
    const details = [];

    // Filter financing expenses
    const financingExpenses = expenses.filter(e => e.card_name?.startsWith(`FINANCING-${financingId}-INSTALLMENT-`));

    for (let i = 1; i <= totalInst; i++) {
      const tag = `FINANCING-${financingId}-INSTALLMENT-${i}`;
      const expense = financingExpenses.find(e => e.card_name === tag);
      
      details.push({
        number: i,
        amount: expense ? expense.amount : localData.installment_value,
        paid: !!expense && expense.status === 'paid',
        expenseId: expense?.id,
        paidMonth: expense?.date_str // Can be used to show when it was paid
      });
    }
    return details;
  }, [localData.vehicle_total_installments, localData.installment_value, expenses, financingId]);

  const totalPaid = useMemo(() => {
    return installmentsDetail.filter(item => item.paid).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [installmentsDetail]);

  const paidCount = useMemo(() => {
    return installmentsDetail.filter(item => item.paid).length;
  }, [installmentsDetail]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, localData.vehicle_total_value - totalPaid);
  }, [localData.vehicle_total_value, totalPaid]);

  const progressPercent = useMemo(() => {
    if (!localData.vehicle_total_value) return 0;
    return Math.min(100, (totalPaid / localData.vehicle_total_value) * 100);
  }, [totalPaid, localData.vehicle_total_value]);

  const nextUnpaidInstallment = useMemo(() => {
    return installmentsDetail.find(item => !item.paid);
  }, [installmentsDetail]);

  const getInstallmentDueDateStr = (number: number) => {
    const startYear = 2026;
    const startMonth = 5; // June (0-indexed)
    const targetDate = new Date(startYear, startMonth + (number - 1), localData.due_day);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const monthNamesFmt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${pad(localData.due_day)}/${monthNamesFmt[targetDate.getMonth()]}/${targetDate.getFullYear()}`;
  };

  const [togglingInstallments, setTogglingInstallments] = useState<Set<number>>(new Set());

  // Clean up any existing duplicates
  useEffect(() => {
    const financingExpenses = expenses.filter(e => e.card_name?.startsWith(`FINANCING-${financingId}-INSTALLMENT-`));
    const seen = new Set<string>();
    const duplicatesToDelete: string[] = [];
    
    financingExpenses.forEach(e => {
      if (e.card_name) {
        if (seen.has(e.card_name)) {
          duplicatesToDelete.push(e.id);
        } else {
          seen.add(e.card_name);
        }
      }
    });
    
    if (duplicatesToDelete.length > 0) {
      duplicatesToDelete.forEach(id => deleteExpense(id));
    }
  }, [expenses, financingId, deleteExpense]);

  const nextInstallmentDateStr = useMemo(() => {
    if (!nextUnpaidInstallment) return 'Quitada';
    return getInstallmentDueDateStr(nextUnpaidInstallment.number);
  }, [nextUnpaidInstallment, localData.due_day]);

  // Toggle paid status for an installment
  const handleTogglePaid = async (number: number) => {
    if (togglingInstallments.has(number)) return;
    
    const item = installmentsDetail.find(i => i.number === number);
    if (!item) return;

    setTogglingInstallments(prev => new Set(prev).add(number));

    try {
      const tag = `FINANCING-${financingId}-INSTALLMENT-${number}`;

      if (item.paid && item.expenseId) {
        // Uncheck -> Delete expense
        await deleteExpense(item.expenseId);
      } else if (!item.paid) {
        // Check -> Create expense (only if we didn't just check it in another rapid click)
        const existing = expenses.find(e => e.card_name === tag);
        if (!existing) {
          await addExpense({
            name: `Financiamento - Parcela ${number}/${localData.vehicle_total_installments}`,
            amount: item.amount,
            category: 'Financiamento',
            date_str: `${referenceMonth}-15`, // Using reference month so it appears in the active month
            status: 'paid',
            expense_type: 'fixo',
            payment_period: 'mes',
            card_name: tag
          });
        }
      }
    } finally {
      setTogglingInstallments(prev => {
        const next = new Set(prev);
        next.delete(number);
        return next;
      });
    }
  };

  const handleAmountChange = async (number: number, valueStr: string) => {
    const newAmount = parseCurrencyInput(valueStr);
    const item = installmentsDetail.find(i => i.number === number);
    if (!item || !item.expenseId) return;

    await updateExpense(item.expenseId, { amount: newAmount });
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Financiamento
          </h2>
          <p className="text-slate-500 font-medium text-sm">Acompanhe seu financiamento e visualize o progresso até a quitação.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="font-bold text-slate-700 text-sm w-28 text-center">
            {displayDateStr}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 w-full space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo devedor atual</p>
            <p className="text-3xl md:text-4xl font-black text-indigo-600 mt-1">{formatCurrency(remainingBalance)}</p>
            <p className="text-xs font-black text-emerald-600 mt-1">{progressPercent.toFixed(0)}% pago</p>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>

          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-emerald-600">{formatCurrency(totalPaid)} pagos</span>
            <span className="text-slate-400">{formatCurrency(localData.vehicle_total_value)} total financiado</span>
          </div>
        </div>

        <div className="hidden md:block w-px bg-slate-200 self-stretch my-2" />

        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Próxima parcela</p>
              <p className="text-base font-black text-slate-800 mt-0.5">{nextInstallmentDateStr}</p>
              <p className="text-[10px] text-slate-400 font-medium">Vencimento</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor da próxima parcela</p>
              <p className="text-base font-black text-slate-800 mt-0.5">
                {nextUnpaidInstallment ? formatCurrency(nextUnpaidInstallment.amount) : formatCurrency(0)}
              </p>
              <span className={`text-[10px] font-black uppercase tracking-wider mt-0.5 inline-block ${nextUnpaidInstallment ? 'text-amber-500' : 'text-emerald-500'}`}>
                {nextUnpaidInstallment ? 'Pendente' : 'Quitado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Parcela base</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{formatCurrency(localData.installment_value)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Parcelas totais</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{localData.vehicle_total_installments}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Parcelas pagas</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{paidCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total pago</p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-indigo-500" />
              Dados do Veículo
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modelo do Veículo</label>
                <input
                  type="text"
                  value={localData.vehicle_name}
                  onChange={(e) => updateLocalData({ vehicle_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-bold text-slate-700 transition-all text-sm"
                  placeholder="Ex: Toyota Corolla XEi 2.0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Total Financiado</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="text"
                    value={formatInputDisplay(localData.vehicle_total_value)}
                    onChange={(e) => updateLocalData({ vehicle_total_value: parseCurrencyInput(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parcela Mensal Cheia</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="text"
                    value={formatInputDisplay(localData.installment_value)}
                    onChange={(e) => updateLocalData({ installment_value: parseCurrencyInput(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    value={localData.vehicle_total_installments}
                    onChange={(e) => updateLocalData({ vehicle_total_installments: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={localData.due_day}
                    onChange={(e) => updateLocalData({ due_day: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-200 flex items-center gap-2">
              <Award className="w-4 h-4" /> Amortização e Integração
            </h4>
            <p className="text-xs leading-relaxed text-indigo-100">
              Ao pagar um valor diferente do base ou antecipar parcelas, altere o valor pago diretamente ao lado. O saldo devedor restante recalcula de forma automática.
            </p>
            <p className="text-xs leading-relaxed text-indigo-100 mt-2">
              <strong>Nota:</strong> As parcelas marcadas como pagas são adicionadas automaticamente na sua aba de Despesas do mês de referência atual.
            </p>
          </div>
          
          <button
            onClick={handleSaveVehicleData}
            className="w-full flex justify-center items-center gap-2 py-4 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-md active:scale-[0.98]"
          >
            <CheckCircle2 className="w-5 h-5" />
            Salvar Dados do Veículo
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                Detalhamento de Parcelas & Amortização
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">Controle Manual</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
              {installmentsDetail.map((item) => {
                const isAmortized = item.paid && item.amount !== localData.installment_value;
                return (
                  <div 
                    key={item.number} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-4 ${
                      item.paid 
                        ? isAmortized
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-emerald-50/40 border-emerald-100'
                        : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <input
                        type="checkbox"
                        checked={item.paid}
                        onChange={() => handleTogglePaid(item.number)}
                        className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                      />
                      <div>
                        <span className="font-black text-slate-800 text-sm block">
                          Parcela {item.number}
                          <span className="text-xs font-semibold text-slate-400 ml-2">
                            ({getInstallmentDueDateStr(item.number)})
                          </span>
                        </span>
                        {isAmortized && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block mr-1">
                            Amortizado
                          </span>
                        )}
                        {item.paid && !isAmortized && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block mr-1">
                            Pago
                          </span>
                        )}
                        {item.paid && item.paidMonth && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block">
                            em {item.paidMonth.substring(0, 7)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-400">Valor Pago:</span>
                      <div className="relative w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                        <input
                          type="text"
                          defaultValue={formatInputDisplay(item.amount)}
                          onBlur={(e) => handleAmountChange(item.number, e.target.value)}
                          disabled={!item.paid}
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-bold text-slate-700 text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
