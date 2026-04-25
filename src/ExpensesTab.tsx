import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Home, Car, Utensils, 
  Gamepad2, Zap, Smartphone, CreditCard, Stethoscope, CheckCircle2, 
  Circle, Trash2, X, AlertCircle
} from 'lucide-react';
import type { SalaryCalculation } from './hooks/useSalaryHistory';
import { EditableTitle } from './components/EditableTitle';

import { useExpensesData, Expense, FixedBill } from './hooks/useExpensesData';

interface ExpensesTabProps {
  salaryHistory: SalaryCalculation[];
}

const CATEGORY_MAP: Record<string, { icon: React.ReactNode, type: 'needs' | 'wants', emoji: React.ReactNode }> = {
  Moradia: { icon: <Home className="w-4 h-4" />, type: 'needs', emoji: '🏠' },
  Alimentação: { icon: <Utensils className="w-4 h-4" />, type: 'needs', emoji: '🍔' },
  Transporte: { icon: <Car className="w-4 h-4" />, type: 'needs', emoji: '🚗' },
  Serviços: { icon: <Zap className="w-4 h-4" />, type: 'needs', emoji: '⚡' },
  Saúde: { icon: <Stethoscope className="w-4 h-4" />, type: 'needs', emoji: '🏥' },
  Financeiro: { icon: <CreditCard className="w-4 h-4" />, type: 'needs', emoji: '💳' },
  Lazer: { icon: <Gamepad2 className="w-4 h-4" />, type: 'wants', emoji: '🎮' },
  Compras: { icon: <Smartphone className="w-4 h-4" />, type: 'wants', emoji: '🛍️' },
  Streaming: { icon: <Zap className="w-4 h-4" />, type: 'wants', emoji: '📺' },
  Outros: { icon: <Plus className="w-4 h-4" />, type: 'wants', emoji: '📦' }
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ salaryHistory }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- Cloud Storage Hooks ---
  const {
    fixedBills, expenses, savedBalanceMap, initializedMonths, isLoading,
    addExpense, addManyExpenses, updateExpense, deleteExpense,
    addFixedBill, updateFixedBill, deleteFixedBill,
    updateSavedBalance, markMonthInitialized,
    setExpenses // for manual local optimistic UI
  } = useExpensesData();

  // --- Core Autopilot Injection ---
  useEffect(() => {
    if (!isLoading && !initializedMonths.includes(monthStr)) {
      // Inject fixed bills for this month if not empty
      if (fixedBills.length > 0) {
        const generation: Omit<Expense, 'id'>[] = fixedBills.map(fb => ({
          fixed_bill_id: fb.id,
          name: fb.name,
          amount: fb.amount,
          category: fb.category,
          date_str: `${monthStr}-${String(fb.due_day).padStart(2, '0')}`,
          status: 'pending' // Defaults to un-paid!
        }));
        
        addManyExpenses(generation);
      }
      markMonthInitialized(monthStr);
    }
  }, [monthStr, fixedBills, initializedMonths, isLoading]);

  // --- Filtering & Calculus ---
  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.date_str.startsWith(monthStr)).sort((a,b) => a.date_str.localeCompare(b.date_str));
  }, [expenses, monthStr]);

  const monthHistory = salaryHistory.find(h => h.reference_month === monthStr);
  const netSalary = monthHistory?.net_salary || 0; // The Limit!

  const totalSpent = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = monthExpenses.filter(e => e.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalFixedPending = monthExpenses.filter(e => !!e.fixed_bill_id && e.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

  const currentSaved = savedBalanceMap[monthStr] || 0;
  const realFreeMoney = netSalary - totalSpent - currentSaved; 

  // Segregation 50-30
  const totalNeeds = monthExpenses.filter(e => CATEGORY_MAP[e.category]?.type === 'needs').reduce((acc, curr) => acc + curr.amount, 0);
  const totalWants = monthExpenses.filter(e => CATEGORY_MAP[e.category]?.type === 'wants').reduce((acc, curr) => acc + curr.amount, 0);
  
  const limitNeeds = netSalary * 0.50;
  const limitWants = netSalary * 0.30;
  
  const pctNeeds = netSalary > 0 ? Math.min((totalNeeds / limitNeeds) * 100, 100) : 0;
  const pctWants = netSalary > 0 ? Math.min((totalWants / limitWants) * 100, 100) : 0;

  // --- UI Modals ---
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isAddingFixed, setIsAddingFixed] = useState(false);

  // New Expense form
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCat, setNewExpCat] = useState('Alimentação');
  const [newExpDate, setNewExpDate] = useState(`${monthStr}-15`);
  const [expenseType, setExpenseType] = useState<'unica' | 'parcelada'>('unica');
  const [installmentsCount, setInstallmentsCount] = useState('2');
  const [expenseCard, setExpenseCard] = useState('');
  const [expenseDueDay, setExpenseDueDay] = useState('15');

  // New Fixed form
  const [newFixName, setNewFixName] = useState('');
  const [newFixAmount, setNewFixAmount] = useState('');
  const [newFixCat, setNewFixCat] = useState('Moradia');
  const [newFixDay, setNewFixDay] = useState('5');

  const handleAddExpense = () => {
    if (!newExpTitle || !newExpAmount) return;
    const value = Number(newExpAmount.replace(/\D/g, '')) / 100;
    
    if (expenseType === 'unica') {
      const expense: Omit<Expense, 'id'> = {
        name: newExpTitle,
        amount: value,
        category: newExpCat,
        date_str: newExpDate,
        status: 'paid', // avulso is paid instantly
        card_name: expenseCard.trim() || undefined
      };
      addExpense(expense);
    } else {
      const times = parseInt(installmentsCount);
      const installmentValue = value / times;
      const newExpenses: Omit<Expense, 'id'>[] = [];
      
      const parsedDay = parseInt(expenseDueDay) || 15;
      
      for (let i = 0; i < times; i++) {
        // Here we do month + i correctly
        const genDate = new Date(year, month + i, parsedDay);
        const y = genDate.getFullYear();
        const m = String(genDate.getMonth() + 1).padStart(2, '0');
        const d = String(genDate.getDate()).padStart(2, '0');
        
        newExpenses.push({
          name: `${newExpTitle} (${i + 1}/${times})`,
          amount: installmentValue,
          category: newExpCat,
          date_str: `${y}-${m}-${d}`,
          status: 'pending', // Parcels default to pending
          card_name: expenseCard.trim() || undefined
        });
      }
      addManyExpenses(newExpenses);
    }

    setIsAddingExpense(false);
    setNewExpTitle(''); setNewExpAmount('');
    setExpenseType('unica'); setInstallmentsCount('2');
    setExpenseCard(''); setExpenseDueDay('15');
  };

  const handleAddFixed = async () => {
    if (!newFixName || !newFixAmount) return;
    const value = Number(newFixAmount.replace(/\D/g, '')) / 100;
    const fb: Omit<FixedBill, 'id'> = {
      name: newFixName,
      amount: value,
      category: newFixCat,
      due_day: parseInt(newFixDay),
      frequency: 'Mensal'
    };
    const response = await addFixedBill(fb);
    setIsAddingFixed(false);
    
    // Also inject it directly into the CURRENT month so they see it instantly!
    if (response.data) {
      addExpense({
        fixed_bill_id: response.data.id, name: fb.name, amount: fb.amount, category: fb.category,
        date_str: `${monthStr}-${String(fb.due_day).padStart(2, '0')}`,
        status: 'pending'
      });
    }
    
    setNewFixName(''); setNewFixAmount('');
  };

  const toggleExpenseStatusLocal = (id: string, currentStatus: string) => {
    updateExpense(id, { status: currentStatus === 'paid' ? 'pending' : 'paid' });
  };

  const deleteExpenseLocal = (id: string, isFixedRoot = false) => {
    if (isFixedRoot) {
      if (confirm('Deletar essa Conta Fixa? Ela não será gerada nos próximos meses!')) {
        deleteFixedBill(id);
      }
    } else {
      deleteExpense(id);
    }
  };

  const isWarningNeeds = pctNeeds > 90;
  const isWarningWants = pctWants > 90;

  const updateExpenseNameLocal = (id: string, newName: string) => {
    updateExpense(id, { name: newName });
  };
  const updateFixedBillNameLocal = (id: string, newName: string) => {
    updateFixedBill(id, { name: newName });
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300 relative">
      
      {/* Month Navigation */}
      <div className="flex justify-between items-center bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 ml-4">Controle de Gastos</h2>
        <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl text-slate-600 transition-colors shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="w-32 text-center font-bold text-slate-700 uppercase tracking-widest text-sm">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl text-slate-600 transition-colors shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {netSalary === 0 && (
        <div className="bg-orange-50 text-orange-800 p-6 rounded-3xl border border-orange-200 shadow-sm flex items-start gap-4">
          <AlertCircle className="w-6 h-6 mt-1 flex-shrink-0" />
          <p className="font-semibold">Nenhum cálculo salvo para este mês no Dashboard. Volte na primeira guia e crie o cálculo deste mês para ancorar o seu Teto de Gastos desta aba.</p>
        </div>
      )}

      {/* BLOCO 1: VISÃO DE CHOQUE E TERMÔMETROS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
          
          <p className="text-indigo-200 uppercase tracking-widest text-xs font-bold mb-1">Depois das contas geradas:</p>
          <h3 className="text-4xl font-black mb-6">
            R$ {Math.max(0, realFreeMoney).toLocaleString('pt-BR', {minimumFractionDigits:2})}
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-slate-300 text-sm">Salário do Mês</span>
              <span className="font-bold">R$ {netSalary.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-slate-300 text-sm flex items-center gap-2">
                Saldo Guardado/Meta
              </span>
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 focus-within:border-emerald-400 focus-within:bg-white/20 transition-all">
                <span className="text-emerald-300 font-bold text-xs uppercase tracking-widest">R$</span>
                <input 
                  type="number"
                  value={currentSaved || ''}
                  onChange={e => setExpenses(prev => prev)} /* hack to allow react not complaining? No, we have updateSavedBalance */
                  onBlur={e => updateSavedBalance(monthStr, Number(e.target.value))}
                  placeholder="0,00"
                  className="bg-transparent text-emerald-300 font-black outline-none w-24 text-right placeholder-emerald-300/30"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-slate-300 text-sm">Total Comprometido (Gastos)</span>
              <span className="font-bold text-red-300">R$ {totalSpent.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Contas Pendentes Hoje</span>
              <span className="font-bold text-orange-300">R$ {totalFixedPending.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Termometro 50% (Necessidades) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-400" /> Necessidades Físicas (50%)
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1">Moradia, Alimentação, Saúde, Contas Fixas</p>
              </div>
              <div className="text-right">
                <p className={`font-black ${isWarningNeeds ? 'text-red-500' : 'text-slate-700'}`}>R$ {totalNeeds.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-slate-400">de limite R$ {limitNeeds.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isWarningNeeds ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${pctNeeds}%` }}
              ></div>
            </div>
          </div>

          {/* Termometro 30% (Desejos) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-slate-400" /> Desejos & Lazer (30%)
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1">iFood, Jogos, Roupas, Acréscimos</p>
              </div>
              <div className="text-right">
                <p className={`font-black ${isWarningWants ? 'text-red-500' : 'text-slate-700'}`}>R$ {totalWants.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-slate-400">de limite R$ {limitWants.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isWarningWants ? 'bg-red-500' : 'bg-purple-500'}`}
                style={{ width: `${pctWants}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2 & 3: HISTÓRICO DE LANÇAMENTOS E FIXED BILLS CADASTRO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Timeline do Mês */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-slate-800 text-lg">Linha do Tempo ({monthNames[month]})</h3>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{monthExpenses.length} Gastos</span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50">
            {monthExpenses.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">Nenhum gasto neste mês.</div>
            )}
            
            {monthExpenses.map(e => {
              const isFixed = !!e.fixed_bill_id;
              const isPaid = e.status === 'paid';
              
              // Verifica se a data atual 'hoje' já é maior que a data de vencimento desta conta (se ela estiver pendente)
              const hoje = new Date();
              // zera o horario pra comparar só os dias
              hoje.setHours(0,0,0,0);
              // Puxamos a data de vencimento que está no form yyyy-mm-dd e injeta h local
              const parts = e.date_str.split('-');
              const vencimento = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2] || '15'));
              
              const isLate = !isPaid && vencimento < hoje;

              return (
                <div key={e.id} className={`p-4 rounded-2xl flex items-center gap-4 transition-all ${isPaid ? 'bg-white border border-slate-100 opacity-70' : isLate ? 'bg-red-50/50 border border-red-200 border-l-4 border-l-red-500 shadow-sm' : 'bg-white border-l-4 border-l-orange-400 shadow-sm'}`}>
                  <button onClick={() => toggleExpenseStatusLocal(e.id, e.status)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${isPaid ? 'border-green-500 bg-green-500 text-white' : isLate ? 'border-red-400 text-transparent hover:border-red-500 hover:text-red-500' : 'border-slate-300 text-transparent hover:border-orange-400'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <EditableTitle 
                        defaultText={e.name}
                        icon={CATEGORY_MAP[e.category]?.emoji}
                        onSaveValue={(val) => updateExpenseNameLocal(e.id, val)}
                        className={`font-bold ${isPaid ? 'text-slate-500 line-through' : isLate ? 'text-red-800' : 'text-slate-800'}`}
                      />
                      <div className={`font-black ${isLate ? 'text-red-600' : 'text-slate-700'}`}>R$ {e.amount.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] flex-wrap">
                      <span className={`${isLate ? 'text-red-500 font-black tracking-widest uppercase' : 'text-slate-400 font-medium'}`}>
                        {isLate ? 'Atrasado' : 'Venc.'} {e.date_str.split('-')[2]}/{e.date_str.split('-')[1]}
                      </span>
                      
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${CATEGORY_MAP[e.category]?.type === 'needs' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {e.category}
                      </span>
                      
                      {e.card_name && (
                        <span className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 shadow-sm">
                          <CreditCard className="w-3 h-3 text-slate-300" /> {e.card_name}
                        </span>
                      )}
                      
                      {isFixed && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase">Automático</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteExpenseLocal(e.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4"/></button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gerenciador de Contas Fixas */}
        <div className="bg-slate-900 rounded-3xl shadow-lg border border-slate-800 overflow-hidden text-slate-300 flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <div>
              <h3 className="font-black text-white text-lg flex items-center gap-2"><Zap className="text-orange-400"/> Robô de Contas Fixas</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Esse painel recria as assinaturas todo dia 1</p>
            </div>
            <button onClick={() => setIsAddingFixed(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl border border-indigo-500/50 shadow-lg shadow-indigo-900/30">
              <Plus className="w-5 h-5"/>
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {fixedBills.length === 0 && (
              <div className="text-center py-12 text-slate-500 font-medium border-2 border-dashed border-slate-800 rounded-2xl m-4">Sem boletos automáticos.</div>
            )}
            
            {fixedBills.map(fb => (
              <div key={fb.id} className="bg-slate-800 p-4 rounded-2xl flex items-center justify-between border border-slate-700">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-lg shadow-inner">
                    {CATEGORY_MAP[fb.category]?.emoji}
                  </div>
                  <div>
                    <EditableTitle
                      defaultText={fb.name}
                      onSaveValue={(val) => updateFixedBillName(fb.id, val)}
                      className="font-bold text-slate-100"
                    />
                    <p className="text-xs text-slate-400 font-medium">Todo dia {fb.due_day} • {fb.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-white mb-1">R$ {fb.amount.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
                  <button onClick={() => deleteExpenseLocal(fb.id, true)} className="text-xs uppercase tracking-widest text-red-400 hover:text-red-300 font-bold">Desativar</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-6 border-t border-slate-800 flex justify-between items-center">
            <span className="font-bold text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2">
              <Circle className="w-3 h-3 text-indigo-500 fill-indigo-500" /> Total Fixo
            </span>
            <span className="font-black text-white text-xl">
              R$ {fixedBills.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}
            </span>
          </div>
        </div>

      </div>

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setIsAddingExpense(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] flex items-center justify-center transition-transform hover:scale-110 z-30 border-4 border-slate-50"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* MODAL ADICIONAR GASTO AVULSO */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsAddingExpense(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
            <h3 className="text-2xl font-black text-slate-800 mb-6">Gasto Avulso</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                <button onClick={() => setExpenseType('unica')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${expenseType === 'unica' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Única</button>
                <button onClick={() => setExpenseType('parcelada')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${expenseType === 'parcelada' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Parcelada</button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Qual foi a Despesa?</label>
                <input value={newExpTitle} onChange={e=>setNewExpTitle(e.target.value)} placeholder="Ex: Ifood Hambúrguer" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-medium outline-none focus:border-indigo-500 transition-colors mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">{expenseType === 'unica' ? 'Valor R$' : 'Valor Total R$'}</label>
                  <input value={newExpAmount} onChange={e=>setNewExpAmount(e.target.value)} placeholder="0,00" inputMode="numeric" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black text-slate-800 outline-none focus:border-indigo-500 transition-colors mt-2" />
                </div>
                <div>
                  {expenseType === 'parcelada' ? (
                    <>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Vezes</label>
                      <select value={installmentsCount} onChange={e=>setInstallmentsCount(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black text-slate-800 outline-none focus:border-indigo-500 transition-colors mt-2 appearance-none">
                        {[2,3,4,5,6,7,8,9,10,11,12,18,24].map(n => <option key={n} value={n}>{n}x s/ juros</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Categoria</label>
                      <select value={newExpCat} onChange={e=>setNewExpCat(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors mt-2 appearance-none">
                        {Object.keys(CATEGORY_MAP).map(c => <option key={c} value={c}>{CATEGORY_MAP[c].emoji} {c}</option>)}
                      </select>
                    </>
                  )}
                </div>
              </div>
              
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Cartão (Opc. ex: Nubank)</label>
                  <input value={expenseCard} onChange={e=>setExpenseCard(e.target.value)} placeholder="..." className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-medium outline-none focus:border-indigo-500 transition-colors mt-2" />
                </div>
                <div>
                  {expenseType === 'unica' ? (
                    <>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Data Vencimento</label>
                      <input type="date" value={newExpDate} onChange={e=>setNewExpDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-2 rounded-2xl font-black text-slate-800 outline-none focus:border-indigo-500 transition-colors mt-2" />
                    </>
                  ) : (
                    <>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Dia da Fatura (1-31)</label>
                      <input type="number" min="1" max="31" value={expenseDueDay} onChange={e=>setExpenseDueDay(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black text-slate-800 outline-none focus:border-indigo-500 transition-colors mt-2" />
                    </>
                  )}
                </div>
              </div>

              {expenseType === 'parcelada' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Categoria Geral</label>
                  <select value={newExpCat} onChange={e=>setNewExpCat(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors mt-2 appearance-none">
                    {Object.keys(CATEGORY_MAP).map(c => <option key={c} value={c}>{CATEGORY_MAP[c].emoji} {c}</option>)}
                  </select>
                </div>
              )}
              
              <button onClick={handleAddExpense} className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm shadow-md transition-colors mt-6">
                {expenseType === 'unica' ? 'Gravar Gasto' : 'Criar Parcelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR CONTA FIXA */}
      {isAddingFixed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative border-4 border-slate-900">
            <button onClick={() => setIsAddingFixed(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><Zap className="text-orange-500"/> Nova Assinatura/Fixo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Nome do Boleto ou Conta</label>
                <input value={newFixName} onChange={e=>setNewFixName(e.target.value)} placeholder="Ex: Conta de Luz" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-medium outline-none focus:border-orange-400 transition-colors mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Valor Fixo R$</label>
                  <input value={newFixAmount} onChange={e=>setNewFixAmount(e.target.value)} placeholder="0,00" inputMode="numeric" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-400 transition-colors mt-2" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Dia Vencimento</label>
                  <input value={newFixDay} onChange={e=>setNewFixDay(e.target.value)} placeholder="Dia" type="number" min="1" max="31" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-400 transition-colors mt-2" />
                </div>
              </div>
              <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Classificação (50/30)</label>
                  <select value={newFixCat} onChange={e=>setNewFixCat(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-medium text-slate-700 outline-none focus:border-orange-400 transition-colors mt-2 appearance-none">
                    {Object.keys(CATEGORY_MAP).map(c => <option key={c} value={c}>{CATEGORY_MAP[c].emoji} {c}</option>)}
                  </select>
                </div>
              <button onClick={handleAddFixed} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm shadow-md transition-colors mt-6">Ligar Automação</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
