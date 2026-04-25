import { useState, useEffect } from 'react';

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

const KEYS = {
  fixedBills: 'expenses_fixed_bills',
  expenses: 'expenses_list',
  savedBalances: 'expenses_saved_balances',
  initializedMonths: 'expenses_initialized_months',
};

function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback; }
  catch { return fallback; }
}
function save<T>(key: string, v: T) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}
function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useExpensesData = () => {
  const [fixedBills, setFixedBills] = useState<FixedBill[]>(() => load(KEYS.fixedBills, []));
  const [expenses, setExpensesState] = useState<Expense[]>(() => load(KEYS.expenses, []));
  const [savedBalanceMap, setSavedBalanceMap] = useState<Record<string, number>>(() => load(KEYS.savedBalances, {}));
  const [initializedMonths, setInitializedMonths] = useState<string[]>(() => load(KEYS.initializedMonths, []));
  const [isLoading] = useState(false);

  useEffect(() => { save(KEYS.fixedBills, fixedBills); }, [fixedBills]);
  useEffect(() => { save(KEYS.expenses, expenses); }, [expenses]);
  useEffect(() => { save(KEYS.savedBalances, savedBalanceMap); }, [savedBalanceMap]);
  useEffect(() => { save(KEYS.initializedMonths, initializedMonths); }, [initializedMonths]);

  const addExpense = async (exp: Omit<Expense, 'id'>) => {
    const n: Expense = { ...exp, id: uuid() };
    setExpensesState(p => [...p, n]);
    return { data: n, error: null };
  };
  const addManyExpenses = async (exps: Omit<Expense, 'id'>[]) => {
    const ns = exps.map(e => ({ ...e, id: uuid() }));
    setExpensesState(p => [...p, ...ns]);
    return { data: ns, error: null };
  };
  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    setExpensesState(p => p.map(e => e.id === id ? { ...e, ...updates } : e));
  };
  const deleteExpense = async (id: string) => {
    setExpensesState(p => p.filter(e => e.id !== id));
  };
  const addFixedBill = async (fb: Omit<FixedBill, 'id'>) => {
    const n: FixedBill = { ...fb, id: uuid() };
    setFixedBills(p => [...p, n]);
    return { data: n, error: null };
  };
  const updateFixedBill = async (id: string, updates: Partial<FixedBill>) => {
    setFixedBills(p => p.map(fb => fb.id === id ? { ...fb, ...updates } : fb));
    // Also update linked pending expenses amount if amount changed
    if (updates.amount !== undefined) {
      setExpensesState(p => p.map(e =>
        e.fixed_bill_id === id && e.status === 'pending' ? { ...e, amount: updates.amount! } : e
      ));
    }
  };
  const deleteFixedBill = async (id: string) => {
    setFixedBills(p => p.filter(fb => fb.id !== id));
    setExpensesState(p => p.filter(e => !(e.fixed_bill_id === id && e.status === 'pending')));
  };
  const updateSavedBalance = async (monthStr: string, amount: number) => {
    setSavedBalanceMap(p => ({ ...p, [monthStr]: amount }));
  };
  const markMonthInitialized = async (monthStr: string) => {
    setInitializedMonths(p => p.includes(monthStr) ? p : [...p, monthStr]);
  };
  const setExpenses = (u: Expense[] | ((p: Expense[]) => Expense[])) => {
    setExpensesState(u as any);
  };

  return {
    fixedBills, expenses, savedBalanceMap, initializedMonths, isLoading,
    addExpense, addManyExpenses, updateExpense, deleteExpense,
    addFixedBill, updateFixedBill, deleteFixedBill,
    updateSavedBalance, markMonthInitialized, setExpenses,
  };
};
