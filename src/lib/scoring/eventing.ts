// Eventing scoring engine — combined three-phase scoring.
// Source: EFI Technical Guidelines 2021, Articles 101–120; FEI Eventing Rules.
// Format: Dressage → Cross Country → Show Jumping. Lower penalty total wins.

import type { DressageInput } from "./dressage";
import { scoreDressage } from "./dressage";
import { scoreSJRound, type SJRoundInput } from "./show-jumping";

// Penalty conversion factor for Dressage → Eventing penalty points.
// FEI uses ~1.5× the (100 - %) per its rules; the spec leaves it configurable.
export const DRESSAGE_TO_PENALTY_FACTOR = 1.5;

export interface CrossCountryInput {
  refusalsByObstacle: Array<{ obstacleNo: number; ordinal: 1 | 2 | 3 }>;
  fallsRider: number;
  fallsHorse: number;
  optimumTimeSec: number;
  recordedTimeSec: number;
  maximumTimeSec: number; // typically 2 × optimum
  isJunior?: boolean; // JNEC special: −30s before optimum penalised
}

export interface CrossCountryResult {
  refusalPenalties: number;
  fallPenalties: number;
  timePenalties: number;
  earlyPenalties: number; // JNEC only
  total: number;
  eliminated: boolean;
  notes: string[];
}

export function scoreCrossCountry(cc: CrossCountryInput): CrossCountryResult {
  const notes: string[] = [];
  let eliminated = false;
  let refusalPenalties = 0;

  for (const ref of cc.refusalsByObstacle) {
    if (ref.ordinal === 1) refusalPenalties += 20;
    else if (ref.ordinal === 2) refusalPenalties += 40;
    else if (ref.ordinal === 3) {
      eliminated = true;
      notes.push(`3rd refusal at obstacle ${ref.obstacleNo} — eliminated`);
    }
  }

  let fallPenalties = 0;
  if (cc.fallsRider >= 2) {
    eliminated = true;
    notes.push("2nd rider fall — eliminated");
  } else if (cc.fallsRider === 1) {
    fallPenalties += 65;
  }
  if (cc.fallsHorse > 0) {
    eliminated = true;
    notes.push("Fall of horse — eliminated");
  }

  if (cc.recordedTimeSec > cc.maximumTimeSec) {
    eliminated = true;
    notes.push("Exceeded maximum time — eliminated");
  }

  // Time penalties: 0.4 per commenced second over optimum.
  const overSec = Math.max(0, cc.recordedTimeSec - cc.optimumTimeSec);
  const timePenalties = Math.ceil(overSec) * 0.4;

  // JNEC: 25-penalty add if more than 30s under optimum.
  let earlyPenalties = 0;
  if (cc.isJunior && cc.recordedTimeSec < cc.optimumTimeSec - 30) {
    earlyPenalties = 25;
    notes.push("JNEC: finished >30s before optimum — 25 penalties");
  }

  const total = eliminated
    ? Number.POSITIVE_INFINITY
    : refusalPenalties + fallPenalties + timePenalties + earlyPenalties;

  return { refusalPenalties, fallPenalties, timePenalties, earlyPenalties, total, eliminated, notes };
}

export interface EventingInput {
  dressage: DressageInput;
  crossCountry: CrossCountryInput;
  showJumping: SJRoundInput;
}

export interface EventingResult {
  dressagePenalty: number;
  crossCountryPenalty: number;
  showJumpingPenalty: number;
  total: number;
  eliminated: boolean;
  notes: string[];
}

export function scoreEventing(input: EventingInput): EventingResult {
  const notes: string[] = [];
  const drs = scoreDressage(input.dressage);
  const cc = scoreCrossCountry(input.crossCountry);
  const sj = scoreSJRound(input.showJumping);

  const eliminated = drs.eliminated || cc.eliminated || sj.eliminated;
  if (drs.eliminated) notes.push("Eliminated in Dressage");
  if (cc.eliminated) notes.push(...cc.notes);
  if (sj.eliminated) notes.push(...sj.notes);

  const dressagePenalty = drs.eliminated ? Number.POSITIVE_INFINITY : (100 - drs.finalPercentage) * DRESSAGE_TO_PENALTY_FACTOR;
  const crossCountryPenalty = cc.total;
  const showJumpingPenalty = sj.eliminated ? Number.POSITIVE_INFINITY : sj.total;

  const total = eliminated ? Number.POSITIVE_INFINITY : dressagePenalty + crossCountryPenalty + showJumpingPenalty;

  return {
    dressagePenalty: drs.eliminated ? Number.POSITIVE_INFINITY : dressagePenalty,
    crossCountryPenalty,
    showJumpingPenalty,
    total,
    eliminated,
    notes,
  };
}
