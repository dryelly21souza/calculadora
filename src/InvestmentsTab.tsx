import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Wallet, Target, PieChart, Zap, ChevronLeft, ChevronRight,
  Plus, X, Trash2, Rocket, ArrowUpRight, Award, ShieldCheck, CheckCircle2
} from 'lucide-react';
import type { SalaryCalculation } from './hooks/useSalaryHistory';
import { useInvestmentsData } from './hooks/useInvestmentsData';

interface InvestmentsTabProps {
  salaryHistory: SalaryCalculation[];
}

const INVESTMENT_TYPES = [
  { id: 'poupanca', name: 'Poupança', icon: '🏦' },
  { id: 'cdb', name: 'CDB / Renda Fixa', icon: '📈' },
  { id: 'tesouro', name: 'Tesouro Direto', icon: '🏛️' },
  { id: 'acoes', name: 'Ações / FIIs', icon: '📊' },
  { id: 'cripto', name: 'Criptomoedas', icon: '🪙' },
  { id: 'outros', name: 'Outros', icon: '💰' }
];

export const InvestmentsTab: React.FC<InvestmentsTabProps> = ({ salaryHistory }) => {
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
    investments, monthlyGoal, setMonthlyGoal, addInvestment, deleteInvestment
  } = useInvestmentsData();

  const [isAdding, setIsAdding] = useState(false);
  const [invAmount, setInvAmount] = useState('');
  const [invDate, setInvDate] = useState(`${monthStr}-15`);
  const [invType, setInvType] = useState('poupanca');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  // 1. Calculations
  const totalInvestedAllTime = useMemo(() => {
    return investments.reduce((acc, curr) => acc + curr.amount, 0);
  }, [investments]);

  const monthInvestments = useMemo(() => {
    return investments.filter(i => i.date_str.startsWith(monthStr)).sort((a,b) => b.date_str.localeCompare(a.date_str));
  }, [investments, monthStr]);

  const totalInvestedThisMonth = useMemo(() => {
    return monthInvestments.reduce((acc, curr) => acc + curr.amount, 0);
  }, [monthInvestments]);

  const [ruleView, setRuleView] = useState<'mes' | 'quinzena'>('mes');

  // Salary Base Breakdown
  const monthHistory = salaryHistory.find(h => h.reference_month === monthStr);
  const DAYCARE_ALLOWANCE = 820.01;
  const incomeQuinzena = monthHistory?.advance_payment || 0;
  const incomeMes = monthHistory ? Math.max(0, monthHistory.second_payment - DAYCARE_ALLOWANCE) : 0;
  
  // Active Rule Values
  const activeIncome = ruleView === 'mes' ? incomeMes : incomeQuinzena;
  const rule50 = activeIncome * 0.50;
  const rule30 = activeIncome * 0.30;
  const rule20 = activeIncome * 0.20;

  // Future Projection (Simulated 10 years at 10% aa for visual impact)
  const futureValue10Years = totalInvestedAllTime * Math.pow(1.10, 10);

  const handleSaveInvestment = () => {
    if (!invAmount) return;
    const value = Number(invAmount.replace(/\D/g, '')) / 100;
    if (value <= 0) return;

    addInvestment({
      amount: value,
      date_str: invDate,
      type: invType,
    });
    
    setInvAmount('');
    setIsAdding(false);
  };

  const handleSaveGoal = () => {
    const value = Number(goalInput.replace(/\D/g, '')) / 100;
    setMonthlyGoal(value);
    setIsEditingGoal(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* Month Navigation */}
      <div className="flex justify-between items-center bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 ml-4 hidden sm:block">Meus Investimentos</h2>
        <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 mx-auto sm:mx-0">
          <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl text-slate-600 shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
          <span className="w-32 text-center font-bold text-slate-700 uppercase tracking-widest text-sm">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl text-slate-600 shadow-sm"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* BLOCO 1: CARD PRINCIPAL */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {/* Total Investido */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-200 uppercase tracking-widest text-xs font-bold mb-1">
              <Wallet className="w-4 h-4"/> Total Investido
            </div>
            <h3 className="text-4xl md:text-5xl font-black">
              R$ {totalInvestedAllTime.toLocaleString('pt-BR', {minimumFractionDigits:2})}
            </h3>
            <p className="text-sm text-indigo-200 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-4 h-4" /> Seu patrimônio seguro
            </p>
          </div>

          {/* Investido no Mês */}
          <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <div className="flex items-center gap-2 text-indigo-200 uppercase tracking-widest text-xs font-bold mb-1">
              <TrendingUp className="w-4 h-4"/> Investido em {monthNames[month]}
            </div>
            <h3 className="text-3xl font-black text-emerald-300">
              R$ {totalInvestedThisMonth.toLocaleString('pt-BR', {minimumFractionDigits:2})}
            </h3>
            {monthlyGoal > 0 && (
              <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-1000"
                  style={{ width: `${Math.min((totalInvestedThisMonth / monthlyGoal) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Meta Mensal */}
          <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <div className="flex items-center justify-between text-indigo-200 uppercase tracking-widest text-xs font-bold mb-1">
              <span className="flex items-center gap-2"><Target className="w-4 h-4"/> Meta Mensal</span>
              <button onClick={() => { setIsEditingGoal(true); setGoalInput(monthlyGoal.toFixed(2)); }} className="hover:text-white transition-colors">Editar</button>
            </div>
            
            {isEditingGoal ? (
              <div className="flex gap-2">
                <input 
                  autoFocus
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  placeholder="0,00"
                  inputMode="numeric"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1 text-white font-bold outline-none focus:border-white/50"
                />
                <button onClick={handleSaveGoal} className="bg-emerald-500 text-white px-3 rounded-xl hover:bg-emerald-400"><CheckCircle2 className="w-5 h-5"/></button>
              </div>
            ) : (
              <h3 className="text-3xl font-black">
                R$ {monthlyGoal.toLocaleString('pt-BR', {minimumFractionDigits:2})}
              </h3>
            )}
            
            {monthlyGoal > 0 && (
              <p className="text-sm text-indigo-200 font-medium">
                {totalInvestedThisMonth >= monthlyGoal 
                  ? '🎉 Meta Atingida!' 
                  : `Faltam R$ ${(monthlyGoal - totalInvestedThisMonth).toLocaleString('pt-BR', {minimumFractionDigits:2})}`
                }
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: Insights */}
        <div className="space-y-6 lg:col-span-1">
          {/* Regra 50-30-20 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-500" /> Regra 50-30-20
              </h4>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
              <button onClick={() => setRuleView('quinzena')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${ruleView === 'quinzena' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Quinzena</button>
              <button onClick={() => setRuleView('mes')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${ruleView === 'mes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Fim do Mês</button>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-4 text-center">
              Base: <strong className="text-slate-800">R$ {activeIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong> 
              {ruleView === 'mes' && ' (Sem Creche)'}
            </p>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                  <span>50% Necessidades</span>
                  <span>R$ {rule50.toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-400 w-1/2" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                  <span>30% Desejos</span>
                  <span>R$ {rule30.toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-purple-400 w-[30%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
                  <span className="flex items-center gap-1"><Award className="w-3 h-3"/> 20% Ouro (Investir)</span>
                  <span>R$ {rule20.toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-3 bg-emerald-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[20%]" /></div>
              </div>
            </div>
            
            <div className="mt-5 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 font-medium">
                Seu foco deve ser direcionar <strong className="font-black">R$ {rule20.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong> para investimentos este mês!
              </p>
            </div>
          </div>

          {/* Futuro */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm text-white overflow-hidden relative">
            <Rocket className="absolute -right-4 -top-4 w-24 h-24 text-white/5" />
            <h4 className="font-bold flex items-center gap-2 mb-2 text-indigo-400">
              <ArrowUpRight className="w-5 h-5" /> Projeção de Futuro
            </h4>
            <p className="text-sm text-slate-400 mb-4">Se você mantiver esse montante guardado, em 10 anos (estimativa 10% a.a):</p>
            <h3 className="text-3xl font-black text-white">
              R$ {futureValue10Years.toLocaleString('pt-BR', {minimumFractionDigits:2})}
            </h3>
          </div>
        </div>

        {/* COLUNA DIREITA: Lista de Investimentos */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-black text-slate-800 text-lg">Aportes do Mês</h3>
              <p className="text-xs text-slate-500 mt-1">Registros salvos em {monthNames[month]}</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4"/> Adicionar
            </button>
          </div>
          
          <div className="p-4 flex-1 space-y-3">
            {monthInvestments.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">Nenhum investimento registrado este mês.</div>
            )}
            
            {monthInvestments.map(inv => {
              const typeInfo = INVESTMENT_TYPES.find(t => t.id === inv.type) || INVESTMENT_TYPES[5];
              return (
                <div key={inv.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:border-indigo-300">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-2xl shrink-0">
                    {typeInfo.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{typeInfo.name}</h4>
                    <p className="text-xs font-medium text-slate-400">Data: {inv.date_str.split('-').reverse().join('/')}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-black text-emerald-600 text-lg">R$ {inv.amount.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                    <button onClick={() => deleteInvestment(inv.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: Adicionar Investimento */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><TrendingUp className="text-emerald-500"/> Novo Aporte</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Valor R$</label>
                <input 
                  autoFocus
                  value={invAmount} 
                  onChange={e=>setInvAmount(e.target.value)} 
                  placeholder="0,00" 
                  inputMode="numeric" 
                  className="w-full bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl font-black text-emerald-700 text-2xl outline-none focus:border-emerald-400 transition-colors mt-1" 
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Tipo de Investimento</label>
                <select 
                  value={invType} 
                  onChange={e=>setInvType(e.target.value)} 
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors mt-1 appearance-none"
                >
                  {INVESTMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Data</label>
                <input 
                  type="date" 
                  value={invDate} 
                  onChange={e=>setInvDate(e.target.value)} 
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors mt-1" 
                />
              </div>

              <button 
                onClick={handleSaveInvestment} 
                className="w-full bg-slate-900 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm shadow-md transition-colors mt-6"
              >
                Gravar Investimento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
