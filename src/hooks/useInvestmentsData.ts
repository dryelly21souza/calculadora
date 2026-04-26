import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Investment {
  id: string;
  amount: number;
  date_str: string;
  type: string;
  description?: string;
}

export function useInvestmentsData() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(0);

  const syncLocalStorageToSupabase = async () => {
    try {
      const invStr = localStorage.getItem('investments_data');
      if (invStr) {
        const local = JSON.parse(invStr) as Investment[];
        if (local.length > 0) {
          const { data, error } = await supabase.from('investments').select('id').limit(1);
          if (!error && data && data.length === 0) {
            await supabase.from('investments').insert(local.map(item => ({...item, id: undefined})));
          }
        }
        localStorage.removeItem('investments_data');
      }

      const goalStr = localStorage.getItem('investment_monthly_goal');
      if (goalStr) {
        const val = Number(goalStr);
        if (val > 0) {
          const { data, error } = await supabase.from('investment_goals').select('id').limit(1);
          if (!error && data && data.length === 0) {
            await supabase.from('investment_goals').insert({ goal_amount: val });
          }
        }
        localStorage.removeItem('investment_monthly_goal');
      }
    } catch (e) {
      console.error('Migration error investments', e);
    }
  };

  const loadData = useCallback(async () => {
    try {
      await syncLocalStorageToSupabase();

      const { data: invData } = await supabase.from('investments').select('*').order('date_str', { ascending: false });
      if (invData) setInvestments(invData as Investment[]);

      const { data: goalData } = await supabase.from('investment_goals').select('*').order('created_at', { ascending: false }).limit(1);
      if (goalData && goalData.length > 0) {
        setMonthlyGoal(goalData[0].goal_amount);
      }
    } catch (err) {
      console.error('Error loading investments:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addInvestment = async (inv: Omit<Investment, 'id'>) => {
    const { data } = await supabase.from('investments').insert([inv]).select();
    if (data && data[0]) {
      setInvestments(prev => [...prev, data[0]]);
    }
  };

  const deleteInvestment = async (id: string) => {
    await supabase.from('investments').delete().eq('id', id);
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  const updateMonthlyGoal = async (amount: number) => {
    await supabase.from('investment_goals').insert([{ goal_amount: amount }]);
    setMonthlyGoal(amount);
  };

  return {
    investments,
    monthlyGoal,
    setMonthlyGoal: updateMonthlyGoal,
    addInvestment,
    deleteInvestment
  };
}
