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

// ── localStorage helpers ──────────────────────────────────────────────────────

const KEYS = {
  fixedBills: 'expenses_fixed_bills',
  expenses: 'expenses_list',
  savedBalances: 'expenses_saved_balances',
  initializedMonths: 'expenses_initialized_months',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
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

export const useExpensesData = () => {
  const [fixedBills, setFixedBillsState] = useState<FixedBill[]>(() =>
    load<FixedBill[]>(KEYS.fixedBills, [])
  );
  const [expenses, setExpensesState] = useState<Expense[]>(() =>
    load<Expense[]>(KEYS.expenses, [])
  );
  const [savedBalanceMap, setSavedBalanceMapState] = useState<Record<string, number>>(() =>
    load<Record<string, number>>(KEYS.savedBalances, {})
  );
  const [initializedMonths, setInitializedMonthsState] = useState<string[]>(() =>
    load<string[]>(KEYS.initializedMonths, [])
  );
  const [isLoading] = useState(false);

  // Persist whenever state changes
  useEffect(() => { save(KEYS.fixedBills, fixedBills); }, [fixedBills]);
  useEffect(() => { save(KEYS.expenses, expenses); }, [expenses]);
  useEffect(() => { save(KEYS.savedBalances, savedBalanceMap); }, [savedBalanceMap]);
  useEffect(() => { save(KEYS.initializedMonths, initializedMonths); }, [initializedMonths]);

  // ── Expenses ──────────────────────────────────────────────────────────────

  const addExpense = async (exp: Omit<Expense, 'id'>) => {
    const newExp: Expense = { ...exp, id: uuid() };
    setExpensesState(prev => [...prev, newExp]);
    return { data: newExp, error: null };
  };

  const addManyExpenses = async (exps: Omit<Expense, 'id'>[]) => {
    const newExps: Expense[] = exps.map(e => ({ ...e, id: uuid() }));
    setExpensesState(prev => [...prev, ...newExps]);
    return { data: newExps, error: null };
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    setExpensesState(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExpense = async (id: string) => {
    setExpensesState(prev => prev.filter(e => e.id !== id));
  };

  // ── Fixed Bills ───────────────────────────────────────────────────────────

  const addFixedBill = async (fb: Omit<FixedBill, 'id'>) => {
    const newFb: FixedBill = { ...fb, id: uuid() };
    setFixedBillsState(prev => [...prev, newFb]);
    return { data: newFb, error: null };
  };

  const updateFixedBill = async (id: string, updates: Partial<FixedBill>) => {
    setFixedBillsState(prev => prev.map(fb => fb.id === id ? { ...fb, ...updates } : fb));
  };

  const deleteFixedBill = async (id: string) => {
    setFixedBillsState(prev => prev.filter(fb => fb.id !== id));
    setExpensesState(prev =>
      prev.filter(e => !(e.fixed_bill_id === id && e.status === 'pending'))
    );
  };

  // ── Balances & Months ─────────────────────────────────────────────────────

  const updateSavedBalance = async (monthStr: string, amount: number) => {
    setSavedBalanceMapState(prev => ({ ...prev, [monthStr]: amount }));
  };

  const markMonthInitialized = async (monthStr: string) => {
    setInitializedMonthsState(prev =>
      prev.includes(monthStr) ? prev : [...prev, monthStr]
    );
  };

  // setExpenses exposed for direct override (used in ExpensesTab bulk ops)
  const setExpenses = (updater: Expense[] | ((prev: Expense[]) => Expense[])) => {
    setExpensesState(updater as any);
  };

  return {
    fixedBills, expenses, savedBalanceMap, initializedMonths, isLoading,
    addExpense, addManyExpenses, updateExpense, deleteExpense,
    addFixedBill, updateFixedBill, deleteFixedBill,
    updateSavedBalance, markMonthInitialized,
    setExpenses,
  };
};
