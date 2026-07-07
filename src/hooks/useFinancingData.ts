import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FinancingDetails {
  id?: string;
  vehicle_name: string;
  vehicle_total_value: number;
  vehicle_total_installments: number;
  installment_value: number;
  interest_rate: number;
  due_day: number;
}

const GLOBAL_FINANCING_MONTH = 'GLOBAL_FINANCING';

export function useFinancingData() {
  const [financingData, setFinancingData] = useState<FinancingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadFinancingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('salary_calculations')
        .select('*')
        .eq('reference_month', GLOBAL_FINANCING_MONTH)
        .limit(1);

      if (data && data.length > 0) {
        const item = data[0];
        setFinancingData({
          id: item.id,
          vehicle_name: item.vehicle_name || '',
          vehicle_total_value: Number(item.vehicle_total_value || 0),
          vehicle_total_installments: Number(item.vehicle_total_installments || 0),
          installment_value: Number(item.financing || 0),
          interest_rate: Number(item.vehicle_interest_rate || 0),
          due_day: Number(item.vehicle_due_day || 1),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinancingData();
  }, [loadFinancingData]);

  const saveFinancingData = async (details: FinancingDetails) => {
    setIsLoading(true);
    try {
      const payload: any = {
        reference_month: GLOBAL_FINANCING_MONTH,
        vehicle_name: details.vehicle_name,
        vehicle_total_value: details.vehicle_total_value,
        vehicle_total_installments: details.vehicle_total_installments,
        financing: details.installment_value,
        vehicle_interest_rate: details.interest_rate,
        vehicle_due_day: details.due_day,
      };

      // Ensure required non-null fields for salary_calculations are provided dummy values
      payload.base_salary = 0;
      payload.advance_payment = 0;
      payload.ot60_days = 0;
      payload.ot110_days = 0;
      payload.ot60_value = 0;
      payload.ot110_value = 0;
      payload.gross_salary = 0;
      payload.inss_deduction = 0;
      payload.fixed_deductions = 0;
      payload.fgts_value = 0;
      payload.net_salary = 0;
      payload.second_payment = 0;

      if (financingData?.id) {
        const { data } = await supabase
          .from('salary_calculations')
          .update(payload)
          .eq('id', financingData.id)
          .select();
        if (data && data.length > 0) setFinancingData(prev => ({ ...prev, ...details, id: data[0].id }));
      } else {
        const { data, error } = await supabase
          .from('salary_calculations')
          .insert([payload])
          .select();
        if (error) throw error;
        if (data && data.length > 0) setFinancingData({ ...details, id: data[0].id });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return { financingData, isLoading, saveFinancingData };
}
