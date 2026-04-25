// INSS Table 2024/2025 (Approximate progressive rates)
export const INSS_TABLE = [
  { limit: 1412.0, rate: 0.075, deduction: 0 },
  { limit: 2666.68, rate: 0.09, deduction: 21.18 },
  { limit: 4000.03, rate: 0.12, deduction: 101.18 },
  { limit: 7786.02, rate: 0.14, deduction: 181.18 },
];

export const INSS_CEILING = 908.85;

// IRRF Table 2024/2025 (Simplified for this example)
export const IRRF_TABLE = [
  { limit: 2259.20, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15, deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

export const IRRF_DEPENDENT_DEDUCTION = 189.59;
export const STANDARD_MONTHLY_HOURS = 220;
export const FGTS_RATE = 0.08;
