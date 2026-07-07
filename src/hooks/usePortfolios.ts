import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Portfolio {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  current_balance: number;
  monthly_rate: number; // percentage, e.g. 0.15 means 0.15%
  created_at?: string;
}

export interface PortfolioDividend {
  id: string;
  portfolio_id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  payment_date?: string;
  created_at?: string;
}

export const usePortfolios = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [dividends, setDividends] = useState<PortfolioDividend[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        supabase.from('portfolios').select('*').order('created_at'),
        supabase.from('portfolio_dividends').select('*').order('date'),
      ]);
      if (pRes.data) setPortfolios(pRes.data as Portfolio[]);
      if (dRes.data) setDividends(dRes.data as PortfolioDividend[]);
    } catch (err) {
      console.error('Error loading portfolios:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addPortfolio = async (p: Omit<Portfolio, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('portfolios').insert([p]).select();
    if (data?.[0]) {
      setPortfolios(prev => [...prev, data[0] as Portfolio]);
      return data[0] as Portfolio;
    }
    console.error(error);
    return null;
  };

  const updatePortfolio = async (id: string, updates: Partial<Portfolio>) => {
    await supabase.from('portfolios').update(updates).eq('id', id);
    setPortfolios(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePortfolio = async (id: string) => {
    await supabase.from('portfolios').delete().eq('id', id);
    setPortfolios(prev => prev.filter(p => p.id !== id));
    setDividends(prev => prev.filter(d => d.portfolio_id !== id));
  };

  const addDividend = async (d: Omit<PortfolioDividend, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('portfolio_dividends').insert([d]).select();
    if (data?.[0]) {
      setDividends(prev => [...prev, data[0] as PortfolioDividend]);
      return data[0] as PortfolioDividend;
    }
    console.error(error);
    return null;
  };

  const deleteDividend = async (id: string) => {
    await supabase.from('portfolio_dividends').delete().eq('id', id);
    setDividends(prev => prev.filter(d => d.id !== id));
  };

  return {
    portfolios, dividends, isLoading,
    addPortfolio, updatePortfolio, deletePortfolio,
    addDividend, deleteDividend,
    reload: load,
  };
};
