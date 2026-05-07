// Tent Pegging scoring engine.
// Source: EFI Technical Guidelines 2021, Articles 401–423; ITPF Rules 2019.

export type TPEventCode =
  | "TP-ILN" // Individual Lance
  | "TP-ISW" // Individual Sword
  | "TP-RPL" // Ring & Peg (Lance)
  | "TP-LPS" // Lemon & Peg (Sword)
  | "TP-PAI" // Paired
  | "TP-INF" // Indian File
  | "TP-TLN" // Team Lance
  | "TP-TSW"; // Team Sword

export type PegResult = "Carry" | "Draw" | "Strike" | "Miss";
export type RingResult = "Hit" | "Miss";
export type LemonResult = "Slice" | "Miss";

export interface TargetHit {
  // What the rider attempted in this target on this run.
  type: "Peg" | "Ring" | "Lemon";
  result: PegResult | RingResult | LemonResult;
}

export interface RunInput {
  pegSizeCm: 6 | 4 | 2.5; // 2.5 reserved for tie-break
  recordedTimeMs: number; // ms across the 80m track
  targets: TargetHit[];
  isTieBreak?: boolean;
  // Penalties / disqualifying conditions
  weaponDropped?: boolean;
  riderFell?: boolean;
  horseFell?: boolean;
  // Indian File specifics
  carriedWrongPeg?: boolean;
}

export interface RunResult {
  rawTargetPoints: number;
  timePenalty: number;
  netPoints: number;
  eliminated: boolean;
  notes: string[];
}

// Article 414: target point values.
export function pegPoints(result: PegResult): number {
  switch (result) {
    case "Carry":
      return 6;
    case "Draw":
      return 4;
    case "Strike":
      return 2;
    case "Miss":
      return 0;
  }
}

export function ringPoints(result: RingResult): number {
  // Ring carried on lance = 6 each; otherwise 0. (Art. 408, 413)
  return result === "Hit" ? 6 : 0;
}

export function lemonPoints(result: LemonResult): number {
  // Horizontal slice = 6; half-slice / push / downward cut = 0. (Art. 409, 413)
  return result === "Slice" ? 6 : 0;
}

export function targetPoints(t: TargetHit): number {
  if (t.type === "Peg") return pegPoints(t.result as PegResult);
  if (t.type === "Ring") return ringPoints(t.result as RingResult);
  return lemonPoints(t.result as LemonResult);
}

// Time-allowed lookup (ms) per event.
// Track length is fixed at 80m; speeds per Art. 413 / event tables.
export const TIME_ALLOWED_MS: Record<TPEventCode, number> = {
  "TP-ILN": 6400, // 750 m/min → 6.40s
  "TP-ISW": 6400,
  "TP-TLN": 7000, // 685 m/min → 7.00s
  "TP-TSW": 7000,
  "TP-RPL": 7000,
  "TP-LPS": 7000,
  "TP-PAI": 7000,
  "TP-INF": 10000, // 685 m/min × longer carry → 10.00s
};

/**
 * Time-penalty calculator.
 * Per Appendix A: every 1-second band over the time allowed = 0.5 penalty points.
 * The bands are inclusive at the upper bound and exclusive at the lower bound,
 * EXCEPT the first band which includes the time-allowed itself (e.g. 0.00–6.40 = 0).
 *
 * Examples (Individual Lance, allowed = 6.40s):
 *   6.40s → 0.0
 *   6.41s → 0.5  (6.41–7.40 band)
 *   7.40s → 0.5  (still in same band)
 *   7.41s → 1.0  (7.41–8.40 band)
 */
export function timePenalty(recordedMs: number, allowedMs: number): number {
  if (recordedMs <= allowedMs) return 0;
  const overMs = recordedMs - allowedMs;
  // Each 1.00-second band = 0.5 penalty points. A time of allowedMs + ε falls in band 1.
  // Math.ceil over a 1000ms boundary handles the open lower / closed upper interval.
  const band = Math.ceil(overMs / 1000);
  return band * 0.5;
}

// Returns the appropriate time-allowed for a given event code.
export function timeAllowedMs(event: TPEventCode): number {
  return TIME_ALLOWED_MS[event];
}

/**
 * Score a single Tent Pegging run.
 * Pure function — does not write to DB. Caller persists the RunResult.
 */
