export interface SalaryData {
  baseSalary: number;
  advancePayment: number; // Adiantamento (15th)
  overtime60: number; // Hours
  overtime110: number; // Hours
  dependents: number; // For IRRF (optional but good to have)
}

export interface CalculationResult {
  hourlyRate: number;
  grossSalary: number;
  overtime60Value: number;
  overtime110Value: number;
  inssDeduction: number;
  irrfDeduction: number;
  fgtsValue: number;
  netSalaryMonth: number;
  secondPayment: number; // Net for day 30
}
