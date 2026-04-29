import { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Info,
  ChevronRight,
  Wallet,
  Save,
  History,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  TrendingUp as TrendingUpIcon,
  CreditCard,
  Menu,
  X,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSalaryHistory, type SalaryCalculation } from './hooks/useSalaryHistory';
import { useCalendarMarks } from './hooks/useCalendarMarks';
import { ExtrasCalendar } from './ExtrasCalendar';
import { ExpensesTab } from './ExpensesTab';
import { InvestmentsTab } from './InvestmentsTab';
import { EditableTitle } from './components/EditableTitle';

// Constants and Tables
const STANDARD_MONTHLY_HOURS = 220;
const DAYCARE_ALLOWANCE = 820.01;
const FOOD_DEDUCTION = 1.20;
const TRANSPORT_DEDUCTION = 1.20;
const BUDGET_ALLOCATION = 17.00;
const DENTAL_PLAN = 37.52;

type TabType = 'dashboard' | 'investments' | 'expenses' | 'history' | 'extras';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Dashboard Calculator State
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(1200);
  const [ot60Days, setOt60Days] = useState<number>(0);
  const [ot110Days, setOt110Days] = useState<number>(1);
  const [referenceMonth, setReferenceMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );
  
  const { history, isLoading, saveCalculation, deleteCalculation } = useSalaryHistory();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const { calendarMarks: extrasCalendar, calendarPhotos, toggleMark: toggleExtra, addPhoto, removePhoto } = useCalendarMarks();

  useEffect(() => {
    const [yearStr, monthStr] = referenceMonth.split('-');
    if (!yearStr || !monthStr) return;
    const year = Number(yearStr);
    const month = Number(monthStr);

    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    // Lê desde dia 15 do mês anterior até dia 14 do mês selecionado
    const startDateStr = `${prevYear}-${pad(prevMonth)}-15`;
    const endDateStr = `${year}-${pad(month)}-14`;
    
    let count60 = 0;
    let count110 = 0;
    
    Object.entries(extrasCalendar).forEach(([dateStr, type]) => {
      if (dateStr >= startDateStr && dateStr <= endDateStr) {
        if (type === '60') count60++;
        else if (type === '110') count110++;
      }
    });
    
    setOt60Days(count60);
    setOt110Days(count110);
  }, [referenceMonth, extrasCalendar]);

  const uniqueHistory = useMemo(() => {
    const monthMap = new Map();
    history.forEach((item) => {
      // Mantém apenas a ocorrência mais recente caso múltiplos cálculos daquele mês existam
      if (!monthMap.has(item.reference_month)) {
        monthMap.set(item.reference_month, item);
      }
    });
    
    // Converte e ordena de forma cronológica (menor pro maior mês, ex: Jan -> Fev -> Mar)
    const sortedArr = Array.from(monthMap.values()).sort((a, b) => 
      a.reference_month.localeCompare(b.reference_month)
    );
    return sortedArr;
  }, [history]);

  const calculations = useMemo(() => {
    const hourlyRate = baseSalary / STANDARD_MONTHLY_HOURS;
    
    const hora60 = hourlyRate * 1.6;
    const hora110 = hourlyRate * 2.1;

    const ot60HoursTotal = ot60Days * 1.5;
    const ot110HoursTotal = ot110Days * 7.33;

    const ot60Value = hora60 * ot60HoursTotal;
    const ot110Value = hora110 * ot110HoursTotal;

    const totalExtras = ot60Value + ot110Value;
    
    const grossSalary = baseSalary + totalExtras + DAYCARE_ALLOWANCE;

    const inssBase = baseSalary + totalExtras;
    const inss = inssBase * 0.08;
    const irrf = 0;
    const fgts = inssBase * 0.08;

    const fixedDeductionsTotal = FOOD_DEDUCTION + TRANSPORT_DEDUCTION + BUDGET_ALLOCATION + DENTAL_PLAN;
    
    const totalDeductions = inss + irrf + fixedDeductionsTotal;
    const totalNet = grossSalary - totalDeductions;
    const secondPayment = totalNet - advancePayment;

    return {
      hourlyRate,
      hora60,
      hora110,
      ot60Value,
      ot110Value,
      totalExtras,
      ot60HoursTotal,
      ot110HoursTotal,
      grossSalary,
      inss,
      irrf,
      fgts,
      fixedDeductionsTotal,
      totalNet,
      secondPayment
    };
  }, [baseSalary, advancePayment, ot60Days, ot110Days]);

  const handleSave = async () => {
    setSaveStatus('saving');
    const calculationData: SalaryCalculation = {
      reference_month: referenceMonth,
      base_salary: baseSalary,
      advance_payment: advancePayment,
      ot60_days: ot60Days,
      ot110_days: ot110Days,
      ot60_value: calculations.ot60Value,
      ot110_value: calculations.ot110Value,
      gross_salary: calculations.grossSalary,
      inss_deduction: calculations.inss,
      fixed_deductions: calculations.fixedDeductionsTotal,
      fgts_value: calculations.fgts,
      net_salary: calculations.totalNet,
      second_payment: calculations.secondPayment,
    };

    const result = await saveCalculation(calculationData);
    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
    }
  };

  const formatCurrency = (val: number | undefined) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Currency Input Helpers
  const parseCurrencyInput = (value: string) => {
    const numericString = value.replace(/\D/g, '');
    return Number(numericString) / 100;
  };
  
  const formatInputDisplay = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderSidebar = () => (
    <>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-400" />
            Finanças
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => { setActiveTab('investments'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'investments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <TrendingUpIcon className="w-5 h-5" />
            <span className="font-medium">Investimentos</span>
          </button>
          <button 
            onClick={() => { setActiveTab('expenses'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Gastos</span>
          </button>
          <button 
            onClick={() => { setActiveTab('extras'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'extras' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="font-medium">Horas Extras</span>
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium">Histórico</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
          © 2026 App
        </div>
      </div>
    </>
  );

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Calculator className="w-8 h-8 text-indigo-600" />
            Calculadora de Salário
          </h2>
          <p className="text-slate-500">Cálculo quinzenal com horas extras e descontos.</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Wallet className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Líquido Mensal</p>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(calculations.totalNet)}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs Section */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-400" />
                Dados Base
              </h2>
              <input 
                type="month" 
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Salário Base (Bruto)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                  <input 
                    type="text" 
                    value={formatInputDisplay(baseSalary)}
                    onChange={(e) => {
                      const newSalary = parseCurrencyInput(e.target.value);
                      setBaseSalary(newSalary);
                      setAdvancePayment(newSalary * 0.40);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Adiantamento (1ª Quinzena)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                  <input 
                    type="text" 
                    value={formatInputDisplay(advancePayment)}
                    onChange={(e) => setAdvancePayment(parseCurrencyInput(e.target.value))}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Horas Extras
                </h2>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sua Hora Base</p>
                  <p className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-1 inline-block">{formatCurrency(calculations.hourlyRate)}/h</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* 60% */}
                <div className="group p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        Plantões 60%
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md">{formatCurrency(calculations.hora60)}/h</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">1 dia = 1.5 horas</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="0"
                        step="1"
                        value={ot60Days}
                        onChange={(e) => setOt60Days(Number(e.target.value))}
                        className="w-20 text-center px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-700 text-lg shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200/80">
                    <span className="text-xs font-medium text-slate-500">Cálculo: {calculations.ot60HoursTotal.toFixed(2)}h</span>
                    <span className="font-bold text-emerald-600 text-lg">{formatCurrency(calculations.ot60Value)}</span>
                  </div>
                </div>

                {/* 110% */}
                <div className="group p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        Plantões 110%
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md">{formatCurrency(calculations.hora110)}/h</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">1 dia = 7.33 horas</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="0"
                        step="1"
                        value={ot110Days}
                        onChange={(e) => setOt110Days(Number(e.target.value))}
                        className="w-20 text-center px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-700 text-lg shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200/80">
                    <span className="text-xs font-medium text-slate-500">Cálculo: {calculations.ot110HoursTotal.toFixed(2)}h</span>
                    <span className="font-bold text-emerald-600 text-lg">{formatCurrency(calculations.ot110Value)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-5 flex justify-between items-center text-white shadow-lg shadow-indigo-200">
                <div>
                  <span className="block text-indigo-50 text-sm font-bold uppercase tracking-wider">Total de Extras</span>
                  <span className="block text-[10px] text-indigo-200 mt-1">Sem incidência de DSR</span>
                </div>
                <span className="text-3xl font-black tracking-tight">{formatCurrency(calculations.totalExtras)}</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                saveStatus === 'success' 
                  ? 'bg-emerald-500 text-white' 
                  : saveStatus === 'error'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : saveStatus === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : saveStatus === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'success' ? 'Salvo!' : saveStatus === 'error' ? 'Erro ao Salvar' : 'Salvar Cálculo'}
            </button>
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-indigo-100 text-sm font-medium">Pagamento Dia 30</p>
              <ChevronRight className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <p className="text-4xl font-bold">{formatCurrency(calculations.secondPayment)}</p>
              <p className="text-indigo-200 mt-1 font-medium text-sm">Com auxílio creche (+ {formatCurrency(DAYCARE_ALLOWANCE)})</p>
            </div>
            
            <div className="pt-4 border-t border-indigo-500/50">
              <p className="text-2xl font-bold text-indigo-100">{formatCurrency(calculations.secondPayment - DAYCARE_ALLOWANCE)}</p>
              <p className="text-indigo-300 text-sm">Sem auxílio creche</p>
            </div>

            <p className="text-indigo-200/80 text-xs leading-relaxed pt-2">
              Os valores já consideram os descontos (INSS, fixos, etc.) e a subtração da primeira quinzena (adiantamento).
            </p>
          </div>
        </section>

        {/* Results Section */}
        <section className="lg:col-span-2 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2"
            >
              <div className="flex items-center gap-2 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Ganhos Brutos</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(calculations.grossSalary)}</p>
              <p className="text-slate-400 text-xs">Salário + Extras + Creche</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2"
            >
              <div className="flex items-center gap-2 text-rose-600">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Descontos</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(calculations.inss + calculations.fixedDeductionsTotal)}</p>
              <p className="text-slate-400 text-xs">INSS (8%) + Fixos</p>
            </motion.div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">Detalhamento do Cálculo</h3>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Info className="w-4 h-4" />
                Regras Customizadas
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Valor da Hora (Base / 220)</span>
                <span className="font-medium">{formatCurrency(calculations.hourlyRate)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Auxílio Creche (Benefício)</span>
                <span className="font-medium text-emerald-600">+{formatCurrency(820.01)}</span>
              </div>

              {/* Extras Details */}
              <div className="bg-emerald-50 rounded-xl p-4 my-2 border border-emerald-100">
                <div className="flex justify-between items-center font-bold text-emerald-800 mb-2 border-b border-emerald-200 pb-2">
                  <span>Total Horas Extras</span>
                  <span>+{formatCurrency(calculations.totalExtras)}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-sm text-emerald-700">
                  <span>Extras 60% ({calculations.ot60HoursTotal.toFixed(1)}h)</span>
                  <span>+{formatCurrency(calculations.ot60Value)}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-sm text-emerald-700">
                  <span>Extras 110% ({calculations.ot110HoursTotal.toFixed(2)}h)</span>
                  <span>+{formatCurrency(calculations.ot110Value)}</span>
                </div>
              </div>
              
              <div className="h-px bg-slate-100 my-2" />
              
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 flex items-center gap-2">
                  Desconto INSS (8%)
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold uppercase">Dedução</span>
                </span>
                <span className="font-medium text-rose-600">-{formatCurrency(calculations.inss)}</span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descontos Fixos</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Alimentação / Transporte</span>
                  <span className="text-rose-500">-{formatCurrency(1.20 + 1.20)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Dotação Orçamento</span>
                  <span className="text-rose-500">-{formatCurrency(17.00)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Plano Odontológico</span>
                  <span className="text-rose-500">-{formatCurrency(37.52)}</span>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 flex items-center gap-2">
                  FGTS (Depósito Empresa)
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">Informativo</span>
                </span>
                <span className="font-medium text-blue-600">{formatCurrency(calculations.fgts)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  // renderInvestments migrated to InvestmentsTab.tsx

  const renderHistory = () => (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <History className="w-6 h-6 text-indigo-600" />
            Histórico de Cálculos
          </h2>
          <p className="text-slate-500 mt-1">Veja todos os seus cálculos salvos anteriormente.</p>
        </div>
      </div>

      {isLoading && history.length === 0 ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-300">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
          <p className="text-slate-400 font-medium">Nenhum cálculo salvo ainda.</p>
          <p className="text-slate-400 text-xs text-balance">Realize um cálculo no Dashboard e clique em "Salvar Cálculo" para começar seu histórico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {history.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <EditableTitle 
                      storageKey={`hist_card_${item.id}`}
                      defaultText={item.reference_month}
                      className="text-xs font-bold text-indigo-600 uppercase tracking-widest"
                    />
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(item.net_salary)}</p>
                  </div>
                  <button
                    onClick={() => item.id && deleteCalculation(item.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir cálculo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Salário Base</span>
                    <span className="font-medium text-slate-700">{formatCurrency(item.base_salary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Horas Extras</span>
                    <span className="font-medium text-emerald-600">+{formatCurrency(item.ot60_value + item.ot110_value)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Descontos</span>
                    <span className="font-medium text-rose-500">-{formatCurrency(item.inss_deduction + item.fixed_deductions)}</span>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    {new Date(item.created_at || '').toLocaleDateString('pt-BR')}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-900 bg-indigo-50 px-2 py-1 rounded-md">
                    <Wallet className="w-3 h-3 text-indigo-500" />
                    {formatCurrency(item.second_payment)} (Dia 30)
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Mobile Topbar */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-wide">Finanças</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white hover:bg-slate-700 transition"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {renderSidebar()}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto w-full min-h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'investments' && <InvestmentsTab salaryHistory={uniqueHistory} />}
          {activeTab === 'expenses' && <ExpensesTab salaryHistory={uniqueHistory} />}
          {activeTab === 'extras' && <ExtrasCalendar extrasCalendar={extrasCalendar} toggleExtra={toggleExtra} baseSalary={baseSalary} calendarPhotos={calendarPhotos} addPhoto={addPhoto} removePhoto={removePhoto} />}
          {activeTab === 'history' && renderHistory()}
        </div>
      </div>
    </div>
  );
}
