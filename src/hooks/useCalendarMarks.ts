import { useState, useEffect, useCallback } from 'react';

type ExtraType = '60' | '110' | null;

// ── localStorage helpers ──────────────────────────────────────────────────────

const MARKS_KEY = 'calendar_marks';
const PHOTOS_KEY = 'calendar_photos'; // Record<dateStr, string[]>  (base64 data URLs)

function loadMarksFromStorage(): Record<string, ExtraType> {
  try {
    const raw = localStorage.getItem(MARKS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ExtraType>) : {};
  } catch {
    return {};
  }
}

function saveMarksToStorage(marks: Record<string, ExtraType>): void {
  try {
    localStorage.setItem(MARKS_KEY, JSON.stringify(marks));
  } catch (e) {
    console.error('localStorage write error (marks):', e);
  }
}

function loadPhotosFromStorage(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(PHOTOS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function savePhotosToStorage(photos: Record<string, string[]>): void {
  try {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
  } catch (e) {
    console.error('localStorage write error (photos):', e);
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCalendarMarks() {
  const [calendarMarks, setCalendarMarks] = useState<Record<string, ExtraType>>({});
  const [calendarPhotos, setCalendarPhotos] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMarks = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      setCalendarMarks(loadMarksFromStorage());
      setCalendarPhotos(loadPhotosFromStorage());
    } catch (err: any) {
      console.error('Error loading calendar data:', err.message);
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

  /** Add a photo (base64 data URL) to a given date */
  const addPhoto = (dateStr: string, dataUrl: string) => {
    setCalendarPhotos(prev => {
      const existing = prev[dateStr] ?? [];
      const updated = { ...prev, [dateStr]: [...existing, dataUrl] };
      savePhotosToStorage(updated);
      return updated;
    });
  };

  /** Remove a photo by index from a given date */
  const removePhoto = (dateStr: string, index: number) => {
    setCalendarPhotos(prev => {
      const existing = prev[dateStr] ?? [];
      const updated = { ...prev, [dateStr]: existing.filter((_, i) => i !== index) };
      if (updated[dateStr].length === 0) delete updated[dateStr];
      savePhotosToStorage(updated);
      return updated;
    });
  };

  useEffect(() => {
    loadMarks();
  }, [loadMarks]);

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
