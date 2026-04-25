import { useState, useEffect } from 'react';

export interface Investment {
  id: string;
  amount: number;
  date_str: string;
  type: string;
  description?: string;
}

const INVESTMENTS_KEY = 'investments_data';
const GOAL_KEY = 'investment_monthly_goal';

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useInvestmentsData() {
  const [investments, setInvestments] = useState<Investment[]>(() => {
    try {
      const raw = localStorage.getItem(INVESTMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [monthlyGoal, setMonthlyGoal] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(GOAL_KEY);
      return raw ? Number(raw) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem(GOAL_KEY, monthlyGoal.toString());
  }, [monthlyGoal]);

  const addInvestment = (inv: Omit<Investment, 'id'>) => {
    const newInv = { ...inv, id: uuid() };
    setInvestments(prev => [...prev, newInv]);
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  return {
    investments,
    monthlyGoal,
    setMonthlyGoal,
    addInvestment,
    deleteInvestment
  };
}
