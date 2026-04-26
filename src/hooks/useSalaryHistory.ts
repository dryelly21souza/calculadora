import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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

export function useSalaryHistory() {
  const [history, setHistory] = useState<SalaryCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncLocalStorageToSupabase = async () => {
    try {
      const raw = localStorage.getItem('salary_history');
      if (raw) {
        const localData = JSON.parse(raw) as SalaryCalculation[];
        if (localData.length > 0) {
          const { data, error } = await supabase.from('salary_calculations').select('id').limit(1);
          if (!error && data && data.length === 0) {
            // Push to supabase
            const itemsToInsert = localData.map(item => {
              const { id, ...rest } = item;
              return rest;
            });
            await supabase.from('salary_calculations').insert(itemsToInsert);
          }
          localStorage.removeItem('salary_history');
        }
      }
    } catch (e) {
      console.error('Migration error', e);
    }
  };

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await syncLocalStorageToSupabase();
      
      const { data, error } = await supabase
        .from('salary_calculations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCalculation = async (calculation: SalaryCalculation) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('salary_calculations')
        .insert([calculation])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setHistory(prev => [data[0], ...prev]);
        return { success: true, data };
      }
      return { success: false, error: 'No data returned' };
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
      const { error } = await supabase
        .from('salary_calculations')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    error,
    saveCalculation,
    loadHistory,
    deleteCalculation,
  };
}
