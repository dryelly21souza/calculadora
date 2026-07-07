import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calculator, CheckCircle2, Camera, X, ZoomIn, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from './lib/supabase';

interface ExtrasCalendarProps {
  extrasCalendar: Record<string, '60' | '110' | null>;
  toggleExtra: (dateStr: string) => void;
  baseSalary: number;
  calendarPhotos: Record<string, string[]>;
  addPhoto: (dateStr: string, dataUrl: string) => void;
  removePhoto: (dateStr: string, index: number) => void;
  referenceMonth: string;
  setReferenceMonth: (v: string) => void;
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
  dateStr, dateLabel, status, onClose, onAddPhoto, onRemovePhoto
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const typeLabel = status === '60' ? 'Extra 60%' : status === '110' ? 'Extra 110%' : 'Sem marcação';

  useEffect(() => {
    setIsLoading(true);
    supabase.from('calendar_photos').select('photos').eq('date_str', dateStr).single()
      .then(({ data }) => {
        setPhotos(data?.photos || []);
        setIsLoading(false);
      });
  }, [dateStr]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const p = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
      });
      reader.readAsDataURL(file);
      const dataUrl = await p;
      newImages.push(dataUrl);
    }
    const updatedPhotos = [...photos, ...newImages];
    setPhotos(updatedPhotos);
    onAddPhoto(newImages[0]); 
    await supabase.from('calendar_photos').upsert({ date_str: dateStr, photos: updatedPhotos });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeLocalPhoto = async (idx: number) => {
    const updated = photos.filter((_, i) => i !== idx);
    setPhotos(updated);
    onRemovePhoto(idx);
    await supabase.from('calendar_photos').upsert({ date_str: dateStr, photos: updated });
    setDeleteConfirmIdx(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800">{dateLabel}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${status === '60' ? 'bg-indigo-500' : status === '110' ? 'bg-orange-500' : 'bg-slate-300'}`} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{typeLabel}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
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

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-indigo-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-sm font-medium">Carregando fotos...</p>
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
              {photos.map((src, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-100 bg-slate-50">
                  <img src={src} alt="" className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setLightboxSrc(src)} className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-colors">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirmIdx(i)} className="p-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider">Nenhum comprovante anexado</p>
            </div>
          )}

          {deleteConfirmIdx !== null && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-200">
              <div>
                <p className="text-xs font-bold text-rose-800">Deseja excluir esta foto?</p>
                <p className="text-[10px] text-rose-600 mt-0.5">Esta ação não pode ser desfeita.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmIdx(null)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold">Cancelar</button>
                <button onClick={() => removeLocalPhoto(deleteConfirmIdx)} className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold">Excluir</button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400">
              {photos.length} foto(s)
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
    </div>

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

      {/* Exclusão Confirm Dialog */}
      {deleteConfirmIdx !== null && (
        <div 
          className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDeleteConfirmIdx(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir comprovante?</h3>
            <p className="text-slate-500 text-sm mb-6">Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteConfirmIdx(null)}
                className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (deleteConfirmIdx !== null) {
                    const idx = deleteConfirmIdx;
                    setPhotos(prev => {
                      const updated = prev.filter((_, i) => i !== idx);
                      if (updated.length === 0) {
                        supabase.from('calendar_photos').delete().eq('date_str', dateStr).then();
                      } else {
                        supabase.from('calendar_photos').upsert({ date_str: dateStr, photos: updated }).then();
                      }
                      return updated;
                    });
                    onRemovePhoto(idx);
                  }
                  setDeleteConfirmIdx(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const ExtrasCalendar: React.FC<ExtrasCalendarProps> = ({
  extrasCalendar,
  toggleExtra,
  baseSalary,
  calendarPhotos,
  addPhoto,
  removePhoto,
  referenceMonth,
  setReferenceMonth,
}) => {
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

  const [yearStr, monthStr_raw] = referenceMonth.split('-');
  const year = parseInt(yearStr || '2026');
  const month = parseInt(monthStr_raw || '7') - 1; // 0-indexed month

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

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
