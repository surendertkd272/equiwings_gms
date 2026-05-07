// Dressage scoring engine.
// Source: EFI Technical Guidelines 2021, Articles 1–18; FEI Dressage Rules.

export type DressageGrade =
  | "Preliminary"
  | "Elementary"
  | "Medium"
  | "AdvancedMedium"
  | "Advanced"
  | "PrixStGeorges"
  | "IntermediateI";

export interface DressageMovement {
  movementNo: number;
  description?: string;
  maxMark: 10;
  coefficient: 1 | 2;
  mark: number; // 0..10, half marks allowed
}

export interface DressageInput {
  movements: DressageMovement[]; // includes collective marks as movements with coef 2
  errorsOfCourse?: number; // number of course errors recorded (1st = -2%; 2nd = elimination)
  technicalFaults?: number; // each = -0.5 percentage points
}

export interface DressageResult {
  totalRaw: number;          // sum of (mark * coef)
  maxRaw: number;            // sum of (10 * coef)
  percentage: number;        // before deductions
  finalPercentage: number;   // after deductions
  eliminated: boolean;
  notes: string[];
}

// Minimum % per grade for individual / team medals (table in Module 5.1.2).
export const D_MIN_PERCENT_INDIVIDUAL: Record<DressageGrade, number> = {
  IntermediateI: 58,
  PrixStGeorges: 59,
  Advanced: 60,
  AdvancedMedium: 62,
  Medium: 63,
  Elementary: 64,
  Preliminary: 65,
};

export const D_MIN_PERCENT_TEAM: Record<DressageGrade, number> = {
  IntermediateI: 56,
  PrixStGeorges: 57,
  Advanced: 58,
  AdvancedMedium: 60,
  Medium: 61,
  Elementary: 62,
  Preliminary: 63,
};

// Rider points (Art. 16 / Module 5.1.2).
export const D_RIDER_POINTS: Record<string, [number, number, number, number, number, number]> = {
  IntermediateI: [32, 30, 28, 26, 24, 22],
  PrixStGeorges: [26, 24, 22, 20, 18, 16],
  Advanced: [20, 18, 16, 14, 12, 10],
  AdvancedMedium: [14, 12, 10, 8, 6, 4],
  Medium: [8, 7, 6, 5, 4, 3],
};

export function scoreDressage(input: DressageInput): DressageResult {
  const notes: string[] = [];

  // Validate marks.
  for (const m of input.movements) {
    if (m.mark < 0 || m.mark > 10) {
      notes.push(`Movement ${m.movementNo}: mark ${m.mark} out of range — clamped`);
    }
  }

  const totalRaw = input.movements.reduce(
    (acc, m) => acc + Math.max(0, Math.min(10, m.mark)) * m.coefficient,
    0
  );
  const maxRaw = input.movements.reduce((acc, m) => acc + 10 * m.coefficient, 0);
  const percentage = maxRaw === 0 ? 0 : (totalRaw / maxRaw) * 100;

  let eliminated = false;
  let finalPct = percentage;

  const errs = input.errorsOfCourse ?? 0;
  if (errs >= 2) {
    eliminated = true;
    notes.push("2nd error of course — eliminated");
  } else if (errs === 1) {
    finalPct -= 2;
    notes.push("1st error of course: -2 percentage points");
  }

  if (input.technicalFaults && input.technicalFaults > 0) {
    finalPct -= 0.5 * input.technicalFaults;
    notes.push(`Technical faults: -${0.5 * input.technicalFaults}% (Art. 430.6.2)`);
  }

  finalPct = Math.max(0, finalPct);

  return {
    totalRaw,
    maxRaw,
    percentage,
    finalPercentage: eliminated ? 0 : finalPct,
    eliminated,
    notes,
  };
}

// Average across multiple judges (3-judge minimum at NEC).
export function averageJudges(perJudge: DressageResult[]): number {
  if (perJudge.length === 0) return 0;
  const sum = perJudge.reduce((acc, r) => acc + r.finalPercentage, 0);
  return sum / perJudge.length;
}

export function meetsMedalIndividual(grade: DressageGrade, percent: number): boolean {
  return percent >= D_MIN_PERCENT_INDIVIDUAL[grade];
}

export function meetsMedalTeam(grade: DressageGrade, percent: number): boolean {
  return percent >= D_MIN_PERCENT_TEAM[grade];
}
