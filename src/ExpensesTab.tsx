import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Home, Car, Utensils, 
  Gamepad2, Zap, Smartphone, CreditCard, CheckCircle2, 
  Trash2, X, AlertCircle, BookOpen, Edit3, Save, Calendar
} from 'lucide-react';
import type { SalaryCalculation } from './hooks/useSalaryHistory';
import { EditableTitle } from './components/EditableTitle';
import { useExpensesData, Expense, FixedBill } from './hooks/useExpensesData';

interface ExpensesTabProps {
  salaryHistory: SalaryCalculation[];
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

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ salaryHistory }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const {
    fixedBills, expenses, initializedMonths, isLoading,
    addExpense, addManyExpenses, updateExpense, deleteExpense, markAllAsPaid,
    addFixedBill, updateFixedBill, deleteFixedBill,
    markMonthInitialized
  } = useExpensesData();

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
    return expenses.filter(e => e.date_str.startsWith(monthStr)).sort((a,b) => a.date_str.localeCompare(b.date_str));
  }, [expenses, monthStr]);

  const monthHistory = salaryHistory.find(h => h.reference_month === monthStr);
  
  // Base values without Daycare (820.01)
  const DAYCARE_ALLOWANCE = 820.01;
  const incomeQuinzena = monthHistory?.advance_payment || 0;
  const incomeMes = monthHistory ? Math.max(0, monthHistory.second_payment - DAYCARE_ALLOWANCE) : 0;
  const totalBaseIncome = incomeQuinzena + incomeMes;

  const expensesQuinzena = monthExpenses.filter(e => e.payment_period === 'quinzena');
  const expensesMes = monthExpenses.filter(e => e.payment_period === 'mes' || !e.payment_period); // default to mes if missing

  const spentQuinzena = expensesQuinzena.reduce((acc, curr) => acc + curr.amount, 0);
  const spentMes = expensesMes.reduce((acc, curr) => acc + curr.amount, 0);

  const leftQuinzena = incomeQuinzena - spentQuinzena;
  const leftMes = incomeMes - spentMes;
  const totalLeft = totalBaseIncome - (spentQuinzena + spentMes);

  const totalPaidThisMonth = monthExpenses.filter(e => e.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBankBalance = totalBaseIncome - totalPaidThisMonth;

  const totalFixedBills = fixedBills.reduce((acc, curr) => acc + curr.amount, 0);

  // Modals state
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingFixedBillId, setEditingFixedBillId] = useState<string | null>(null);
  const [editFixedAmount, setEditFixedAmount] = useState('');

  // Form State
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCat, setExpCat] = useState('Alimentação');
  const [expDate, setExpDate] = useState(`${monthStr}-15`);
  const [expPeriod, setExpPeriod] = useState<'quinzena' | 'mes'>('mes');
  const [expType, setExpType] = useState<'variavel' | 'fixo' | 'parcelada'>('variavel');
  const [installments, setInstallments] = useState('2');

  const handleSaveExpense = async () => {
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

    setIsAddingExpense(false);
    resetForm();
  };

  const resetForm = () => {
    setExpName(''); setExpAmount(''); setExpType('variavel'); setExpPeriod('mes');
  };

  const handleSaveEditFixed = (id: string) => {
    const value = Number(editFixedAmount.replace(/\D/g, '')) / 100;
    if (value > 0) {
      updateFixedBill(id, { amount: value });
    }
    setEditingFixedBillId(null);
  };

  const renderExpenseList = (list: Expense[], title: string, income: number, left: number) => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-6">
      <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50">
        <div>
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500"/> {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Receita: <strong className="text-emerald-600">R$ {income.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong> • 
            Sobra: <strong className={left >= 0 ? 'text-indigo-600' : 'text-red-500'}>R$ {left.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {list.some(e => e.status === 'pending') && (
            <button 
              onClick={() => markAllAsPaid(list.filter(e => e.status === 'pending').map(e => e.id))}
              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" /> Pagar Tudo
            </button>
          )}
          <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            {list.length} Gastos
          </span>
        </div>
      </div>
      
      <div className="p-4 flex-1 space-y-3">
        {list.length === 0 && (
          <div className="text-center py-8 text-slate-400 font-medium">Nenhum gasto registrado.</div>
        )}
        
        {list.map(e => {
          const isFixed = e.expense_type === 'fixo' || !!e.fixed_bill_id;
          const isPaid = e.status === 'paid';
          const hoje = new Date();
          hoje.setHours(0,0,0,0);
          const parts = e.date_str.split('-');
          const vencimento = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2] || '15'));
          const isLate = !isPaid && vencimento < hoje;

          return (
            <div key={e.id} className={`p-4 rounded-2xl flex flex-wrap gap-4 items-center transition-all ${isPaid ? 'bg-slate-50 border border-slate-100 opacity-75' : isLate ? 'bg-red-50/50 border border-red-200 shadow-sm' : 'bg-white border border-slate-200 shadow-sm'}`}>
              <button 
                onClick={() => updateExpense(e.id, { status: isPaid ? 'pending' : 'paid' })} 
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isPaid ? 'border-green-500 bg-green-500 text-white' : isLate ? 'border-red-400 text-red-500 hover:bg-red-100' : 'border-slate-300 text-slate-300 hover:border-indigo-400 hover:text-indigo-500'}`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
              
              <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between items-start">
                  <EditableTitle 
                    defaultText={e.name}
                    icon={CATEGORY_MAP[e.category]?.emoji || '📦'}
                    onSaveValue={(val) => updateExpense(e.id, { name: val })}
                    className={`font-bold text-sm ${isPaid ? 'text-slate-500 line-through' : isLate ? 'text-red-800' : 'text-slate-800'}`}
                  />
                  <div className={`font-black ${isLate ? 'text-red-600' : 'text-slate-800'}`}>
                    R$ {e.amount.toLocaleString('pt-BR', {minimumFractionDigits:2})}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-[10px] flex-wrap">
                  <span className={`${isLate ? 'text-red-500 font-black uppercase' : 'text-slate-500 font-medium'}`}>
                    {isLate ? 'Atrasado' : 'Data:'} {e.date_str.split('-').reverse().join('/')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-bold uppercase bg-slate-100 text-slate-600">
                    {e.category}
                  </span>
                  {isFixed && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-bold uppercase">Fixo</span>}
                </div>
              </div>
              
              <button onClick={() => deleteExpense(e.id)} className="text-slate-300 hover:text-red-500 p-2">
                <Trash2 className="w-5 h-5"/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* HEADER: Month Navigation */}
      <div className="flex justify-between items-center bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 ml-4 hidden sm:block">Painel de Gastos</h2>
        <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 mx-auto sm:mx-0">
          <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl text-slate-600 shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
          <span className="w-32 text-center font-bold text-slate-700 uppercase tracking-widest text-sm">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl text-slate-600 shadow-sm"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {!monthHistory && (
        <div className="bg-orange-50 text-orange-800 p-6 rounded-3xl border border-orange-200 shadow-sm flex items-start gap-4">
          <AlertCircle className="w-6 h-6 mt-1 shrink-0" />
          <p className="font-semibold text-sm">Nenhum cálculo salvo para este mês no Dashboard. Volte lá e salve para definir a base de receitas (sem creche).</p>
        </div>
      )}

      {/* DASHBOARD WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Resumo Total */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">Base Total (Sem Creche)</p>
            <h3 className="text-2xl font-black mb-4">R$ {totalBaseIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-1">Sobra Livre (Estimada)</p>
                <h3 className={`text-xl font-black ${totalLeft < 0 ? 'text-red-400' : 'text-indigo-400'}`}>
                  R$ {totalLeft.toLocaleString('pt-BR', {minimumFractionDigits:2})}
                </h3>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-1">Saldo Atual em Conta</p>
                <h3 className={`text-xl font-black ${currentBankBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  R$ {currentBankBalance.toLocaleString('pt-BR', {minimumFractionDigits:2})}
                </h3>
              </div>
            </div>
          </div>
          <Zap className="absolute bottom-4 right-4 w-24 h-24 text-white/5" />
        </div>

        {/* Card 2: Quinzena */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">Adiantamento (Quinzena)</p>
            <h3 className="text-xl font-bold text-slate-800 mb-4">R$ {incomeQuinzena.toLocaleString('pt-BR', {minimumFractionDigits:2})}</h3>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Gastos Quinzena:</span>
              <span className="font-bold text-red-500">- R$ {spentQuinzena.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-bold">Sobra:</span>
              <span className={`font-black ${leftQuinzena < 0 ? 'text-red-500' : 'text-indigo-600'}`}>R$ {leftQuinzena.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Fim do Mês */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">Pagamento (Fim do Mês)</p>
            <h3 className="text-xl font-bold text-slate-800 mb-4">R$ {incomeMes.toLocaleString('pt-BR', {minimumFractionDigits:2})}</h3>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Gastos Mês:</span>
              <span className="font-bold text-red-500">- R$ {spentMes.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-bold">Sobra:</span>
              <span className={`font-black ${leftMes < 0 ? 'text-red-500' : 'text-indigo-600'}`}>R$ {leftMes.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LISTAS DE GASTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderExpenseList(expensesQuinzena, "Gastos da Quinzena", incomeQuinzena, leftQuinzena)}
        {renderExpenseList(expensesMes, "Gastos do Fim do Mês", incomeMes, leftMes)}
      </div>

      {/* GERENCIADOR DE CONTAS FIXAS */}
      <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden text-slate-300 mt-8">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h3 className="font-black text-white text-xl flex items-center gap-2"><Zap className="text-orange-400"/> Contas Fixas</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Geradas automaticamente todo mês e deduzidas da base.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Total Fixo Mensal</p>
            <p className="text-xl font-black text-orange-400">R$ {totalFixedBills.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {fixedBills.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500 font-medium">Nenhuma conta fixa cadastrada.</div>
          )}
          {fixedBills.map(fb => (
            <div key={fb.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_MAP[fb.category]?.emoji}</span>
                  <div>
                    <h4 className="font-bold text-white text-lg">{fb.name}</h4>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Dia {fb.due_day} • {fb.payment_period === 'quinzena' ? 'Quinzena' : 'Fim do Mês'}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteFixedBill(fb.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4"/></button>
              </div>
              
              {editingFixedBillId === fb.id ? (
                <div className="flex gap-2 mt-2">
                  <input 
                    autoFocus
                    value={editFixedAmount}
                    onChange={e => setEditFixedAmount(e.target.value)}
                    placeholder="Novo valor..."
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500"
                  />
                  <button onClick={() => handleSaveEditFixed(fb.id)} className="bg-emerald-500 text-white px-3 rounded-lg"><Save className="w-4 h-4"/></button>
                  <button onClick={() => setEditingFixedBillId(null)} className="bg-slate-700 text-white px-3 rounded-lg"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-700/50">
                  <span className="font-black text-xl text-white">R$ {fb.amount.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                  <button 
                    onClick={() => { setEditingFixedBillId(fb.id); setEditFixedAmount(fb.amount.toFixed(2)); }}
                    className="text-xs flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    <Edit3 className="w-3 h-3"/> Editar Valor
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAB: Add Expense */}
      <button 
        onClick={() => setIsAddingExpense(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] flex items-center justify-center transition-transform hover:scale-110 z-30 border-4 border-slate-50"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* MODAL: Add Expense / Fixed Bill */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[95vh] overflow-y-auto">
            <button onClick={() => setIsAddingExpense(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
            <h3 className="text-2xl font-black text-slate-800 mb-6">Novo Registro</h3>
            
            <div className="space-y-5">
              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setExpType('variavel')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${expType === 'variavel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Avulso</button>
                <button onClick={() => setExpType('parcelada')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${expType === 'parcelada' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Parcelado</button>
                <button onClick={() => setExpType('fixo')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${expType === 'fixo' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Fixo (Mensal)</button>
              </div>

              {/* Period Switcher */}
              <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl">
                <button onClick={() => setExpPeriod('quinzena')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${expPeriod === 'quinzena' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>Deduzir da Quinzena</button>
                <button onClick={() => setExpPeriod('mes')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${expPeriod === 'mes' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>Deduzir do Fim do Mês</button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Descrição</label>
                <input value={expName} onChange={e=>setExpName(e.target.value)} placeholder="Ex: Mercado, Luz..." className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-medium outline-none focus:border-indigo-500 transition-colors mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">
                    {expType === 'parcelada' ? 'Valor Total R$' : 'Valor R$'}
                  </label>
                  <input value={expAmount} onChange={e=>setExpAmount(e.target.value)} placeholder="0,00" inputMode="numeric" className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-black text-slate-800 outline-none focus:border-indigo-500 transition-colors mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Categoria</label>
                  <select value={expCat} onChange={e=>setExpCat(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors mt-1 appearance-none">
                    {Object.keys(CATEGORY_MAP).map(c => <option key={c} value={c}>{CATEGORY_MAP[c].emoji} {c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Data / Vencimento</label>
                  <input type="date" value={expDate} onChange={e=>setExpDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors mt-1" />
                </div>
                {expType === 'parcelada' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Parcelas</label>
                    <select value={installments} onChange={e=>setInstallments(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors mt-1 appearance-none">
                      {[2,3,4,5,6,7,8,9,10,11,12,24].map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>
                )}
              </div>

              <button 
                onClick={handleSaveExpense} 
                className={`w-full font-bold py-4 rounded-2xl uppercase tracking-widest text-sm shadow-md transition-colors mt-4 text-white ${expType === 'fixo' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-900 hover:bg-indigo-600'}`}
              >
                {expType === 'fixo' ? 'Salvar Conta Fixa' : expType === 'parcelada' ? 'Criar Parcelamento' : 'Registrar Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