export function scoreRun(event: TPEventCode, run: RunInput): RunResult {
  const notes: string[] = [];
  let eliminated = false;

  // Tie-break runs are scored on a 2.5cm peg.
  if (run.isTieBreak && run.pegSizeCm !== 2.5) {
    notes.push("Tie-break run must be on 2.5cm peg");
  }

  // Eliminating events.
  if (run.weaponDropped) {
    notes.push("Weapon dropped — points forfeited for this run");
    return { rawTargetPoints: 0, timePenalty: 0, netPoints: 0, eliminated: true, notes };
  }
  if (run.riderFell || run.horseFell) {
    notes.push(run.riderFell ? "Rider fell — eliminated for this run" : "Horse fell — eliminated for this run");
    eliminated = true;
  }
  if (run.carriedWrongPeg) {
    notes.push("Indian File — wrong peg carried, 0 points for the run");
    return { rawTargetPoints: 0, timePenalty: 0, netPoints: 0, eliminated: false, notes };
  }

  const rawTargetPoints = run.targets.reduce((acc, t) => acc + targetPoints(t), 0);
  const tp = timePenalty(run.recordedTimeMs, timeAllowedMs(event));
  const net = Math.max(0, rawTargetPoints - tp);

  return {
    rawTargetPoints,
    timePenalty: tp,
    netPoints: eliminated ? 0 : net,
    eliminated,
    notes,
  };
}

// Round and event structure.
// (Art. 402, 403, 404, 405) — NEC structure of two rounds for Individual/Team.
export interface RoundStructure {
  rounds: number;
  runsPerRound: number;
  pegSizesPerRun: number[][]; // [round][run]
}

export const NEC_ROUND_STRUCTURE: Record<TPEventCode, RoundStructure> = {
  "TP-ILN": { rounds: 2, runsPerRound: 3, pegSizesPerRun: [[6, 6, 4], [6, 4, 4]] },
  "TP-ISW": { rounds: 2, runsPerRound: 3, pegSizesPerRun: [[6, 6, 4], [6, 4, 4]] },
  "TP-TLN": { rounds: 2, runsPerRound: 3, pegSizesPerRun: [[6, 6, 4], [6, 4, 4]] },
  "TP-TSW": { rounds: 2, runsPerRound: 3, pegSizesPerRun: [[6, 6, 4], [6, 4, 4]] },
  "TP-RPL": { rounds: 1, runsPerRound: 2, pegSizesPerRun: [[6, 4]] },
  "TP-LPS": { rounds: 1, runsPerRound: 2, pegSizesPerRun: [[6, 4]] },
  "TP-PAI": { rounds: 1, runsPerRound: 2, pegSizesPerRun: [[6, 4]] }, // run 1 lance/6cm; run 2 sword/4cm
  "TP-INF": { rounds: 1, runsPerRound: 2, pegSizesPerRun: [[6, 4]] }, // run 1 lance; run 2 sword
};

// Aggregate the per-run results for an entry.
export interface EntryRoundup {
  runs: RunResult[];
  total: number;
  isEliminated: boolean;
}

export function aggregateEntry(runs: RunResult[]): EntryRoundup {
  const total = runs.reduce((acc, r) => acc + r.netPoints, 0);
  const isEliminated = runs.every((r) => r.eliminated);
  return { runs, total, isEliminated };
}

// Medal minimum standards (Art. 418).
export const TP_MIN_INDIVIDUAL_FOR_MEDAL = 24;
export const TP_MIN_TEAM_FOR_MEDAL = 72;

// Rider points (Art. 421).
export const TP_RIDER_POINTS: Record<"TP-ILN" | "TP-ISW" | "TP-RPL" | "TP-LPS", [number, number, number, number, number, number]> = {
  "TP-ILN": [12, 10, 8, 6, 4, 2],
  "TP-ISW": [12, 10, 8, 6, 4, 2],
  "TP-RPL": [12, 10, 8, 6, 4, 2],
  "TP-LPS": [12, 10, 8, 6, 4, 2],
};

/**
 * Tie-break resolver.
 * Article 402, Para 5: one additional run on a 2.5cm peg. If still tied → time of tie-break.
 * If still tied → time of the run prior. To avoid undue stress on horses, only ONE
 * additional tie-break run is permitted.
 */
export interface TieBreakInput {
  entryId: string;
  baseScore: number;
  tieBreakRun?: { score: number; timeMs: number };
  priorRunTimeMs: number;
}

export function resolveTie(entries: TieBreakInput[]): string[] {
  // Sort by: baseScore desc → tieBreak score desc → tieBreak time asc → prior time asc.
  return [...entries]
    .sort((a, b) => {
      if (a.baseScore !== b.baseScore) return b.baseScore - a.baseScore;
      const aTb = a.tieBreakRun?.score ?? -1;
      const bTb = b.tieBreakRun?.score ?? -1;
      if (aTb !== bTb) return bTb - aTb;
      const aTbT = a.tieBreakRun?.timeMs ?? Number.POSITIVE_INFINITY;
      const bTbT = b.tieBreakRun?.timeMs ?? Number.POSITIVE_INFINITY;
      if (aTbT !== bTbT) return aTbT - bTbT;
      return a.priorRunTimeMs - b.priorRunTimeMs;
    })
    .map((e) => e.entryId);
}
