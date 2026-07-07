import React, { useMemo } from 'react';
import { 
  Car, DollarSign, CalendarDays, CheckCircle2, TrendingUp, 
  ChevronRight, ChevronLeft, HelpCircle, RefreshCw, 
  Percent, Calendar, CreditCard, Award 
} from 'lucide-react';

interface InstallmentDetail {
  number: number;
  amount: number;
  paid: boolean;
}

interface FinancingTabProps {
  vehicleName: string;
  setVehicleName: (v: string) => void;
  vehicleTotalValue: number;
  setVehicleTotalValue: (v: number) => void;
  financing: number;
  setFinancing: (v: number) => void;
  vehiclePaidInstallments: number;
  setVehiclePaidInstallments: (v: number) => void;
  vehicleTotalInstallments: number;
  setVehicleTotalInstallments: (v: number) => void;
  installmentsDetail: InstallmentDetail[];
  setInstallmentsDetail: React.Dispatch<React.SetStateAction<InstallmentDetail[]>>;
  formatCurrency: (v: number) => string;
  vehicleInterestRate: number;
  setVehicleInterestRate: (v: number) => void;
  vehicleDueDay: number;
  setVehicleDueDay: (v: number) => void;
  referenceMonth: string;
  setReferenceMonth: (v: string) => void;
}

