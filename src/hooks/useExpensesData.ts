import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FixedBill {
  id: string;
  name: string;
  amount: number;
  category: string;
  due_day: number;
  frequency: 'Mensal';
  expense_type: 'fixo' | 'variavel';
  payment_period: 'quinzena' | 'mes';
}

export interface Expense {
  id: string;
  fixed_bill_id?: string | null;
  name: string;
  amount: number;
  category: string;
  date_str: string;
  status: 'pending' | 'paid';
  card_name?: string;
  expense_type: 'fixo' | 'variavel';
  payment_period: 'quinzena' | 'mes';
}

export const useExpensesData = () => {
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [savedBalanceMap, setSavedBalanceMap] = useState<Record<string, number>>({});
  const [initializedMonths, setInitializedMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const syncLocalStorageToSupabase = async () => {
    try {
      const fbStr = localStorage.getItem('expenses_fixed_bills');
      if (fbStr) {
        const local = JSON.parse(fbStr) as FixedBill[];
        if (local.length > 0) {
          const { data, error } = await supabase.from('fixed_bills').select('id').limit(1);
          if (!error && data && data.length === 0) {
            await supabase.from('fixed_bills').insert(local.map(item => ({...item, id: undefined})));
          }
        }
        localStorage.removeItem('expenses_fixed_bills');
      }

      const expStr = localStorage.getItem('expenses_list');
      if (expStr) {
        const local = JSON.parse(expStr) as Expense[];
        if (local.length > 0) {
          const { data, error } = await supabase.from('expenses').select('id').limit(1);
          if (!error && data && data.length === 0) {
            await supabase.from('expenses').insert(local.map(item => ({...item, id: undefined, fixed_bill_id: null})));
          }
        }
        localStorage.removeItem('expenses_list');
      }

      const sbStr = localStorage.getItem('expenses_saved_balances');
      if (sbStr) {
        const local = JSON.parse(sbStr) as Record<string, number>;
        const keys = Object.keys(local);
        if (keys.length > 0) {
          const { data, error } = await supabase.from('saved_balances').select('month_str').limit(1);
          if (!error && data && data.length === 0) {
            await supabase.from('saved_balances').insert(keys.map(k => ({ month_str: k, amount: local[k] })));
          }
        }
        localStorage.removeItem('expenses_saved_balances');
      }

      const initStr = localStorage.getItem('expenses_initialized_months');
      if (initStr) {
        const local = JSON.parse(initStr) as string[];
        if (local.length > 0) {
          const { data, error } = await supabase.from('initialized_months').select('month_str').limit(1);
          if (!error && data && data.length === 0) {
            await supabase.from('initialized_months').insert(local.map(k => ({ month_str: k })));
          }
        }
        localStorage.removeItem('expenses_initialized_months');
      }
    } catch (e) {
      console.error('Migration error expenses', e);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await syncLocalStorageToSupabase();

      const [fbRes, expRes, sbRes, initRes] = await Promise.all([
        supabase.from('fixed_bills').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('saved_balances').select('*'),
        supabase.from('initialized_months').select('*'),
      ]);

      if (fbRes.data) setFixedBills(fbRes.data as FixedBill[]);
      if (expRes.data) setExpensesState(expRes.data as Expense[]);
      
      if (sbRes.data) {
        const map: Record<string, number> = {};
        sbRes.data.forEach(d => { map[d.month_str] = d.amount; });
        setSavedBalanceMap(map);
      }

      if (initRes.data) {
        setInitializedMonths(initRes.data.map(d => d.month_str));
      }
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addExpense = async (exp: Omit<Expense, 'id'>) => {
    const { data } = await supabase.from('expenses').insert([exp]).select();
    if (data && data[0]) {
      setExpensesState(p => [...p, data[0]]);
      return { data: data[0], error: null };
    }
    return { data: null, error: 'Error adding expense' };
  };

  const addManyExpenses = async (exps: Omit<Expense, 'id'>[]) => {
    const { data } = await supabase.from('expenses').insert(exps).select();
    if (data) {
      setExpensesState(p => [...p, ...data]);
      return { data, error: null };
    }
    return { data: null, error: 'Error adding many expenses' };
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    await supabase.from('expenses').update(updates).eq('id', id);
    setExpensesState(p => p.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpensesState(p => p.filter(e => e.id !== id));
  };

  const addFixedBill = async (fb: Omit<FixedBill, 'id'>) => {
    const { data } = await supabase.from('fixed_bills').insert([fb]).select();
    if (data && data[0]) {
      setFixedBills(p => [...p, data[0]]);
      return { data: data[0], error: null };
    }
    return { data: null, error: 'Error adding fixed bill' };
  };

  const updateFixedBill = async (id: string, updates: Partial<FixedBill>) => {
    await supabase.from('fixed_bills').update(updates).eq('id', id);
    setFixedBills(p => p.map(fb => fb.id === id ? { ...fb, ...updates } : fb));
    
    if (updates.amount !== undefined) {
      setExpensesState(p => p.map(e => {
        if (e.fixed_bill_id === id && e.status === 'pending') {
          supabase.from('expenses').update({ amount: updates.amount }).eq('id', e.id).then();
          return { ...e, amount: updates.amount! };
        }
        return e;
      }));
    }
  };

  const deleteFixedBill = async (id: string) => {
    await supabase.from('fixed_bills').delete().eq('id', id);
    setFixedBills(p => p.filter(fb => fb.id !== id));
    setExpensesState(p => p.filter(e => {
      if (e.fixed_bill_id === id && e.status === 'pending') {
        supabase.from('expenses').delete().eq('id', e.id).then();
        return false;
      }
      return true;
    }));
  };

  const updateSavedBalance = async (monthStr: string, amount: number) => {
    await supabase.from('saved_balances').upsert({ month_str: monthStr, amount });
    setSavedBalanceMap(p => ({ ...p, [monthStr]: amount }));
  };

  const markMonthInitialized = async (monthStr: string) => {
    await supabase.from('initialized_months').upsert({ month_str: monthStr });
    setInitializedMonths(p => p.includes(monthStr) ? p : [...p, monthStr]);
  };

  const setExpenses = (u: Expense[] | ((p: Expense[]) => Expense[])) => {
    if (typeof u === 'function') {
      setExpensesState(u);
    } else {
      setExpensesState(u);
    }
  };

  return {
    fixedBills, expenses, savedBalanceMap, initializedMonths, isLoading,
    addExpense, addManyExpenses, updateExpense, deleteExpense,
    addFixedBill, updateFixedBill, deleteFixedBill,
    updateSavedBalance, markMonthInitialized, setExpenses,
  };
};
