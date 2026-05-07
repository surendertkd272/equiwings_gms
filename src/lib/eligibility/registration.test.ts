import { describe, it, expect } from "vitest";
import {
  efiIdValidFor,
  checkRiderEligibility,
  checkTeamMinimums,
  canEnterHC,
} from "./registration";

describe("EFI ID renewal window", () => {
  it("renewal on/after 01 Aug previous year is valid", () => {
    const comp = new Date("2026-03-15T00:00:00Z");
    expect(efiIdValidFor(comp, new Date("2025-08-01T00:00:00Z"))).toBe(true);
    expect(efiIdValidFor(comp, new Date("2025-12-01T00:00:00Z"))).toBe(true);
  });

  it("renewal before 01 Aug previous year is invalid", () => {
    const comp = new Date("2026-03-15T00:00:00Z");
    expect(efiIdValidFor(comp, new Date("2025-07-31T00:00:00Z"))).toBe(false);
  });
});

describe("Rider eligibility", () => {
  it("foreign rider needs NOC", () => {
    const r = checkRiderEligibility({
      efiId: "EFI-1",
      efiIdRenewedAt: new Date("2025-08-15T00:00:00Z"),
      competitionDate: new Date("2026-03-15T00:00:00Z"),
      isForeign: true,
      nocOnFile: false,
      hasIndianPassport: false,
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons.some((x) => x.includes("NOC"))).toBe(true);
  });

  it("NEC requires Indian passport", () => {
    const r = checkRiderEligibility({
      efiId: "EFI-1",
      efiIdRenewedAt: new Date("2025-08-15T00:00:00Z"),
      competitionDate: new Date("2026-03-15T00:00:00Z"),
      isForeign: false,
      nocOnFile: false,
      hasIndianPassport: false,
      isNECChampionship: true,
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons.some((x) => x.includes("Indian passport"))).toBe(true);
  });
});

describe("Team minimums", () => {
  it("Paired needs exactly 2", () => {
    expect(checkTeamMinimums({ riderCount: 2, isPaired: true }).eligible).toBe(true);
    expect(checkTeamMinimums({ riderCount: 3, isPaired: true }).eligible).toBe(false);
  });

  it("Team needs at least 4 riders", () => {
    expect(checkTeamMinimums({ riderCount: 4 }).eligible).toBe(true);
    expect(checkTeamMinimums({ riderCount: 3 }).eligible).toBe(false);
  });

  it("Need at least 4 teams in event", () => {
    expect(checkTeamMinimums({ riderCount: 4, teamCount: 3 }).eligible).toBe(false);
    expect(checkTeamMinimums({ riderCount: 4, teamCount: 4 }).eligible).toBe(true);
  });
});

describe("HC entry restrictions", () => {
  it("JNEC blocks HC", () => {
    expect(canEnterHC({ isJNEC: true, discipline: "Dressage", totalEntries: 20 }).eligible).toBe(false);
  });
  it("Dressage HC blocked at ≥40 entries", () => {
    expect(canEnterHC({ isJNEC: false, discipline: "Dressage", totalEntries: 40 }).eligible).toBe(false);
    expect(canEnterHC({ isJNEC: false, discipline: "Dressage", totalEntries: 39 }).eligible).toBe(true);
  });
});