export const FinancingTab: React.FC<FinancingTabProps> = ({
  vehicleName,
  setVehicleName,
  vehicleTotalValue,
  setVehicleTotalValue,
  financing,
  setFinancing,
  vehiclePaidInstallments,
  setVehiclePaidInstallments,
  vehicleTotalInstallments,
  setVehicleTotalInstallments,
  installmentsDetail,
  setInstallmentsDetail,
  formatCurrency,
  vehicleInterestRate,
  setVehicleInterestRate,
  vehicleDueDay,
  setVehicleDueDay,
  referenceMonth,
  setReferenceMonth,
}) => {

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

  // Calculations
  const totalPaid = useMemo(() => {
    return installmentsDetail
      .filter(item => item.paid)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [installmentsDetail]);

  const paidCount = useMemo(() => {
    return installmentsDetail.filter(item => item.paid).length;
  }, [installmentsDetail]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, vehicleTotalValue - (paidCount * financing));
  }, [vehicleTotalValue, paidCount, financing]);


  // Percentage of total value paid (based on full installment value, consistent with remainingBalance)
  const progressPercent = useMemo(() => {
    if (!vehicleTotalValue) return 0;
    return Math.min(100, ((paidCount * financing) / vehicleTotalValue) * 100);
  }, [paidCount, financing, vehicleTotalValue]);

  // Next installment details
  const nextUnpaidInstallment = useMemo(() => {
    return installmentsDetail.find(item => !item.paid);
  }, [installmentsDetail]);

  const nextInstallmentDateStr = useMemo(() => {
    if (!nextUnpaidInstallment) return 'Quitada';
    const number = nextUnpaidInstallment.number;
    const startYear = 2026;
    const startMonth = 5; // June (0-indexed)
    const targetDate = new Date(startYear, startMonth + (number - 1), vehicleDueDay);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(vehicleDueDay)}/${pad(targetDate.getMonth() + 1)}/${targetDate.getFullYear()}`;
  }, [nextUnpaidInstallment, vehicleDueDay]);

  const getInstallmentDueDateStr = (number: number) => {
    const startYear = 2026;
    const startMonth = 5; // June (0-indexed)
    const targetDate = new Date(startYear, startMonth + (number - 1), vehicleDueDay);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const monthNamesFmt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${pad(vehicleDueDay)}/${monthNamesFmt[targetDate.getMonth()]}/${targetDate.getFullYear()}`;
  };

  // Adjust total number of installments in list
  const handleTotalInstallmentsChange = (newTotal: number) => {
    const total = Math.max(1, newTotal);
    setVehicleTotalInstallments(total);
    setInstallmentsDetail(prev => {
      const copy = [...prev];
      if (copy.length < total) {
        for (let i = copy.length + 1; i <= total; i++) {
          copy.push({
            number: i,
            amount: financing,
            paid: false,
          });
        }
      } else if (copy.length > total) {
        return copy.slice(0, total);
      }
      return copy;
    });
  };

  // Toggle paid status for an installment
  const handleTogglePaid = (number: number) => {
    setInstallmentsDetail(prev => {
      const updated = prev.map(item => {
        if (item.number === number) {
          const nextPaid = !item.paid;
          return { ...item, paid: nextPaid };
        }
        return item;
      });
      const newPaidCount = updated.filter(item => item.paid).length;
      setVehiclePaidInstallments(newPaidCount);
      return updated;
    });
  };

  // Edit amount for a single installment
  const handleAmountChange = (number: number, valueStr: string) => {
    const newAmount = parseCurrencyInput(valueStr);
    setInstallmentsDetail(prev => {
      return prev.map(item => {
        if (item.number === number) {
          return { ...item, amount: newAmount };
        }
        return item;
      });
    });
  };

  // Helper: Fill all unpaid installments with current monthly parcel value
  const handleFillRemainingWithDefault = () => {
    setInstallmentsDetail(prev => {
      return prev.map(item => {
        if (!item.paid) {
          return { ...item, amount: financing };
        }
        return item;
      });
    });
  };

  // Helper: Reset all to monthly parcel and check status based on paidInstallments count
  const handleResetToDefaults = () => {
    const freshDetails: InstallmentDetail[] = [];
    for (let i = 1; i <= vehicleTotalInstallments; i++) {
      freshDetails.push({
        number: i,
        amount: financing,
        paid: i <= vehiclePaidInstallments,
      });
    }
    setInstallmentsDetail(freshDetails);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-24">
      {/* Header */}
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

      {/* Main progress box (Visual Layout from Image) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        
        {/* Left Side: Balance and Progress */}
        <div className="flex-1 w-full space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo devedor atual</p>
            <p className="text-3xl md:text-4xl font-black text-indigo-600 mt-1">{formatCurrency(remainingBalance)}</p>
            <p className="text-xs font-black text-emerald-600 mt-1">{progressPercent.toFixed(0)}% do valor total</p>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>

          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-emerald-600">{formatCurrency(totalPaid)} pagos</span>
            <span className="text-slate-400">{formatCurrency(vehicleTotalValue)} total financiado</span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block w-px bg-slate-200 self-stretch my-2" />

        {/* Right Side: Next installment details */}
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

      {/* 4 Bottom Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Parcela mensal</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{formatCurrency(financing)}</p>
          </div>
        </div>


        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Parcelas totais</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{vehicleTotalInstallments}</p>
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

      {/* Inputs & Checklist Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Input Panel */}
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
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
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
                    value={formatInputDisplay(vehicleTotalValue)}
                    onChange={(e) => setVehicleTotalValue(parseCurrencyInput(e.target.value))}
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
                    value={formatInputDisplay(financing)}
                    onChange={(e) => setFinancing(parseCurrencyInput(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">⚠️ Informe o valor <strong>total</strong> da parcela mensal (não apenas a amortização). Cada parcela marcada como paga reduz o saldo devedor por este valor.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    value={vehicleTotalInstallments}
                    onChange={(e) => handleTotalInstallmentsChange(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={vehicleDueDay}
                    onChange={(e) => setVehicleDueDay(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa de Juros (% a.m.)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={vehicleInterestRate}
                    onChange={(e) => setVehicleInterestRate(Number(e.target.value))}
                    className="w-full pr-12 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">% a.m.</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                onClick={handleFillRemainingWithDefault}
                className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                title="Aplica o valor de parcela base em todas as parcelas não pagas"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Aplicar Parcela Base nas Restantes
              </button>

              <button
                onClick={handleResetToDefaults}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                Resetar Todas para Parcela Base
              </button>
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-200 flex items-center gap-2">
              <Award className="w-4 h-4" /> Amortização Direta
            </h4>
            <p className="text-xs leading-relaxed text-indigo-100">
              Ao pagar um valor diferente do base ou antecipar parcelas, altere o valor pago diretamente ao lado. O saldo devedor restante recalcula de forma automática e instantânea.
            </p>
          </div>
        </div>

        {/* Right Column: Installments checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                Detalhamento de Parcelas & Amortização
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">Controle Manual</span>
            </div>

            {/* Installments List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
              {installmentsDetail.map((item) => {
                const isAmortized = item.paid && item.amount !== financing;
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
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block">
                            Amortizado
                          </span>
                        )}
                        {item.paid && !isAmortized && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block">
                            Pago normal
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
                          value={formatInputDisplay(item.amount)}
                          onChange={(e) => handleAmountChange(item.number, e.target.value)}
                          disabled={!item.paid}
                          className={`w-full pl-8 pr-3 py-1.5 rounded-xl border outline-none font-bold text-xs text-right transition-all ${
                            item.paid
                              ? 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500 text-slate-700'
                              : 'bg-slate-100/50 border-slate-200 text-slate-400'
                          }`}
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
