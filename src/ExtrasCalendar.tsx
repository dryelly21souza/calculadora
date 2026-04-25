import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calculator, CheckCircle2, Camera, X, ZoomIn, Upload, Image as ImageIcon } from 'lucide-react';

interface ExtrasCalendarProps {
  extrasCalendar: Record<string, '60' | '110' | null>;
  toggleExtra: (dateStr: string) => void;
  baseSalary: number;
  calendarPhotos: Record<string, string[]>;
  addPhoto: (dateStr: string, dataUrl: string) => void;
  removePhoto: (dateStr: string, index: number) => void;
}

// ── Day Photo Modal ───────────────────────────────────────────────────────────

interface DayPhotoModalProps {
  dateStr: string;
  dateLabel: string;
  status: '60' | '110' | null;
  photos: string[];
  onClose: () => void;
  onAddPhoto: (dataUrl: string) => void;
  onRemovePhoto: (index: number) => void;
}

const DayPhotoModal: React.FC<DayPhotoModalProps> = ({
  dateStr, dateLabel, status, photos, onClose, onAddPhoto, onRemovePhoto
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const typeLabel = status === '60' ? 'Extra 60%' : status === '110' ? 'Extra 110%' : 'Sem marcação';
  const typeColor = status === '60' ? 'indigo' : status === '110' ? 'orange' : 'slate';

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) onAddPhoto(result);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Format date nicely
  const [y, m, d] = dateStr.split('-');
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const prettyDate = `${d} de ${monthNames[Number(m) - 1]} de ${y}`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-5 border-b border-slate-100 flex items-center justify-between bg-${typeColor}-50`}>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest text-${typeColor}-500 mb-0.5`}>
                {typeLabel}
              </p>
              <h3 className="text-lg font-black text-slate-800">{prettyDate}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/70 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold">Clique ou arraste fotos aqui</p>
                <p className="text-xs text-slate-400">PNG, JPG, WEBP — múltiplas fotos aceitas</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {/* Photo grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((src, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
                    <img
                      src={src}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setLightboxSrc(src)}
                        className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors shadow"
                        title="Ver foto"
                      >
                        <ZoomIn className="w-4 h-4 text-slate-700" />
                      </button>
                      <button
                        onClick={() => onRemovePhoto(idx)}
                        className="p-1.5 bg-white/90 rounded-lg hover:bg-rose-50 transition-colors shadow"
                        title="Remover foto"
                      >
                        <X className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                    {/* Index badge */}
                    <span className="absolute top-1 left-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-slate-300">
                <ImageIcon className="w-10 h-10" />
                <p className="text-sm font-medium">Nenhuma foto adicionada ainda</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs text-slate-400 font-medium">
              {photos.length} foto{photos.length !== 1 ? 's' : ''} nesta data
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Adicionar Foto
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxSrc}
            alt="Foto ampliada"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const ExtrasCalendar: React.FC<ExtrasCalendarProps> = ({
  extrasCalendar, toggleExtra, baseSalary, calendarPhotos, addPhoto, removePhoto
}) => {
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

  // Photo modal state
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const performAnalysis = () => {
    let prevYear = year;
    let prevMonthNum = month - 1;
    if (prevMonthNum < 0) { prevMonthNum = 11; prevYear--; }

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

  // Build calendar cells
  const days: React.ReactNode[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-2" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const status = extrasCalendar[dateStr];
    const photos = calendarPhotos[dateStr] ?? [];
    const hasPhotos = photos.length > 0;

    let bgClasses = 'bg-slate-50 hover:bg-slate-100 text-slate-700';
    if (status === '60') bgClasses = 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/30';
    else if (status === '110') bgClasses = 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30';

    days.push(
      <div key={dateStr} className="flex flex-col items-center gap-1">
        <button
          onClick={() => toggleExtra(dateStr)}
          className={`h-12 w-12 mx-auto rounded-full font-bold transition-all duration-200 flex items-center justify-center relative ${bgClasses}`}
          title={status ? `Extra ${status}% — clique para mudar` : 'Clique para marcar hora extra'}
        >
          {d}
        </button>
        {/* Camera icon — always visible but muted when no photos */}
        <button
          onClick={() => setSelectedDateStr(dateStr)}
          className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 transition-all duration-200 ${
            hasPhotos
              ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              : 'bg-transparent text-slate-300 hover:text-slate-500'
          }`}
          title={hasPhotos ? `${photos.length} foto(s)` : 'Adicionar foto'}
        >
          <Camera className="w-3 h-3" />
          {hasPhotos && (
            <span className="text-[10px] font-black leading-none">{photos.length}</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Marcação de Plantões</h2>
              <p className="text-sm text-slate-500 mt-1">Clique nos dias para registrar. 📷 para adicionar comprovantes.</p>
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

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center mb-8">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{day}</div>
            ))}
            {days}
          </div>

          {/* Legend & analysis */}
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
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex-shrink-0 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-sm font-semibold text-slate-600">Adicionar comprovante</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-start gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="text-indigo-500 mt-1">ℹ️</div>
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

      {/* Photo Modal */}
      {selectedDateStr && (
        <DayPhotoModal
          dateStr={selectedDateStr}
          dateLabel={selectedDateStr}
          status={extrasCalendar[selectedDateStr] ?? null}
          photos={calendarPhotos[selectedDateStr] ?? []}
          onClose={() => setSelectedDateStr(null)}
          onAddPhoto={(dataUrl) => addPhoto(selectedDateStr, dataUrl)}
          onRemovePhoto={(idx) => removePhoto(selectedDateStr, idx)}
        />
      )}
    </>
  );
};
