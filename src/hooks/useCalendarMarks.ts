import { useState, useEffect, useCallback } from 'react';

type ExtraType = '60' | '110' | null;

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'calendar_marks';

function loadMarksFromStorage(): Record<string, ExtraType> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ExtraType>) : {};
  } catch {
    return {};
  }
}

function saveMarksToStorage(marks: Record<string, ExtraType>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
  } catch (e) {
    console.error('localStorage write error:', e);
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCalendarMarks() {
  const [calendarMarks, setCalendarMarks] = useState<Record<string, ExtraType>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMarks = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const data = loadMarksFromStorage();
      setCalendarMarks(data);
    } catch (err: any) {
      console.error('Error loading calendar marks:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleMark = (dateStr: string) => {
    setCalendarMarks(prev => {
      const current = prev[dateStr];
      const nextType: ExtraType =
        current === '60' ? '110' : current === '110' ? null : '60';

      const newMap = { ...prev };
      if (nextType === null) {
        delete newMap[dateStr];
      } else {
        newMap[dateStr] = nextType;
      }

      saveMarksToStorage(newMap);
      return newMap;
    });
  };

  useEffect(() => {
    loadMarks();
  }, [loadMarks]);

  return {
    calendarMarks,
    toggleMark,
    isLoading,
    error,
  };
}
