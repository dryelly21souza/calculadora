import { useState, useEffect, useCallback } from 'react';

export interface SalaryCalculation {
  id?: string;
  created_at?: string;
  reference_month: string;
  base_salary: number;
  advance_payment: number;
  ot60_days: number;
  ot110_days: number;
  ot60_value: number;
  ot110_value: number;
  gross_salary: number;
  inss_deduction: number;
  fixed_deductions: number;
  fgts_value: number;
  net_salary: number;
  second_payment: number;
  notes?: string;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'salary_history';

function loadHistory(): SalaryCalculation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SalaryCalculation[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: SalaryCalculation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('localStorage write error:', e);
  }
}

function uuid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSalaryHistory() {
  const [history, setHistory] = useState<SalaryCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromStorage = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const data = loadHistory();
      // Most recent first
      setHistory(data.slice().sort((a, b) => {
        const ta = new Date(a.created_at ?? 0).getTime();
        const tb = new Date(b.created_at ?? 0).getTime();
        return tb - ta;
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCalculation = async (calculation: SalaryCalculation) => {
    setIsLoading(true);
    setError(null);
    try {
      const all = loadHistory();
      const newEntry: SalaryCalculation = {
        ...calculation,
        id: uuid(),
        created_at: new Date().toISOString(),
      };
      const updated = [newEntry, ...all];
      saveHistory(updated);
      setHistory(updated);
      return { success: true, data: [newEntry] };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCalculation = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = loadHistory().filter(item => item.id !== id);
      saveHistory(updated);
      setHistory(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return {
    history,
    isLoading,
    error,
    saveCalculation,
    loadHistory: loadFromStorage,
    deleteCalculation,
  };
}
