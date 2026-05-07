// Show Jumping scoring engine.
// Source: EFI Technical Guidelines 2021, Articles 201–217; FEI Show Jumping Rules.

export type SJGrade =
  | "Preliminary"
  | "Novice"
  | "GradeIII"
  | "GradeII"
  | "GradeI"
  | "GrandPrix";

export type SJFault =
  | { type: "Rail" }
  | { type: "Refusal"; ordinal: 1 | 2 } // 2nd refusal in same round = elimination
  | { type: "FallRider" }
  | { type: "FallHorse" }
  | { type: "WrongCourse"; corrected: boolean }
  | { type: "TimeFault"; secondsOver: number };

export interface SJRoundInput {
  faults: SJFault[];
  optimumTimeSec: number;
  recordedTimeSec: number;
}

export interface SJRoundResult {
  faultPoints: number;
  timeFault: number;
  total: number;
  eliminated: boolean;
  notes: string[];
}

export function scoreSJRound(round: SJRoundInput): SJRoundResult {
  const notes: string[] = [];
  let total = 0;
  let eliminated = false;

  for (const f of round.faults) {
    if (eliminated) break;
    switch (f.type) {
      case "Rail":
        total += 4;
        break;
      case "Refusal":
        if (f.ordinal === 2) {
          eliminated = true;
          notes.push("Second refusal — eliminated");
        } else {
          total += 4;
        }
        break;
      case "FallRider":
        eliminated = true;
        notes.push("Fall of rider — eliminated");
        break;
      case "FallHorse":
        eliminated = true;
        notes.push("Fall of horse — eliminated");
        break;
      case "WrongCourse":
        if (!f.corrected) {
          eliminated = true;
          notes.push("Wrong course — eliminated");
        }
        break;
      case "TimeFault":
        // 1 fault per commenced second over.
        total += Math.ceil(Math.max(0, f.secondsOver));
        break;
    }
  }

  // Auto-compute time fault from times if no explicit TimeFault given.
  const overSec = Math.max(0, round.recordedTimeSec - round.optimumTimeSec);
  const computedTimeFault = Math.ceil(overSec);
  const explicitTimeFault = round.faults
    .filter((f): f is Extract<SJFault, { type: "TimeFault" }> => f.type === "TimeFault")
    .reduce((acc, f) => acc + Math.ceil(f.secondsOver), 0);
  const timeFault = explicitTimeFault > 0 ? explicitTimeFault : computedTimeFault;

  // If we computed it (no explicit TimeFault), add it now.
  if (explicitTimeFault === 0 && computedTimeFault > 0 && !eliminated) {
    total += computedTimeFault;
  }

  return {
    faultPoints: total - timeFault,
    timeFault,
    total: eliminated ? Number.POSITIVE_INFINITY : total,
    eliminated,
    notes,
  };
}

// Maximum penalties for individual/team medal (Art. 211).
export const SJ_MAX_PEN_INDIVIDUAL: Record<SJGrade, number> = {
  Preliminary: 4,
  Novice: 8,
  GradeIII: 12,
  GradeII: 20,
  GradeI: 24,
  GrandPrix: 24,
};

export const SJ_MAX_PEN_TEAM: Record<SJGrade, number> = {
  Preliminary: 24,
  Novice: 24,
  GradeIII: 36,
  GradeII: 60,
  GradeI: 72,
  GrandPrix: 72,
};

export function meetsSJMedalIndividual(grade: SJGrade, totalPenalties: number): boolean {
  return totalPenalties <= SJ_MAX_PEN_INDIVIDUAL[grade];
}

export function meetsSJMedalTeam(grade: SJGrade, totalPenalties: number): boolean {
  return totalPenalties <= SJ_MAX_PEN_TEAM[grade];
}

// Course standards (Module 5.1.3).
export interface SJCourseStandard {
  minHeightCm: number;
  maxHeightCm: number;
  maxSpreadCm: number;
  speedMpm: number;
  rounds: number;
  obstacleRange: [number, number];
}

export const SJ_COURSE_STANDARDS: Record<SJGrade, SJCourseStandard> = {
  Preliminary: { minHeightCm: 90, maxHeightCm: 100, maxSpreadCm: 120, speedMpm: 325, rounds: 1, obstacleRange: [12, 15] },
  Novice: { minHeightCm: 100, maxHeightCm: 110, maxSpreadCm: 130, speedMpm: 350, rounds: 2, obstacleRange: [12, 15] },
  GradeIII: { minHeightCm: 110, maxHeightCm: 120, maxSpreadCm: 140, speedMpm: 350, rounds: 2, obstacleRange: [12, 15] },
  GradeII: { minHeightCm: 120, maxHeightCm: 130, maxSpreadCm: 150, speedMpm: 350, rounds: 2, obstacleRange: [12, 15] },
  GradeI: { minHeightCm: 130, maxHeightCm: 140, maxSpreadCm: 160, speedMpm: 375, rounds: 2, obstacleRange: [12, 15] },
  GrandPrix: { minHeightCm: 135, maxHeightCm: 150, maxSpreadCm: 170, speedMpm: 375, rounds: 2, obstacleRange: [12, 15] },
};

// Rider points (Art. 213).
export const SJ_RIDER_POINTS: Record<string, [number, number, number, number, number, number]> = {
  GrandPrix: [28, 26, 24, 22, 20, 18],
  GradeI: [20, 18, 16, 14, 12, 10],
  GradeII: [12, 10, 8, 6, 4, 2],
  GradeIII: [10, 8, 6, 4, 2, 1],
};
