// MER (Minimum Eligibility Requirements) tracking for upgrades.
// Source: Module 2.2 of the spec.

import type { DressageGrade } from "@/lib/scoring/dressage";
import type { SJGrade } from "@/lib/scoring/show-jumping";

// ── Dressage ────────────────────────────────────────────────────────────────

export interface DressageUpgradeContext {
  fromGrade: DressageGrade;
  qualifyingScores: number[];      // each is the % achieved at the from-grade
  yearsAtCurrentGrade: number;
  hasWrittenRequest?: boolean;
  upgradesUsedThisSeason?: number;
}

export interface UpgradeDecision {
  toGrade: string | null;
  reason: string;
  blocked?: boolean;
}

export function dressageUpgrade(ctx: DressageUpgradeContext): UpgradeDecision {
  if ((ctx.upgradesUsedThisSeason ?? 0) >= 1 && !ctx.hasWrittenRequest) {
    return { toGrade: null, reason: "Already upgraded this season — second upgrade requires written request", blocked: true };
  }

  const sortedDesc = [...ctx.qualifyingScores].sort((a, b) => b - a);
  const top = sortedDesc[0] ?? 0;
  const twoCount = sortedDesc.filter((s) => s >= 60).length;

  switch (ctx.fromGrade) {
    case "Preliminary":
      if (top >= 60) return { toGrade: "Elementary", reason: "Score ≥60% achieved" };
      if (ctx.yearsAtCurrentGrade >= 2) return { toGrade: "Elementary", reason: "Automatic after 2 years" };
      return { toGrade: null, reason: "Need score ≥60% or 2 years at grade" };

    case "Elementary":
      if (top >= 60) return { toGrade: "Medium", reason: "Score ≥60% achieved" };
      if (ctx.yearsAtCurrentGrade >= 2) return { toGrade: "Medium", reason: "Automatic after 2 years" };
      return { toGrade: null, reason: "Need score ≥60% or 2 years at grade" };

    case "Medium":
      if (twoCount >= 2) return { toGrade: "AdvancedMedium", reason: "Two MERs ≥60% achieved" };
      if (top >= 65 && ctx.hasWrittenRequest) return { toGrade: "AdvancedMedium", reason: "Single MER ≥65% with written request" };
      return { toGrade: null, reason: "Need two MERs ≥60% or one MER ≥65% with written request" };

    case "AdvancedMedium":
      if (twoCount >= 2) return { toGrade: "Advanced", reason: "Two MERs ≥60% achieved" };
      if (top >= 64 && ctx.hasWrittenRequest) return { toGrade: "Advanced", reason: "Single MER ≥64% with written request" };
      return { toGrade: null, reason: "Need two MERs ≥60% or one MER ≥64% with written request" };

    case "Advanced":
      if (twoCount >= 2) return { toGrade: "PrixStGeorges", reason: "Two MERs ≥60% achieved" };
      if (top >= 63 && ctx.hasWrittenRequest) return { toGrade: "PrixStGeorges", reason: "Single MER ≥63% with written request" };
      return { toGrade: null, reason: "Need two MERs ≥60% or one MER ≥63% with written request" };

    case "PrixStGeorges":
      if (twoCount >= 2) return { toGrade: "IntermediateI", reason: "Two MERs ≥60% achieved" };
      if (top >= 63 && ctx.hasWrittenRequest) return { toGrade: "IntermediateI", reason: "Single MER ≥63% with written request" };
      return { toGrade: null, reason: "Need two MERs ≥60% or one MER ≥63% with written request" };

    case "IntermediateI":
      return { toGrade: null, reason: "Top grade in EFI national progression" };
  }
}

export interface DressageDowngradeContext {
  grade: DressageGrade;
  consecutiveScoresUnder50: number;
  yearsSinceLastEvent: number;
}

export function dressageDowngrade(ctx: DressageDowngradeContext): { downgrade: boolean; reason: string } {
  // Downgrading not permitted below Medium.
  const noDowngradeBelow: DressageGrade[] = ["Preliminary", "Elementary", "Medium"];
  if (noDowngradeBelow.includes(ctx.grade)) {
    return { downgrade: false, reason: "Downgrading not permitted below Medium" };
  }
  if (ctx.consecutiveScoresUnder50 >= 2) {
    return { downgrade: true, reason: "Two consecutive scores <50% in own grade" };
  }
  if (ctx.yearsSinceLastEvent >= 3) {
    return { downgrade: true, reason: "No EFI-approved event for 3+ years" };
  }
  return { downgrade: false, reason: "Conditions not met" };
}

// ── Show Jumping ────────────────────────────────────────────────────────────

export interface SJUpgradeContext {
  fromGrade: SJGrade;
  qualifyingFaults: number[];        // faults posted in qualifying rounds
  yearsAtCurrentGrade: number;
  hasWrittenRequest?: boolean;
}

export function showJumpingUpgrade(ctx: SJUpgradeContext): UpgradeDecision {
  const sortedAsc = [...ctx.qualifyingFaults].sort((a, b) => a - b);
  const best = sortedAsc[0] ?? Number.POSITIVE_INFINITY;
  const bestTwoSum = (sortedAsc[0] ?? 0) + (sortedAsc[1] ?? 0);

  switch (ctx.fromGrade) {
    case "Preliminary":
      if (best <= 4) return { toGrade: "Novice", reason: "≤4 faults in one round" };
      if (ctx.yearsAtCurrentGrade >= 2) return { toGrade: "Novice", reason: "Automatic after 2 years" };
      return { toGrade: null, reason: "Need ≤4 faults in a round or 2 years at grade" };

    case "Novice":
      if (bestTwoSum <= 12) return { toGrade: "GradeIII", reason: "≤12 faults across 2 rounds" };
      if (ctx.yearsAtCurrentGrade >= 2) return { toGrade: "GradeIII", reason: "Automatic after 2 years" };
      return { toGrade: null, reason: "Need ≤12 faults in 2 rounds or 2 years at grade" };

    case "GradeIII":
      if (bestTwoSum <= 12) return { toGrade: "GradeII", reason: "Two MERs ≤12 faults total" };
      if (best <= 8 && ctx.hasWrittenRequest) return { toGrade: "GradeII", reason: "≤8 faults with written request" };
      return { toGrade: null, reason: "Need ≤12 faults in 2 rounds or ≤8 with written request" };

    case "GradeII":
      if (bestTwoSum <= 20) return { toGrade: "GradeI", reason: "Two MERs ≤20 faults total" };
      if (best <= 8 && ctx.hasWrittenRequest) return { toGrade: "GradeI", reason: "≤8 faults with written request" };
      return { toGrade: null, reason: "Need ≤20 faults in 2 rounds or ≤8 with written request" };

    case "GradeI":
      return { toGrade: "GrandPrix", reason: "Grand Prix open to all Grade I horses" };

    case "GrandPrix":
      return { toGrade: null, reason: "Top grade" };
  }
}

export interface SJDowngradeContext {
  grade: SJGrade;
  consecutiveEliminations: number; // FEI/EFI Normal competitions
}

export function showJumpingDowngrade(ctx: SJDowngradeContext): { downgrade: boolean; reason: string } {
  const noDowngradeBelow: SJGrade[] = ["Preliminary", "Novice", "GradeIII"];
  if (noDowngradeBelow.includes(ctx.grade)) {
    return { downgrade: false, reason: "Downgrading not permitted below Grade III" };
  }
  if (ctx.consecutiveEliminations >= 3) {
    return { downgrade: true, reason: "Three consecutive eliminations in Normal competitions" };
  }
  return { downgrade: false, reason: "Conditions not met" };
}
