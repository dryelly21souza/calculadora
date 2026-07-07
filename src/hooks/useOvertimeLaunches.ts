import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface OvertimeLaunch {
  id: string;
  date: string;
  type: '60' | '110';
  hours_qty: number;
  minutes_qty: number;
  value: number;
  payment_sheet: string;
  description?: string;
  status: 'Pendente' | 'Recebido';
  created_at?: string;
}

export const useOvertimeLaunches = () => {
  const [launches, setLaunches] = useState<OvertimeLaunch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLaunches = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('overtime_launches')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) setLaunches(data as OvertimeLaunch[]);
    } catch (err) {
      console.error('Error loading overtime launches:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLaunches();
  }, [loadLaunches]);

  const addLaunch = async (launch: Omit<OvertimeLaunch, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('overtime_launches')
        .insert([launch])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setLaunches(prev => [data[0] as OvertimeLaunch, ...prev]);
        return { data: data[0] as OvertimeLaunch, error: null };
      }
      return { data: null, error: 'Failed to insert launch record' };
    } catch (err: any) {
      console.error('Error inserting overtime launch:', err);
      return { data: null, error: err.message || 'Error occurred' };
    }
  };

  const updateLaunch = async (id: string, updates: Partial<OvertimeLaunch>) => {
    try {
      const { error } = await supabase
        .from('overtime_launches')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setLaunches(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error updating overtime launch:', err);
      return { success: false, error: err.message || 'Error occurred' };
    }
  };

  const deleteLaunch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('overtime_launches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLaunches(prev => prev.filter(item => item.id !== id));
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error deleting overtime launch:', err);
      return { success: false, error: err.message || 'Error occurred' };
    }
  };

  return {
    launches,
    isLoading,
    addLaunch,
    updateLaunch,
    deleteLaunch,
    reloadLaunches: loadLaunches,
  };
};
