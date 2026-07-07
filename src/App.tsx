import { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Info,
  ChevronRight,
  ChevronLeft,
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
  CalendarDays,
  Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useSalaryHistory, type SalaryCalculation } from './hooks/useSalaryHistory';
import { useCalendarMarks } from './hooks/useCalendarMarks';
import { useExpensesData } from './hooks/useExpensesData';
import { useInvestmentsData } from './hooks/useInvestmentsData';
import { useOvertimeLaunches } from './hooks/useOvertimeLaunches';
import { usePortfolios } from './hooks/usePortfolios';
import { OvertimeTab } from './OvertimeTab';
import { ExpensesTab } from './ExpensesTab';
import { InvestmentsTab } from './InvestmentsTab';
import { EditableTitle } from './components/EditableTitle';
import { FinancingTab } from './FinancingTab';

// Constants and Tables
const STANDARD_MONTHLY_HOURS = 220;
const DAYCARE_ALLOWANCE = 820.01;
const FOOD_DEDUCTION = 1.20;
const TRANSPORT_DEDUCTION = 1.20;
const BUDGET_ALLOCATION = 17.00;
const DENTAL_PLAN = 37.52;

type TabType = 'dashboard' | 'investments' | 'expenses' | 'history' | 'extras' | 'financing';

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
  
  interface InstallmentDetail {
    number: number;
    amount: number;
    paid: boolean;
  }

  const [financing, setFinancing] = useState<number>(2156.35);
  const [investmentReturn, setInvestmentReturn] = useState<number>(0);
  
  const [vehicleName, setVehicleName] = useState<string>('Toyota Corolla XEi 2.0');
  const [vehicleTotalValue, setVehicleTotalValue] = useState<number>(89900);
  const [vehiclePaidInstallments, setVehiclePaidInstallments] = useState<number>(0);
  const [vehicleTotalInstallments, setVehicleTotalInstallments] = useState<number>(48);
  const [installmentsDetail, setInstallmentsDetail] = useState<InstallmentDetail[]>([]);
  const [isFinancingDrawerOpen, setIsFinancingDrawerOpen] = useState<boolean>(false);
  const [isExpensesDetailModalOpen, setIsExpensesDetailModalOpen] = useState<boolean>(false);
  const [vehicleInterestRate, setVehicleInterestRate] = useState<number>(1.29);
  const [vehicleDueDay, setVehicleDueDay] = useState<number>(10);

  const goToPrevMonth = () => {
    const [yearStr, monthStr] = referenceMonth.split('-');
    const year = parseInt(yearStr || '2026');
    const month = parseInt(monthStr || '07');
    let prevM = month - 1;
    let prevY = year;
    if (prevM === 0) {
      prevM = 12;
      prevY -= 1;
    }
    setReferenceMonth(`${prevY}-${String(prevM).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [yearStr, monthStr] = referenceMonth.split('-');
    const year = parseInt(yearStr || '2026');
    const month = parseInt(monthStr || '07');
    let nextM = month + 1;
    let nextY = year;
    if (nextM === 13) {
      nextM = 1;
      nextY += 1;
    }
    setReferenceMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };
  
  const { history, isLoading, saveCalculation, deleteCalculation } = useSalaryHistory();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const { calendarMarks: extrasCalendar, calendarPhotos, toggleMark: toggleExtra, addPhoto, removePhoto } = useCalendarMarks();
  
  const expensesData = useExpensesData();
  const investmentsData = useInvestmentsData();
  const portfoliosData = usePortfolios();


  // Load calculation if exists in history for the selected month
  useEffect(() => {
    const saved = history.find(h => h.reference_month === referenceMonth);
    if (saved) {
      setBaseSalary(Number(saved.base_salary));
      setAdvancePayment(Number(saved.advance_payment));
      setFinancing(Number(saved.financing ?? 2156.35));
      setInvestmentReturn(Number(saved.investment_return ?? 0));
      setVehicleName(saved.vehicle_name ?? 'Toyota Corolla XEi 2.0');
      setVehicleTotalValue(Number(saved.vehicle_total_value ?? 89900));
      setVehiclePaidInstallments(Number(saved.vehicle_paid_installments ?? 0));
      setVehicleTotalInstallments(Number(saved.vehicle_total_installments ?? 48));
      setVehicleInterestRate(Number(saved.vehicle_interest_rate ?? 1.29));
      setVehicleDueDay(Number(saved.vehicle_due_day ?? 10));
      
      const details = saved.installments_detail;
      if (Array.isArray(details) && details.length > 0) {
        setInstallmentsDetail(details as InstallmentDetail[]);
      } else {
        const initialDetails: InstallmentDetail[] = [];
        const totalInst = Number(saved.vehicle_total_installments ?? 48);
        const paidInst = Number(saved.vehicle_paid_installments ?? 0);
        const instVal = Number(saved.financing ?? 2156.35);
        for (let i = 1; i <= totalInst; i++) {
          initialDetails.push({
            number: i,
            amount: instVal,
            paid: i <= paidInst,
          });
        }
        setInstallmentsDetail(initialDetails);
      }
    } else {
      setInvestmentReturn(0);
      setVehicleName('Toyota Corolla XEi 2.0');
      setVehicleTotalValue(89900);
      setVehiclePaidInstallments(0);
      setVehicleTotalInstallments(48);
      setVehicleInterestRate(1.29);
      setVehicleDueDay(10);
      const initialDetails: InstallmentDetail[] = [];
      for (let i = 1; i <= 48; i++) {
        initialDetails.push({
          number: i,
          amount: 2156.35,
          paid: false,
        });
      }
      setInstallmentsDetail(initialDetails);
    }
  }, [referenceMonth, history]);
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

  const totalExpenses = useMemo(() => {
    if (!expensesData || !Array.isArray(expensesData.expenses)) return 0;
    return expensesData.expenses
      .filter(e => e.date_str && e.date_str.startsWith(referenceMonth))
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [expensesData, referenceMonth]);

  const totalInvestments = useMemo(() => {
    if (!investmentsData || !Array.isArray(investmentsData.investments)) return 0;
    return investmentsData.investments
      .filter(i => i.date_str && i.date_str.startsWith(referenceMonth))
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [investmentsData, referenceMonth]);

  const totalDividends = useMemo(() => {
    if (!portfoliosData || !Array.isArray(portfoliosData.dividends)) return 0;
    return portfoliosData.dividends
      .filter(d => d.date && d.date.startsWith(referenceMonth))
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [portfoliosData, referenceMonth]);

  const totalReceitas = useMemo(() => {
    const netSalaryNoDaycare = advancePayment + (calculations.secondPayment - DAYCARE_ALLOWANCE);
    return netSalaryNoDaycare + investmentReturn + totalDividends;
  }, [advancePayment, calculations.secondPayment, investmentReturn, totalDividends]);

  const totalDespesas = useMemo(() => {
    return totalExpenses + financing;
  }, [totalExpenses, financing]);

  const totalLiquido = useMemo(() => {
    return totalReceitas - totalDespesas;
  }, [totalReceitas, totalDespesas]);

  const vehicleTotalPaid = useMemo(() => {
    return vehiclePaidInstallments * financing;
  }, [vehiclePaidInstallments, financing]);

  const vehicleRemainingBalance = useMemo(() => {
    return Math.max(0, vehicleTotalValue - vehicleTotalPaid);
  }, [vehicleTotalValue, vehicleTotalPaid]);

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
      financing,
      investment_return: investmentReturn,
      vehicle_name: vehicleName,
      vehicle_total_value: vehicleTotalValue,
      vehicle_paid_installments: vehiclePaidInstallments,
      vehicle_total_installments: vehicleTotalInstallments,
      installments_detail: installmentsDetail,
      vehicle_interest_rate: vehicleInterestRate,
      vehicle_due_day: vehicleDueDay,
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

  const parseCurrencyInput = (value: string) => {
    const numericString = value.replace(/\D/g, '');
    return Number(numericString) / 100;
  };
  
  const formatInputDisplay = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const recentTransactions = useMemo(() => {
    const list: { name: string; amount: number; type: 'receita' | 'despesa' | 'investimento'; date: string }[] = [];
    
    if (baseSalary > 0) {
      list.push({
        name: 'Salário Base (Líquido)',
        amount: calculations.totalNet - DAYCARE_ALLOWANCE,
        type: 'receita',
        date: `${referenceMonth}-30`
      });
    }
    
    if (calculations.totalExtras > 0) {
      list.push({
        name: 'Horas Extras',
        amount: calculations.totalExtras,
        type: 'receita',
        date: `${referenceMonth}-30`
      });
    }
    
    if (investmentReturn > 0) {
      list.push({
        name: 'Retorno de Investimento',
        amount: investmentReturn,
        type: 'receita',
        date: `${referenceMonth}-15`
      });
    }

    if (expensesData && Array.isArray(expensesData.expenses)) {
      expensesData.expenses
        .filter(e => e.date_str && e.date_str.startsWith(referenceMonth))
        .forEach(e => {
          list.push({
            name: e.name || 'Sem nome',
            amount: e.amount || 0,
            type: 'despesa',
            date: e.date_str
          });
        });
    }

    if (investmentsData && Array.isArray(investmentsData.investments)) {
      investmentsData.investments
        .filter(i => i.date_str && i.date_str.startsWith(referenceMonth))
        .forEach(i => {
          list.push({
            name: `Investimento - ${(i.type || '').toUpperCase()}`,
            amount: i.amount || 0,
            type: 'investimento',
            date: i.date_str
          });
        });
    }

    return list.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
  }, [baseSalary, calculations.totalNet, calculations.totalExtras, referenceMonth, expensesData, investmentsData, investmentReturn]);

  const chartData = useMemo(() => {
    const list: { name: string; label: string; reference: string; Entradas: number; Saídas: number; Saldo: number }[] = [];
    const [yearStr, monthStr] = referenceMonth.split('-');
    if (!yearStr || !monthStr) return [];
    
    const year = Number(yearStr);
    const month = Number(monthStr);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      const pad = (n: number) => n.toString().padStart(2, '0');
      const refStr = `${y}-${pad(m)}`;
      const label = monthNames[m - 1];

      // Find saved calculation for this month
      const saved = history.find(h => h.reference_month === refStr);

      let entradas = 0;
      let saidas = 0;
      let saldo = 0;

      if (saved) {
        const base = Number(saved.base_salary);
        const o60 = Number(saved.ot60_value ?? 0);
        const o110 = Number(saved.ot110_value ?? 0);
        const ret = Number(saved.investment_return ?? 0);
        entradas = base + o60 + o110 + ret;

        const fin = Number(saved.financing ?? 2156.35);
        const ins = Number(saved.inss_deduction ?? 0);
        const fix = Number(saved.fixed_deductions ?? 0);
        
        const expSum = expensesData?.expenses
          ? expensesData.expenses
              .filter(e => e.date_str && e.date_str.startsWith(refStr))
              .reduce((acc, curr) => acc + (curr.amount || 0), 0)
          : 0;

        saidas = -(expSum + fin + ins + fix);
        saldo = entradas + saidas;
      } else {
        if (refStr === referenceMonth) {
          entradas = totalReceitas;
          saidas = -totalDespesas;
          saldo = totalLiquido;
        } else {
          if (baseSalary > 0) {
            entradas = baseSalary;
            saidas = -(financing + calculations.inss + calculations.fixedDeductionsTotal);
            saldo = entradas + saidas;
          } else {
            entradas = 0;
            saidas = 0;
            saldo = 0;
          }
        }
      }

      list.push({
        name: label,
        label,
        reference: refStr,
        Entradas: Math.round(entradas),
        Saídas: Math.round(saidas),
        Saldo: Math.round(saldo)
      });
    }

    return list;
  }, [referenceMonth, history, expensesData, totalReceitas, totalDespesas, totalLiquido, baseSalary, financing, calculations.inss, calculations.fixedDeductionsTotal]);

  const renderSidebar = () => (
    <>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-100 text-slate-600 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 leading-none">Finanças</span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Controle Pessoal</span>
            </div>
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium text-sm">Visão Geral</span>
          </button>
          <button 
            onClick={() => { setActiveTab('extras'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'extras' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium text-sm">Horas Extras</span>
          </button>
          <button 
            onClick={() => { setActiveTab('expenses'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'expenses' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium text-sm">Despesas</span>
          </button>
          <button 
            onClick={() => { setActiveTab('investments'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'investments' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <TrendingUpIcon className="w-5 h-5" />
            <span className="font-medium text-sm">Investimentos</span>
          </button>
          <button 
            onClick={() => { setActiveTab('financing'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'financing' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Car className="w-5 h-5" />
            <span className="font-medium text-sm">Financiamento</span>
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium text-sm">Histórico</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100 text-center text-[10px] font-medium text-slate-400">
          © 2026 Finanças
        </div>
      </div>
    </>
  );

  const renderCircularGauge = (percent: number, text: string, subtext: string, colorClass: string = 'stroke-indigo-600') => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
    
    return (
      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="56" cy="56" r={radius} stroke="#f8fafc" strokeWidth="8" fill="transparent" />
          <circle cx="56" cy="56" r={radius} strokeWidth="8" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-500 ease-in-out ${colorClass}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-lg font-black text-slate-800 leading-none">{text}</span>
          <span className="text-[8px] text-slate-400 font-bold mt-1 max-w-[65px] leading-tight">{subtext}</span>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const totalOtHours = calculations.ot60HoursTotal + calculations.ot110HoursTotal;
    const progressPercent = Math.min(100, (vehiclePaidInstallments / (vehicleTotalInstallments || 1)) * 100);

    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              Olá, Dryelly! 👋
            </h2>
            <p className="text-slate-500 font-medium text-sm">Aqui está o resumo das suas finanças.</p>
          </div>
          {/* Month Switcher */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm self-start sm:self-center">
            <button onClick={goToPrevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="font-bold text-slate-700 text-sm w-28 text-center">
              {(() => {
                const [y, m] = referenceMonth.split('-');
                const monthIndex = parseInt(m || '7') - 1;
                const monthNames = [
                  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ];
                return `${monthNames[monthIndex] || 'Julho'}/${y || '2026'}`;
              })()}
            </span>
            <button onClick={goToNextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </header>

        {/* Row of 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Líquido */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Líquido</p>
              <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(totalLiquido)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Líquido do mês</p>
            </div>
          </div>

          {/* Card 2: Receitas */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receitas</p>
              <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(totalReceitas)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Salário + Extras + Rendimentos + Dividendos</p>
            </div>
          </div>

          {/* Card 3: Despesas */}
          <div 
            onClick={() => setIsExpensesDetailModalOpen(true)}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-105 transition-transform">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Despesas 
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-medium">Ver detalhes</span>
              </p>
              <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(totalDespesas)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Gastos + Financiamento</p>
            </div>
          </div>

          {/* Card 4: Investimentos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
              <TrendingUpIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investido</p>
              <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(totalInvestments)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Aportes do mês</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Gráfico de Resumo Financeiro (col-span-2) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-500" />
                  Resumo do Mês
                </h3>
              </div>

              {/* Legend */}
              <div className="flex justify-center items-center gap-6 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-rose-500" />
                  <span>Saídas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-indigo-500" />
                  <span>Saldo</span>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={(props) => {
                        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                        const activeMonthLabel = monthNames[Number(referenceMonth.split('-')[1]) - 1];
                        const { x, y, payload } = props;
                        const isSelected = payload.value === activeMonthLabel;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            {isSelected && (
                              <rect x="-22" y="6" width="44" height="24" rx="8" fill="#e0e7ff" />
                            )}
                            <text 
                              x="0" 
                              y="22" 
                              textAnchor="middle" 
                              fill={isSelected ? "#4f46e5" : "#94a3b8"} 
                              className={`text-[11px] ${isSelected ? 'font-black' : 'font-semibold'}`}
                            >
                              {payload.value}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => v === 0 ? '0' : `${v / 1000}k`} 
                    />
                    <Tooltip formatter={(v: any) => [formatCurrency(v), '']} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 4, 4]} maxBarSize={14} />
                    <Bar dataKey="Saídas" fill="#f43f5e" radius={[4, 4, 4, 4]} maxBarSize={14} />
                    <Bar dataKey="Saldo" fill="#8b5cf6" radius={[4, 4, 4, 4]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Saldo do Mês</p>
                  <p className="text-2xl font-black text-slate-800">{formatCurrency(totalLiquido)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${totalLiquido >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {totalLiquido >= 0 ? 'Positivo' : 'Negativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Dashboard Gauges / Cards (col-span-1) */}
          <div className="space-y-6">
            {/* Card 1: Horas Extras a Receber */}
            <div 
              onClick={() => setActiveTab('extras')}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Horas Extras
                </h4>
                
                <div className="flex items-center gap-6 mt-6">
                  {/* Gauge */}
                  {renderCircularGauge(100, `${totalOtHours.toFixed(1)}h`, 'registradas no mês', 'stroke-indigo-500')}
                  
                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor total</p>
                      <p className="text-base font-black text-slate-800">{formatCurrency(calculations.totalExtras)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recebido</p>
                      <p className="text-sm font-black text-emerald-600">{formatCurrency(calculations.ot60Value)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pendente</p>
                      <p className="text-sm font-black text-orange-500">{formatCurrency(calculations.ot110Value)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-center">
                <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Ver detalhes <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Card 2: Financiamento de Veículo */}
            <div 
              onClick={() => setActiveTab('financing')}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                  <Car className="w-5 h-5 text-indigo-500" />
                  Financiamento de Veículo
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1">{vehicleName}</p>

                <div className="flex items-center gap-6 mt-6">
                  {/* Gauge */}
                  {renderCircularGauge(progressPercent, `${Math.round(progressPercent)}%`, 'concluído', 'stroke-indigo-500')}

                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-lg font-black text-slate-800 leading-none">
                        {vehiclePaidInstallments} / {vehicleTotalInstallments}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">parcelas pagas</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-800 leading-none">
                        {Math.max(0, vehicleTotalInstallments - vehiclePaidInstallments)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">parcelas restantes</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-center">
                <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Ver detalhes <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBaseDataCard = () => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <Calculator className="w-5 h-5 text-indigo-500" />
          Dados Base
        </h2>
        <input 
          type="month" 
          value={referenceMonth}
          onChange={(e) => setReferenceMonth(e.target.value)}
          className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
        />
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600">Salário Base (Bruto)</label>
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-bold text-slate-700"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600">Adiantamento (1ª Quinzena)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
            <input 
              type="text" 
              value={formatInputDisplay(advancePayment)}
              onChange={(e) => setAdvancePayment(parseCurrencyInput(e.target.value))}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-bold text-slate-700"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600">Financiamento Mensal</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
            <input 
              type="text" 
              value={formatInputDisplay(financing)}
              onChange={(e) => setFinancing(parseCurrencyInput(e.target.value))}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-bold text-slate-700"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600">Retorno de Investimentos</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
            <input 
              type="text" 
              value={formatInputDisplay(investmentReturn)}
              onChange={(e) => setInvestmentReturn(parseCurrencyInput(e.target.value))}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-bold text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Horas Extras Inputs Inside Base Data */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Lançamento de Horas Extras
          </h3>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Base: {formatCurrency(calculations.hourlyRate)}/h</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                Plantões 60%
                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded-md font-black">{formatCurrency(calculations.hora60)}/h</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">1 dia = 1.5 horas</p>
            </div>
            <input 
              type="number" 
              min="0"
              step="1"
              value={ot60Days}
              onChange={(e) => setOt60Days(Number(e.target.value))}
              className="w-16 text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-700 text-sm shadow-sm"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                Plantões 110%
                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded-md font-black">{formatCurrency(calculations.hora110)}/h</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">1 dia = 7.33 horas</p>
            </div>
            <input 
              type="number" 
              min="0"
              step="1"
              value={ot110Days}
              onChange={(e) => setOt110Days(Number(e.target.value))}
              className="w-16 text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-700 text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="flex justify-between items-center bg-indigo-600 rounded-xl p-3.5 text-white font-bold text-sm shadow-md shadow-indigo-200">
          <span>Total de Horas Extras:</span>
          <span className="text-base font-black">{formatCurrency(calculations.totalExtras)}</span>
        </div>
      </div>

      {/* Buttons inside Dados Base */}
      <button
        onClick={handleSave}
        disabled={saveStatus === 'saving'}
        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
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

      {/* Conditional Detailed Breakdown Inside Base Data */}
      {baseSalary > 0 && (
        <div className="border-t border-slate-100 pt-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              Detalhamento do Cálculo
            </h3>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Regras CLT</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span>Valor da Hora (Salário Base / 220)</span>
              <span className="font-bold text-slate-800">{formatCurrency(calculations.hourlyRate)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Auxílio Creche (Especial)</span>
              <span className="font-bold text-emerald-600">+{formatCurrency(DAYCARE_ALLOWANCE)}</span>
            </div>

            {calculations.totalExtras > 0 && (
              <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between font-bold text-emerald-800 border-b border-emerald-100 pb-1.5">
                  <span>Horas Extras Calculadas</span>
                  <span>+{formatCurrency(calculations.totalExtras)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Extras 60% ({calculations.ot60HoursTotal.toFixed(2)}h)</span>
                  <span>+{formatCurrency(calculations.ot60Value)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Extras 110% ({calculations.ot110HoursTotal.toFixed(2)}h)</span>
                  <span>+{formatCurrency(calculations.ot110Value)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
              <span className="flex items-center gap-1">
                Desconto INSS (Progressivo 8%)
                <span className="text-[9px] bg-rose-50 text-rose-600 px-1 py-0.5 rounded font-black uppercase">Dedução</span>
              </span>
              <span className="font-bold text-rose-500">-{formatCurrency(calculations.inss)}</span>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deduções Fixas</p>
              <div className="flex justify-between items-center pl-2">
                <span className="text-slate-500">Alimentação / Transporte</span>
                <span className="text-rose-500 font-medium">-{formatCurrency(FOOD_DEDUCTION + TRANSPORT_DEDUCTION)}</span>
              </div>
              <div className="flex justify-between items-center pl-2">
                <span className="text-slate-500">Dotação Orçamento</span>
                <span className="text-rose-500 font-medium">-{formatCurrency(BUDGET_ALLOCATION)}</span>
              </div>
              <div className="flex justify-between items-center pl-2">
                <span className="text-slate-500">Plano Odontológico</span>
                <span className="text-rose-500 font-medium">-{formatCurrency(DENTAL_PLAN)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
              <span className="flex items-center gap-1">
                FGTS (Depósito FGTS)
                <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-black uppercase">Informativo</span>
              </span>
              <span className="font-bold text-blue-600">{formatCurrency(calculations.fgts)}</span>
            </div>

            {/* Day 30 payments showing right here! */}
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 text-indigo-900 font-bold space-y-1">
                <span className="block text-[10px] text-indigo-400 uppercase">Pagamento Dia 30 (Com Creche)</span>
                <span className="text-xl font-black block">{formatCurrency(calculations.secondPayment)}</span>
                <span className="text-[9px] text-indigo-400 font-medium block">Auxílio creche incluso (+ {formatCurrency(DAYCARE_ALLOWANCE)})</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 font-bold space-y-1">
                <span className="block text-[10px] text-slate-400 uppercase">Pagamento Dia 30 (Sem Creche)</span>
                <span className="text-xl font-black block">{formatCurrency(calculations.secondPayment - DAYCARE_ALLOWANCE)}</span>
                <span className="text-[9px] text-slate-400 font-medium block">Auxílio creche removido</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
      <div className="lg:hidden bg-white border-b border-slate-100 text-slate-800 p-4 flex items-center justify-between shadow-sm z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-slate-900 tracking-wide">Finanças</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {renderSidebar()}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto w-full min-h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'investments' && (
            <InvestmentsTab 
              salaryHistory={uniqueHistory} 
              investmentsData={investmentsData} 
              referenceMonth={referenceMonth}
              setReferenceMonth={setReferenceMonth}
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesTab 
              salaryHistory={uniqueHistory} 
              expensesData={expensesData} 
              referenceMonth={referenceMonth}
              setReferenceMonth={setReferenceMonth}
            />
          )}
          {activeTab === 'financing' && (
            <FinancingTab
              vehicleName={vehicleName}
              setVehicleName={setVehicleName}
              vehicleTotalValue={vehicleTotalValue}
              setVehicleTotalValue={setVehicleTotalValue}
              financing={financing}
              setFinancing={setFinancing}
              vehiclePaidInstallments={vehiclePaidInstallments}
              setVehiclePaidInstallments={setVehiclePaidInstallments}
              vehicleTotalInstallments={vehicleTotalInstallments}
              setVehicleTotalInstallments={setVehicleTotalInstallments}
              installmentsDetail={installmentsDetail}
              setInstallmentsDetail={setInstallmentsDetail}
              formatCurrency={formatCurrency}
              vehicleInterestRate={vehicleInterestRate}
              setVehicleInterestRate={setVehicleInterestRate}
              vehicleDueDay={vehicleDueDay}
              setVehicleDueDay={setVehicleDueDay}
              referenceMonth={referenceMonth}
              setReferenceMonth={setReferenceMonth}
            />
          )}
          {activeTab === 'extras' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <OvertimeTab
                  extrasCalendar={extrasCalendar}
                  toggleExtra={toggleExtra}
                  baseSalary={baseSalary}
                  calendarPhotos={calendarPhotos}
                  addPhoto={addPhoto}
                  removePhoto={removePhoto}
                  referenceMonth={referenceMonth}
                  setReferenceMonth={setReferenceMonth}
                  calculations={calculations}
                  formatCurrency={formatCurrency}
                />
              </div>
              <div className="lg:col-span-1">
                {renderBaseDataCard()}
              </div>
            </div>
          )}
          {activeTab === 'history' && renderHistory()}
        </div>
      </div>

      {/* Modal: Detalhamento de Despesas do Dashboard */}
      {isExpensesDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                  Composição das Despesas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualizando o mês de {(() => {
                    const [y, m] = referenceMonth.split('-');
                    const monthIndex = parseInt(m || '7') - 1;
                    const monthNames = [
                      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                    ];
                    return `${monthNames[monthIndex] || 'Julho'}/${y || '2026'}`;
                  })()}
                </p>
              </div>
              <button 
                onClick={() => setIsExpensesDetailModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {/* Item 1: Financiamento */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Financiamento de Veículo</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5 block">{vehicleName}</span>
                </div>
                <span className="font-black text-slate-700 text-sm">{formatCurrency(financing)}</span>
              </div>

              {/* Item 2: Gastos do Mês */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gastos Cadastrados ({expensesData.expenses.filter(e => e.date_str && e.date_str.startsWith(referenceMonth)).length})</span>
                  <span className="font-bold text-slate-800 text-xs">{formatCurrency(totalExpenses)}</span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {expensesData.expenses.filter(e => e.date_str && e.date_str.startsWith(referenceMonth)).length > 0 ? (
                    expensesData.expenses
                      .filter(e => e.date_str && e.date_str.startsWith(referenceMonth))
                      .map((exp) => (
                        <div key={exp.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50/50 transition-colors">
                          <div>
                            <span className="font-bold text-slate-700 text-xs block">{exp.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                              {exp.category} • {exp.date_str.split('-').reverse().join('/')}
                            </span>
                          </div>
                          <span className="font-black text-rose-500 text-xs">{formatCurrency(exp.amount)}</span>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                      Nenhuma despesa pessoal cadastrada para este mês.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Total Footer */}
            <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Geral</span>
              <span className="text-xl font-black text-slate-800">{formatCurrency(totalDespesas)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
