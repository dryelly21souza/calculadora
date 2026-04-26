import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type ExtraType = '60' | '110' | null;

export function useCalendarMarks() {
  const [calendarMarks, setCalendarMarks] = useState<Record<string, ExtraType>>({});
  const [calendarPhotos, setCalendarPhotos] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncLocalStorageToSupabase = async () => {
    try {
      const rawMarks = localStorage.getItem('calendar_marks');
      if (rawMarks) {
        const localMarks = JSON.parse(rawMarks) as Record<string, ExtraType>;
        const keys = Object.keys(localMarks);
        if (keys.length > 0) {
          const { data, error } = await supabase.from('calendar_marks').select('date_str').limit(1);
          if (!error && data && data.length === 0) {
            const items = keys.map(k => ({ date_str: k, mark_type: localMarks[k] }));
            await supabase.from('calendar_marks').insert(items);
          }
          localStorage.removeItem('calendar_marks');
        }
      }

      const rawPhotos = localStorage.getItem('calendar_photos');
      if (rawPhotos) {
        const localPhotos = JSON.parse(rawPhotos) as Record<string, string[]>;
        const keys = Object.keys(localPhotos);
        if (keys.length > 0) {
          const { data, error } = await supabase.from('calendar_photos').select('date_str').limit(1);
          if (!error && data && data.length === 0) {
            const items = keys.map(k => ({ date_str: k, photos: localPhotos[k] }));
            await supabase.from('calendar_photos').insert(items);
          }
          localStorage.removeItem('calendar_photos');
        }
      }
    } catch (e) {
      console.error('Migration error', e);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await syncLocalStorageToSupabase();
      
      const { data: marksData } = await supabase.from('calendar_marks').select('*');
      const marksMap: Record<string, ExtraType> = {};
      marksData?.forEach(m => { marksMap[m.date_str] = m.mark_type; });
      setCalendarMarks(marksMap);

      const { data: photosData } = await supabase.from('calendar_photos').select('*');
      const photosMap: Record<string, string[]> = {};
      photosData?.forEach(p => { photosMap[p.date_str] = p.photos; });
      setCalendarPhotos(photosMap);

    } catch (err: any) {
      setError(err.message);
      console.error('Error loading calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleMark = async (dateStr: string) => {
    setCalendarMarks(prev => {
      const current = prev[dateStr];
      const nextType: ExtraType = current === '60' ? '110' : current === '110' ? null : '60';
      const newMap = { ...prev };
      
      if (nextType === null) {
        delete newMap[dateStr];
        supabase.from('calendar_marks').delete().eq('date_str', dateStr).then();
      } else {
        newMap[dateStr] = nextType;
        supabase.from('calendar_marks').upsert({ date_str: dateStr, mark_type: nextType }).then();
      }
      return newMap;
    });
  };

  const addPhoto = async (dateStr: string, dataUrl: string) => {
    setCalendarPhotos(prev => {
      const existing = prev[dateStr] ?? [];
      const updatedArr = [...existing, dataUrl];
      const newMap = { ...prev, [dateStr]: updatedArr };
      supabase.from('calendar_photos').upsert({ date_str: dateStr, photos: updatedArr }).then();
      return newMap;
    });
  };

  const removePhoto = async (dateStr: string, index: number) => {
    setCalendarPhotos(prev => {
      const existing = prev[dateStr] ?? [];
      const updatedArr = existing.filter((_, i) => i !== index);
      const newMap = { ...prev };
      
      if (updatedArr.length === 0) {
        delete newMap[dateStr];
        supabase.from('calendar_photos').delete().eq('date_str', dateStr).then();
      } else {
        newMap[dateStr] = updatedArr;
        supabase.from('calendar_photos').upsert({ date_str: dateStr, photos: updatedArr }).then();
      }
      return newMap;
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    calendarMarks,
    calendarPhotos,
    toggleMark,
    addPhoto,
    removePhoto,
    isLoading,
    error,
  };
}
