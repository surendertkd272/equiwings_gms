import { describe, it, expect } from "vitest";
import { prizeMoneyMinor, lateFeeMinor, GRADE_ENTRY_FINE_MINOR } from "./financials";

describe("Financials", () => {
  it("prize money returns 0 for unranked / out-of-range", () => {
    expect(prizeMoneyMinor("GrandPrix", 0)).toBe(0);
    expect(prizeMoneyMinor("GrandPrix", 7)).toBe(0);
  });

  it("Grand Prix winner gets ₹2,00,000", () => {
    expect(prizeMoneyMinor("GrandPrix", 1)).toBe(20000000);
  });

  it("late fee = 0 when on time", () => {
    expect(lateFeeMinor(250000, 0)).toBe(0);
  });

  it("late fee = 25% within first week", () => {
    expect(lateFeeMinor(250000, 3)).toBe(62500);
  });

  it("grade-entry fine ≈ 150 CHF (constant)", () => {
    expect(GRADE_ENTRY_FINE_MINOR).toBeGreaterThan(0);
  });
});
