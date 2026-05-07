// Registration-time eligibility validation (Module 1).

export interface RiderEligibilityInput {
  efiId: string;
  efiIdRenewedAt: Date;
  competitionDate: Date;
  isForeign: boolean;
  nocOnFile: boolean;
  hasIndianPassport: boolean;
  isNECChampionship?: boolean; // for NEC, only Indian passports eligible
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

/**
 * EFI ID must be renewed before 01 Aug each year.
 * If not renewed, the rider cannot accept entries for the FOLLOWING calendar year.
 */
export function efiIdValidFor(competitionDate: Date, renewedAt: Date): boolean {
  const compYear = competitionDate.getUTCFullYear();
  const requiredRenewal = new Date(Date.UTC(compYear - 1, 7, 1)); // 01 Aug previous year
  return renewedAt >= requiredRenewal;
}

export function checkRiderEligibility(input: RiderEligibilityInput): EligibilityResult {
  const reasons: string[] = [];

  if (!efiIdValidFor(input.competitionDate, input.efiIdRenewedAt)) {
    reasons.push("EFI ID not renewed before 01 Aug — cannot enter for this calendar year");
  }

  if (input.isForeign && !input.nocOnFile) {
    reasons.push("Foreign rider must have NOC from their own federation on file");
  }

  if (input.isNECChampionship && !input.hasIndianPassport) {
    reasons.push("NEC/Championship events require valid Indian passport");
  }

  return { eligible: reasons.length === 0, reasons };
}

// Team minimums (Module 1.1).
export interface TeamCheckInput {
  riderCount: number;
  teamCount?: number; // overall number of teams entered for the event
  isPaired?: boolean;
}

export function checkTeamMinimums(input: TeamCheckInput): EligibilityResult {
  const reasons: string[] = [];
  if (input.isPaired && input.riderCount !== 2) {
    reasons.push("Paired Tent Pegging requires exactly 2 riders");
  } else if (!input.isPaired && input.riderCount < 4) {
    reasons.push("Team event requires minimum 4 riders");
  }
  if (input.teamCount !== undefined && input.teamCount < 4) {
    reasons.push("Minimum 4 teams required for team events at NEC/EFI events");
  }
  return { eligible: reasons.length === 0, reasons };
}

// HC entry — JNEC restriction.
export function canEnterHC(input: { isJNEC: boolean; discipline: string; totalEntries: number }): EligibilityResult {
  const reasons: string[] = [];
  if (input.isJNEC) reasons.push("HC entries are not permitted in JNEC");
  if (input.discipline === "Dressage" && input.totalEntries >= 40) {
    reasons.push("Dressage HC only permitted when total entries are below 40");
  }
  return { eligible: reasons.length === 0, reasons };
}

// Daily ride limits per horse (Module 4.1).
export type RiderCategory = "Children" | "Junior" | "YoungRider" | "Senior";

export function maxDailyRoundsForHorse(category: RiderCategory, discipline: "Dressage" | "ShowJumping" | "TentPegging" | "Eventing"): number {
  if (discipline === "TentPegging") return 8; // excluding tie-break
  if (category === "Children") return 3; // includes mix of disciplines per spec
  return 2;
}
