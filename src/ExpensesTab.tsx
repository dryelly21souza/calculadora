import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, 
  Zap, CheckCircle2, 
  Trash2, X, AlertCircle, Edit3, Save, Calendar,
  CreditCard, TrendingDown, Wallet, DollarSign
} from 'lucide-react';
import type { SalaryCalculation } from './hooks/useSalaryHistory';
import { EditableTitle } from './components/EditableTitle';
import { useExpensesData, Expense, FixedBill } from './hooks/useExpensesData';

interface ExpensesTabProps {
  salaryHistory: SalaryCalculation[];
  expensesData: ReturnType<typeof useExpensesData>;
  referenceMonth: string;
  setReferenceMonth: (v: string) => void;
}

const CATEGORY_MAP: Record<string, { type: 'needs' | 'wants', emoji: React.ReactNode }> = {
  'Moradia': { type: 'needs', emoji: '🏠' },
  'Alimentação': { type: 'needs', emoji: '🍔' },
  'Transporte': { type: 'needs', emoji: '🚗' },
  'Contas': { type: 'needs', emoji: '💡' },
  'Educação': { type: 'needs', emoji: '📚' },
  'Dívidas': { type: 'needs', emoji: '💳' },
  'Saúde': { type: 'needs', emoji: '🏥' },
  'Lazer': { type: 'wants', emoji: '🎮' },
  'Compras': { type: 'wants', emoji: '🛍️' },
  'Outros': { type: 'wants', emoji: '📦' }
};

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ 
  salaryHistory, 
  expensesData,
  referenceMonth,
  setReferenceMonth,
}) => {
  const [yearStr, monthStr_raw] = referenceMonth.split('-');
  const year = parseInt(yearStr || '2026');
  const month = parseInt(monthStr_raw || '7') - 1; // 0-indexed month
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

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

  const {
    fixedBills, expenses, initializedMonths, isLoading,
    addExpense, addManyExpenses, updateExpense, deleteExpense, markAllAsPaid, markAllAsPending,
    addFixedBill, updateFixedBill, deleteFixedBill,
    markMonthInitialized
  } = expensesData;

  // Inject fixed bills for the month if not initialized
  useEffect(() => {
    if (!isLoading && !initializedMonths.includes(monthStr)) {
      if (fixedBills.length > 0) {
        const generation: Omit<Expense, 'id'>[] = fixedBills.map(fb => ({
          fixed_bill_id: fb.id,
          name: fb.name,
          amount: fb.amount,
          category: fb.category,
          date_str: `${monthStr}-${String(fb.due_day).padStart(2, '0')}`,
          status: 'pending',
          expense_type: 'fixo',
          payment_period: fb.payment_period || 'mes'
        }));
        addManyExpenses(generation);
      }
      markMonthInitialized(monthStr);
    }
  }, [monthStr, fixedBills, initializedMonths, isLoading, addManyExpenses, markMonthInitialized]);

  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.date_str.startsWith(monthStr)).sort((a, b) => a.date_str.localeCompare(b.date_str));
  }, [expenses, monthStr]);

  const monthHistory = salaryHistory.find(h => h.reference_month === monthStr);
  const DAYCARE_ALLOWANCE = 820.01;
  const incomeQuinzena = monthHistory?.advance_payment || 0;
  const incomeMes = monthHistory ? Math.max(0, monthHistory.second_payment - DAYCARE_ALLOWANCE) : 0;
  const totalBaseIncome = incomeQuinzena + incomeMes;

  // General expenses (non-credit-card)
  const generalExpenses = useMemo(() => monthExpenses.filter(e => e.card_name !== 'credit'), [monthExpenses]);
  // Credit card expenses
  const creditExpenses = useMemo(() => monthExpenses.filter(e => e.card_name === 'credit'), [monthExpenses]);

  const totalGeneralExpenses = useMemo(() => generalExpenses.reduce((acc, e) => acc + e.amount, 0), [generalExpenses]);
  const totalCreditExpenses = useMemo(() => creditExpenses.reduce((acc, e) => acc + e.amount, 0), [creditExpenses]);
  const totalAllExpenses = totalGeneralExpenses + totalCreditExpenses;
  const totalLeft = totalBaseIncome - totalAllExpenses;

  // Credit card specific
  const [creditLimit, setCreditLimit] = useState<number>(2000);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [editLimitVal, setEditLimitVal] = useState('');
  const [billDueDay, setBillDueDay] = useState(5);
  const [billPayDay, setBillPayDay] = useState(25);

  const creditUsed = totalCreditExpenses;
  const creditAvailable = Math.max(0, creditLimit - creditUsed);
  const creditPct = creditLimit > 0 ? Math.min((creditUsed / creditLimit) * 100, 100) : 0;

  const creditInstallments = useMemo(() => creditExpenses.filter(e => e.expense_type === 'variavel' && e.name.includes('/')), [creditExpenses]);
  const creditSingleExpenses = useMemo(() => creditExpenses.filter(e => !e.name.includes('/')), [creditExpenses]);
  const totalInstallments = useMemo(() => creditInstallments.reduce((acc, e) => acc + e.amount, 0), [creditInstallments]);
  const totalSingle = useMemo(() => creditSingleExpenses.reduce((acc, e) => acc + e.amount, 0), [creditSingleExpenses]);

  // Modals
  const [showAddGeneral, setShowAddGeneral] = useState(false);
  const [showCreditDetail, setShowCreditDetail] = useState(false);
  const [showAddCredit, setShowAddCredit] = useState(false);

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editingFixedBillId, setEditingFixedBillId] = useState<string | null>(null);
  const [editFixedAmount, setEditFixedAmount] = useState('');

  // General Expense Form
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCat, setExpCat] = useState('Alimentação');
  const [expDate, setExpDate] = useState(`${monthStr}-${new Date().getDate().toString().padStart(2,'0')}`);
  const [expPeriod, setExpPeriod] = useState<'quinzena' | 'mes'>('mes');
  const [expType, setExpType] = useState<'variavel' | 'fixo' | 'parcelada'>('variavel');
  const [installments, setInstallments] = useState('2');

  const resetForm = () => {
    setExpName(''); setExpAmount(''); setExpType('variavel'); setExpPeriod('mes');
  };

  const handleSaveGeneralExpense = async () => {
    if (!expName || !expAmount) return;
    const value = Number(expAmount.replace(/\D/g, '')) / 100;

    if (expType === 'fixo') {
      const fb: Omit<FixedBill, 'id'> = {
        name: expName, amount: value, category: expCat,
        due_day: parseInt(expDate.split('-')[2] || '15'),
        frequency: 'Mensal', expense_type: 'fixo', payment_period: expPeriod
      };
      const response = await addFixedBill(fb);
      if (response.data) {
        addExpense({
          fixed_bill_id: response.data.id, name: fb.name, amount: fb.amount, category: fb.category,
          date_str: expDate, status: 'pending', expense_type: 'fixo', payment_period: expPeriod
        });
      }
    } else if (expType === 'parcelada') {
      const times = parseInt(installments);
      const instValue = value / times;
      const newExps: Omit<Expense, 'id'>[] = [];
      const parsedDay = parseInt(expDate.split('-')[2] || '15');
      for (let i = 0; i < times; i++) {
        const genDate = new Date(year, month + i, parsedDay);
        const y = genDate.getFullYear();
        const m = String(genDate.getMonth() + 1).padStart(2, '0');
        const d = String(genDate.getDate()).padStart(2, '0');
        newExps.push({
          name: `${expName} (${i + 1}/${times})`, amount: instValue, category: expCat,
          date_str: `${y}-${m}-${d}`, status: 'pending', expense_type: 'variavel', payment_period: expPeriod
        });
      }
      addManyExpenses(newExps);
    } else {
      addExpense({
        name: expName, amount: value, category: expCat,
        date_str: expDate, status: 'paid', expense_type: 'variavel', payment_period: expPeriod
      });
    }
    setShowAddGeneral(false);
    resetForm();
  };

  // Credit Expense Form
  const [creditName, setCreditName] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditCat, setCreditCat] = useState('Compras');
  const [creditDate, setCreditDate] = useState(`${monthStr}-${new Date().getDate().toString().padStart(2,'0')}`);
  const [creditInstType, setCreditInstType] = useState<'avista' | 'parcelada'>('avista');
  const [creditFormInstallments, setCreditFormInstallments] = useState('2');

  const handleSaveCreditExpense = async () => {
    if (!creditName || !creditAmount) return;
    const value = Number(creditAmount.replace(/\D/g, '')) / 100;

    if (creditInstType === 'parcelada') {
      const times = parseInt(creditFormInstallments);
      const instValue = value / times;
      const parsedDay = parseInt(creditDate.split('-')[2] || '15');
      const newExps: Omit<Expense, 'id'>[] = [];
      for (let i = 0; i < times; i++) {
        const genDate = new Date(year, month + i, parsedDay);
        const y = genDate.getFullYear();
        const m = String(genDate.getMonth() + 1).padStart(2, '0');
        const d = String(genDate.getDate()).padStart(2, '0');
        newExps.push({
          name: `${creditName} (${i + 1}/${times})`, amount: instValue, category: creditCat,
          date_str: `${y}-${m}-${d}`, status: 'pending', expense_type: 'variavel',
          payment_period: 'mes', card_name: 'credit'
        });
      }
      addManyExpenses(newExps);
    } else {
      addExpense({
        name: creditName, amount: value, category: creditCat,
        date_str: creditDate, status: 'pending', expense_type: 'variavel',
        payment_period: 'mes', card_name: 'credit'
      });
    }
    setShowAddCredit(false);
    setCreditName(''); setCreditAmount('');
  };

  const handleSaveEditExpense = (id: string) => {
    const value = Number(editExpenseAmount.replace(/\D/g, '')) / 100;
    if (value > 0) updateExpense(id, { amount: value });
    setEditingExpenseId(null);
  };

  const handleSaveEditFixed = (id: string) => {
    const value = Number(editFixedAmount.replace(/\D/g, '')) / 100;
    if (value > 0) updateFixedBill(id, { amount: value });
    setEditingFixedBillId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-24">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Despesas</h2>
          <p className="text-slate-500 font-medium text-sm">Controle seus gastos e acompanhe seu saldo disponível.</p>
        </div>
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

      {!monthHistory && (
        <div className="bg-orange-50 text-orange-800 p-5 rounded-2xl border border-orange-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="font-semibold text-sm">Nenhum cálculo salvo para este mês. Volte ao Dashboard e salve para definir a base de receitas.</p>
        </div>
      )}

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receita Total Disponível</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{fmt(totalBaseIncome)}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Quinzena + Fim do mês</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Despesas</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{fmt(totalAllExpenses)}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Gerais + Cartão de crédito</p>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all ${totalLeft >= 0 ? 'bg-white border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${totalLeft >= 0 ? 'bg-indigo-50' : 'bg-rose-100'}`}>
            <DollarSign className={`w-5 h-5 ${totalLeft >= 0 ? 'text-indigo-600' : 'text-rose-600'}`} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Restante</p>
          <p className={`text-2xl font-black mt-1 ${totalLeft >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>{fmt(totalLeft)}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">{totalLeft >= 0 ? 'Saldo positivo' : 'Saldo negativo'}</p>
        </div>
      </div>

      {/* Main grid: Gastos Gerais + Cartão de Crédito */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Gastos Gerais (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Gastos Gerais
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{generalExpenses.length} registros • {fmt(totalGeneralExpenses)}</p>
            </div>
            <div className="flex items-center gap-2">
              {generalExpenses.length > 0 && generalExpenses.some(e => e.status === 'pending') && (
                <button
                  onClick={() => markAllAsPaid(generalExpenses.filter(e => e.status === 'pending').map(e => e.id))}
                  className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pagar Tudo
                </button>
              )}
              <button
                onClick={() => setShowAddGeneral(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {generalExpenses.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">Nenhum gasto registrado.</div>
            )}
            {generalExpenses.map(e => {
              const isPaid = e.status === 'paid';
              const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
              const [py, pm, pd] = e.date_str.split('-');
              const venc = new Date(parseInt(py), parseInt(pm) - 1, parseInt(pd || '15'));
              const isLate = !isPaid && venc < hoje;

              return (
                <div key={e.id} className={`group p-4 rounded-2xl flex items-center gap-3 transition-all ${isPaid ? 'bg-slate-50 border border-slate-100 opacity-70' : isLate ? 'bg-red-50 border border-red-200' : 'bg-white border border-slate-200 shadow-sm hover:border-indigo-200'}`}>
                  <button
                    onClick={() => updateExpense(e.id, { status: isPaid ? 'pending' : 'paid' })}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isPaid ? 'border-emerald-500 bg-emerald-500 text-white' : isLate ? 'border-red-400 text-red-400' : 'border-slate-300 text-slate-300 hover:border-indigo-400 hover:text-indigo-500'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold text-sm truncate ${isPaid ? 'line-through text-slate-400' : isLate ? 'text-red-800' : 'text-slate-800'}`}>
                        {CATEGORY_MAP[e.category]?.emoji} {e.name}
                      </span>
                      {editingExpenseId === e.id ? (
                        <input
                          autoFocus
                          value={editExpenseAmount}
                          onChange={ev => setEditExpenseAmount(ev.target.value)}
                          onBlur={() => handleSaveEditExpense(e.id)}
                          onKeyDown={ev => { if (ev.key === 'Enter') handleSaveEditExpense(e.id); if (ev.key === 'Escape') setEditingExpenseId(null); }}
                          className="w-24 bg-white border-2 border-indigo-300 text-indigo-900 rounded-lg px-2 py-0.5 outline-none font-bold text-right text-sm"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingExpenseId(e.id); setEditExpenseAmount(e.amount.toFixed(2)); }}
                          className={`font-black text-sm flex items-center gap-1 hover:text-indigo-600 transition-colors ${isLate ? 'text-red-600' : 'text-slate-800'}`}
                        >
                          {fmt(e.amount)} <Edit3 className="w-3 h-3 opacity-50" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">{e.date_str.split('-').reverse().join('/')}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">{e.category}</span>
                      {isLate && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-black">Atrasado</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteExpense(e.id)} className="text-slate-300 hover:text-rose-500 p-1.5 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Cartão de Crédito (1/3) */}
        <div className="space-y-4">
          <button
            onClick={() => setShowCreditDetail(true)}
            className="w-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left relative overflow-hidden"
          >
            {/* Card visual */}
            <div className="absolute top-4 right-4 w-20 h-14 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center">
              <div className="w-10 h-7 bg-amber-400/80 rounded-md" />
            </div>

            <div className="mb-6">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Cartão de Crédito
              </p>
              <p className="text-sm text-indigo-200 font-medium">Acompanhe sua fatura</p>
            </div>

            <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Fatura atual</p>
            <p className="text-3xl font-black mt-1">{fmt(creditUsed)}</p>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-indigo-200 font-bold mb-1">
                <span>{creditPct.toFixed(0)}% do limite utilizado</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${creditPct > 80 ? 'bg-rose-400' : creditPct > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${creditPct}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl">
                <span className="text-xs">📅</span>
                <div>
                  <p className="text-[9px] text-indigo-200 font-bold">Paga em</p>
                  <p className="text-xs font-black">{String(billPayDay).padStart(2,'0')}/{String(month + 1).padStart(2,'0')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl">
                <span className="text-xs">⏰</span>
                <div>
                  <p className="text-[9px] text-indigo-200 font-bold">Vence em</p>
                  <p className="text-xs font-black">{String(billDueDay).padStart(2,'0')}/{String(month + 2 > 12 ? 1 : month + 2).padStart(2,'0')}</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-indigo-200/60 mt-4 text-center">Clique para ver detalhes →</p>
          </button>

          {/* Quick stats below card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">À vista</p>
              <p className="font-black text-slate-800 text-sm mt-1">{fmt(totalSingle)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Parceladas</p>
              <p className="font-black text-slate-800 text-sm mt-1">{fmt(totalInstallments)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Disponível</p>
              <p className={`font-black text-sm mt-1 ${creditAvailable < creditLimit * 0.2 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(creditAvailable)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Card Detail Drawer/Modal */}
      {showCreditDetail && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="w-full max-w-2xl h-full bg-white flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <CreditCard className="w-6 h-6" /> Cartão de Crédito
                  </h3>
                  <p className="text-indigo-200 text-sm mt-0.5">Acompanhe sua fatura e tenha controle total dos seus gastos.</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Month selector */}
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                    <button onClick={prevMonth} className="text-white/80 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm font-bold">{monthNames[month]}/{year}</span>
                    <button onClick={nextMonth} className="text-white/80 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => setShowCreditDetail(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Fatura atual + Card visual */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Fatura atual</p>
                  <p className="text-4xl font-black mt-1">{fmt(creditUsed)}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-indigo-200 font-bold mb-1">
                      <span>{creditPct.toFixed(0)}% do limite utilizado</span>
                      <button
                        onClick={() => { setIsEditingLimit(true); setEditLimitVal(creditLimit.toString()); }}
                        className="text-indigo-200 hover:text-white underline underline-offset-2"
                      >
                        Limite: {fmt(creditLimit)}
                      </button>
                    </div>
                    <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${creditPct > 80 ? 'bg-rose-400' : creditPct > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${creditPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card art */}
                <div className="w-36 h-24 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center relative overflow-hidden ml-4 flex-shrink-0">
                  <div className="w-16 h-11 bg-amber-400/70 rounded-lg" />
                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/10 border border-white/20" />
                  <div className="absolute bottom-3 right-8 w-8 h-8 rounded-full bg-white/10 border border-white/20" />
                </div>
              </div>

              {/* Due dates */}
              <div className="flex gap-3 mt-5">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-base">📅</span>
                  <div>
                    <p className="text-[9px] text-indigo-200 font-bold uppercase">Paga em</p>
                    <p className="text-sm font-black">{String(billPayDay).padStart(2,'0')}/{String(month + 1).padStart(2,'0')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-base">⏰</span>
                  <div>
                    <p className="text-[9px] text-indigo-200 font-bold uppercase">Vence em</p>
                    <p className="text-sm font-black">{String(billDueDay).padStart(2,'0')}/{String(month + 2 > 12 ? 1 : month + 2).padStart(2,'0')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit limit inline */}
            {isEditingLimit && (
              <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider whitespace-nowrap">Novo Limite:</label>
                <input
                  autoFocus
                  type="number"
                  value={editLimitVal}
                  onChange={e => setEditLimitVal(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg font-bold text-indigo-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={() => { setCreditLimit(Number(editLimitVal)); setIsEditingLimit(false); }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg">Salvar</button>
                <button onClick={() => setIsEditingLimit(false)} className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg">Cancelar</button>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-0 border-b border-slate-100">
              <div className="p-5 border-r border-slate-100 text-center">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-base">🛍️</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Compras à vista</p>
                <p className="font-black text-slate-800 text-base mt-0.5">{fmt(totalSingle)}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">À vista</p>
              </div>
              <div className="p-5 border-r border-slate-100 text-center">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-base">📋</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Parceladas</p>
                <p className="font-black text-slate-800 text-base mt-0.5">{fmt(totalInstallments)}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Em aberto</p>
              </div>
              <div className="p-5 text-center">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-base">💳</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Limite disponível</p>
                <p className={`font-black text-base mt-0.5 ${creditAvailable < creditLimit * 0.2 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(creditAvailable)}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{(100 - creditPct).toFixed(0)}% do limite</p>
              </div>
            </div>

            {/* Expenses list */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-black text-slate-800">Lançamentos do Cartão</h4>
                <button
                  onClick={() => setShowAddCredit(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              <div className="p-4 space-y-2">
                {creditExpenses.length === 0 && (
                  <div className="text-center py-10 text-slate-400 font-medium">Nenhum lançamento no cartão.</div>
                )}
                {creditExpenses.map(e => (
                  <div key={e.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3 hover:border-indigo-200 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-base">{CATEGORY_MAP[e.category]?.emoji || '📦'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{e.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{e.date_str.split('-').reverse().join('/')}</span>
                        {e.name.includes('/') && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">Parcela</span>}
                      </div>
                    </div>
                    <p className="font-black text-slate-800 text-sm">{fmt(e.amount)}</p>
                    <button onClick={() => deleteExpense(e.id)} className="text-slate-300 hover:text-rose-500 p-1.5 transition-colors ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add General Expense */}
      {showAddGeneral && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">Novo Gasto Geral</h3>
              <button onClick={() => { setShowAddGeneral(false); resetForm(); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setExpType('variavel')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${expType === 'variavel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Avulso</button>
                <button onClick={() => setExpType('parcelada')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${expType === 'parcelada' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Parcelado</button>
                <button onClick={() => setExpType('fixo')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${expType === 'fixo' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500'}`}>Fixo Mensal</button>
              </div>



              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Descrição</label>
                <input value={expName} onChange={e => setExpName(e.target.value)} placeholder="Ex: Mercado, Luz..." className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-medium outline-none focus:border-indigo-500 transition-colors mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">{expType === 'parcelada' ? 'Valor Total' : 'Valor'}</label>
                  <input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0,00" inputMode="numeric" className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-black outline-none focus:border-indigo-500 transition-colors mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Categoria</label>
                  <select value={expCat} onChange={e => setExpCat(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-medium outline-none focus:border-indigo-500 transition-colors mt-1 appearance-none">
                    {Object.keys(CATEGORY_MAP).map(c => <option key={c} value={c}>{CATEGORY_MAP[c].emoji as string} {c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Data</label>
                  <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-colors mt-1" />
                </div>
                {expType === 'parcelada' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Parcelas</label>
                    <select value={installments} onChange={e => setInstallments(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-colors mt-1 appearance-none">
                      {[2,3,4,5,6,7,8,9,10,11,12,24].map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>
                )}
              </div>

              <button onClick={handleSaveGeneralExpense} className={`w-full font-bold py-4 rounded-2xl uppercase tracking-widest text-sm text-white transition-colors ${expType === 'fixo' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {expType === 'fixo' ? 'Salvar Conta Fixa' : expType === 'parcelada' ? 'Criar Parcelamento' : 'Registrar Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Credit Card Expense */}
      {showAddCredit && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> Gasto no Cartão
              </h3>
              <button onClick={() => setShowAddCredit(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setCreditInstType('avista')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${creditInstType === 'avista' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>À Vista</button>
                <button onClick={() => setCreditInstType('parcelada')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${creditInstType === 'parcelada' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Parcelado</button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Descrição</label>
                <input value={creditName} onChange={e => setCreditName(e.target.value)} placeholder="Ex: Amazon, Restaurante..." className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-medium outline-none focus:border-indigo-500 mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">{creditInstType === 'parcelada' ? 'Valor Total' : 'Valor'}</label>
                  <input value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="0,00" inputMode="numeric" className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-black outline-none focus:border-indigo-500 mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Categoria</label>
                  <select value={creditCat} onChange={e => setCreditCat(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-medium outline-none focus:border-indigo-500 mt-1 appearance-none">
                    {Object.keys(CATEGORY_MAP).map(c => <option key={c} value={c}>{CATEGORY_MAP[c].emoji as string} {c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Data</label>
                  <input type="date" value={creditDate} onChange={e => setCreditDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold outline-none focus:border-indigo-500 mt-1" />
                </div>
                {creditInstType === 'parcelada' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Parcelas</label>
                    <select value={creditFormInstallments} onChange={e => setCreditFormInstallments(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold outline-none focus:border-indigo-500 mt-1 appearance-none">
                      {[2,3,4,5,6,7,8,9,10,11,12,24].map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>
                )}
              </div>

              <button onClick={handleSaveCreditExpense} className="w-full font-bold py-4 rounded-2xl uppercase tracking-widest text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                Adicionar ao Cartão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
