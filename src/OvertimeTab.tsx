import React, { useMemo } from 'react';
import { Clock, DollarSign, CalendarDays } from 'lucide-react';
import { ExtrasCalendar } from './ExtrasCalendar';

interface OvertimeTabProps {
  extrasCalendar: Record<string, '60' | '110' | null>;
  toggleExtra: (dateStr: string) => void;
  baseSalary: number;
  calendarPhotos: Record<string, string[]>;
  addPhoto: (dateStr: string, dataUrl: string) => void;
  removePhoto: (dateStr: string, index: number) => void;
  referenceMonth: string;
  setReferenceMonth: (v: string) => void;
  calculations: {
    ot60HoursTotal: number;
    ot110HoursTotal: number;
    totalExtras: number;
    hora60: number;
    hora110: number;
  };
  formatCurrency: (v: number) => string;
}

export const OvertimeTab: React.FC<OvertimeTabProps> = ({
  extrasCalendar,
  toggleExtra,
  baseSalary,
  calendarPhotos,
  addPhoto,
  removePhoto,
  referenceMonth,
  setReferenceMonth,
  calculations,
  formatCurrency,
}) => {
  
  // Calculate formatted total hours (ex: 35h 20min)
  const totalMinutes = useMemo(() => {
    const totalHoursNum = calculations.ot60HoursTotal + calculations.ot110HoursTotal;
    const hours = Math.floor(totalHoursNum);
    const mins = Math.round((totalHoursNum - hours) * 60);
    return { hours, mins };
  }, [calculations.ot60HoursTotal, calculations.ot110HoursTotal]);

  const totalHoursStr = useMemo(() => {
    return `${totalMinutes.hours}h ${totalMinutes.mins.toString().padStart(2, '0')}min`;
  }, [totalMinutes]);

  // Generate historical list of marked days in the current reference calendar month
  const calendarLaunchesList = useMemo(() => {
    const list: { date: string; type: string; value: number; sheet: string }[] = [];
    if (!referenceMonth) return [];

    Object.entries(extrasCalendar).forEach(([dateStr, type]) => {
      if (type && dateStr.startsWith(referenceMonth)) {
        const hoursVal = type === '60' ? 1.5 : 7.33;
        const rate = type === '60' ? calculations.hora60 : calculations.hora110;
        const totalVal = rate * hoursVal;

        list.push({
          date: dateStr,
          type: type === '60' ? '60%' : '110%',
          value: totalVal,
          sheet: referenceMonth
        });
      }
    });

    // Sort by date descending
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [extrasCalendar, referenceMonth, calculations.hora60, calculations.hora110]);

  const getMonthNamePortuguese = (refMonth: string) => {
    const [year, monthStr] = refMonth.split('-');
    const monthIndex = Number(monthStr) - 1;
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[monthIndex]}/${year}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">


      {/* Re-positioned Marking Calendar */}
      <ExtrasCalendar
        extrasCalendar={extrasCalendar}
        toggleExtra={toggleExtra}
        baseSalary={baseSalary}
        calendarPhotos={calendarPhotos}
        addPhoto={addPhoto}
        removePhoto={removePhoto}
        referenceMonth={referenceMonth}
        setReferenceMonth={setReferenceMonth}
      />

      {/* Overtime History List (with only requested columns) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
          <CalendarDays className="w-5 h-5 text-indigo-500" />
          Histórico de Horas Extras
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Data</th>
                <th className="py-4 px-4">Tipo</th>
                <th className="py-4 px-4">Valor</th>
                <th className="py-4 px-4">Folha de Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-600">
              {calendarLaunchesList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Nenhum plantão marcado no calendário para este ciclo.
                  </td>
                </tr>
              ) : (
                calendarLaunchesList.map((launch, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-800">
                      {launch.date.split('-').reverse().join('/')}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        launch.type === '60%' 
                          ? 'bg-indigo-50 text-indigo-600' 
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        {launch.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-black text-slate-800">
                      {formatCurrency(launch.value)}
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-bold">
                      {getMonthNamePortuguese(launch.sheet)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
