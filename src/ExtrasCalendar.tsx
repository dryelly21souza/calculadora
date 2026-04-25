import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calculator, CheckCircle2 } from 'lucide-react';

interface ExtrasCalendarProps {
  extrasCalendar: Record<string, '60' | '110' | null>;
  toggleExtra: (dateStr: string) => void;
  baseSalary: number;
}

export const ExtrasCalendar: React.FC<ExtrasCalendarProps> = ({ extrasCalendar, toggleExtra, baseSalary }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  
  const [analysis, setAnalysis] = useState<null | {
    monthStr: string,
    startDateFmt: string,
    endDateFmt: string,
    count60: number,
    count110: number,
    est60: number,
    est110: number,
    totalEst: number
  }>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const performAnalysis = () => {
    let prevYear = year;
    let prevMonthNum = month - 1;
    if (prevMonthNum < 0) {
      prevMonthNum = 11;
      prevYear--;
    }
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    const startDateStr = `${prevYear}-${pad(prevMonthNum + 1)}-15`;
    const endDateStr = `${year}-${pad(month + 1)}-14`;
    
    let count60 = 0;
    let count110 = 0;
    
    Object.entries(extrasCalendar).forEach(([dateStr, type]) => {
      if (dateStr >= startDateStr && dateStr <= endDateStr) {
        if (type === '60') count60++;
        else if (type === '110') count110++;
      }
    });

    const formatCurrency = (val: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const ot60HoursTotal = count60 * 1.5;
    const ot60Rate = 20.03; 
    const ot60Value = ot60Rate * ot60HoursTotal;
    
    const ot110Value = count110 * 194.50;
    const totalEst = ot60Value + ot110Value;
    
    setAnalysis({
      monthStr: monthNames[month],
      startDateFmt: `15/${pad(prevMonthNum + 1)}/${prevYear}`,
      endDateFmt: `14/${pad(month + 1)}/${year}`,
      count60,
      count110,
      est60: ot60Value,
      est110: ot110Value,
      totalEst
    });
  };

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-2"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const status = extrasCalendar[dateStr];
    
    let bgClasses = 'bg-slate-50 hover:bg-slate-100 text-slate-700';
    if (status === '60') {
      bgClasses = 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/30';
    } else if (status === '110') {
      bgClasses = 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30';
    }

    days.push(
      <button
        key={dateStr}
        onClick={() => toggleExtra(dateStr)}
        className={`h-12 w-12 mx-auto rounded-full font-bold transition-all duration-200 flex items-center justify-center ${bgClasses}`}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Marcação de Plantões</h2>
            <p className="text-sm text-slate-500 mt-1">Clique nos dias trabalhados para registrar.</p>
          </div>
          
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

        <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-8">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{day}</div>
          ))}
          {days}
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Como funciona o Clique?</h3>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/30 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">1x</div>
              <span className="text-sm font-semibold text-slate-600">Extra Comum (60%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 shadow-md shadow-orange-500/30 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">2x</div>
              <span className="text-sm font-semibold text-slate-600">Domingo/Feriado (110%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center text-slate-400 text-xs font-bold">3x</div>
              <span className="text-sm font-semibold text-slate-600">Limpa Dia</span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-start gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="text-indigo-500 mt-0.5 mt-1">ℹ️</div>
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                <strong>Inteligência de Ciclo (15 a 14):</strong> O sistema lê automaticamente todos os seus dias do mês passado até o mês atual 
                e joga o número no Dashboard fechado. Por exemplo: O Salário de Maio buscará os plantões computados de <strong className="text-indigo-600">15 de Abril a 14 de Maio</strong>.
              </p>
            </div>
            
            <button
              onClick={performAnalysis}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 transition-colors text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-md"
            >
              <Calculator className="w-5 h-5" />
              Analisar Payout deste Mês
            </button>

            {analysis && (
              <div className="mt-6 bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
                <h3 className="font-black text-lg text-indigo-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  Resumo: Mês de {analysis.monthStr}
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  O sistema analisou as marcações criadas do dia <strong>{analysis.startDateFmt}</strong> até <strong>{analysis.endDateFmt}</strong>.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-sm font-bold text-slate-600">Extras Padrão (60%)</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-black rounded-lg">{analysis.count60} dias</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-sm font-bold text-slate-600">Domingos/Feriados (110%)</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 font-black rounded-lg">{analysis.count110} dias</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">Estimativa de Pagamento</p>
                  <p className="text-3xl font-black text-indigo-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analysis.totalEst)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    *Cálculo estimativo utilizando a Base Salarial do Dashboard como referência pro cálculo do valor-hora.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
