// Financials helpers (Module 7).

export const DEFAULT_PRIZE_SCHEDULE_INR = {
  // (₹ in minor units / paise) — per Appendix E mapping to placement.
  GrandPrix: [200000_00, 100000_00, 60000_00, 30000_00, 15000_00, 10000_00],
  IntermediateI: [150000_00, 80000_00, 50000_00, 25000_00, 12000_00, 8000_00],
  Default: [50000_00, 30000_00, 20000_00, 10000_00, 5000_00, 2500_00],
} as const;

export function prizeMoneyMinor(eventKey: string, placement: number): number {
  const schedule =
    (DEFAULT_PRIZE_SCHEDULE_INR as Record<string, readonly number[]>)[eventKey] ??
    DEFAULT_PRIZE_SCHEDULE_INR.Default;
  if (placement < 1 || placement > schedule.length) return 0;
  return schedule[placement - 1];
}

export function lateFeeMinor(baseMinor: number, daysLate: number): number {
  if (daysLate <= 0) return 0;
  // 25% surcharge inside the first week, +10%/week thereafter (illustrative; cap at 50%).
  const surchargePct = Math.min(50, 25 + Math.max(0, daysLate - 7) * 10);
  return Math.round((baseMinor * surchargePct) / 100);
}

// Per the spec, an incorrect-grade entry resulting in DSQ attracts a fine
// equivalent to 150 CHF in INR. Stored as paise. (Illustrative INR/CHF rate of 90.)
export const GRADE_ENTRY_FINE_MINOR = 150 * 90 * 100;
