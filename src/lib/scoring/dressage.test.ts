import { describe, it, expect } from "vitest";
import {
  scoreDressage,
  averageJudges,
  meetsMedalIndividual,
  meetsMedalTeam,
} from "./dressage";

describe("Dressage scoring", () => {
  it("computes percentage = totalRaw / maxRaw * 100", () => {
    const r = scoreDressage({
      movements: [
        { movementNo: 1, maxMark: 10, coefficient: 1, mark: 7 },
        { movementNo: 2, maxMark: 10, coefficient: 2, mark: 8 },
      ],
    });
    // raw = 7 + 16 = 23; max = 10 + 20 = 30; pct = 76.66...
    expect(r.totalRaw).toBe(23);
    expect(r.maxRaw).toBe(30);
    expect(r.percentage).toBeCloseTo(76.6666, 3);
    expect(r.finalPercentage).toBeCloseTo(76.6666, 3);
  });

  it("1st error of course deducts 2 percentage points", () => {
    const r = scoreDressage({
      movements: [{ movementNo: 1, maxMark: 10, coefficient: 1, mark: 8 }],
      errorsOfCourse: 1,
    });
    expect(r.percentage).toBe(80);
    expect(r.finalPercentage).toBe(78);
  });

  it("2nd error eliminates", () => {
    const r = scoreDressage({
      movements: [{ movementNo: 1, maxMark: 10, coefficient: 1, mark: 8 }],
      errorsOfCourse: 2,
    });
    expect(r.eliminated).toBe(true);
    expect(r.finalPercentage).toBe(0);
  });

  it("technical faults deduct 0.5% each", () => {
    const r = scoreDressage({
      movements: [{ movementNo: 1, maxMark: 10, coefficient: 1, mark: 7 }],
      technicalFaults: 3,
    });
    // 70 - 1.5 = 68.5
    expect(r.finalPercentage).toBeCloseTo(68.5, 3);
  });

  it("averageJudges across 3 judges", () => {
    const a = { totalRaw: 0, maxRaw: 0, percentage: 0, finalPercentage: 70, eliminated: false, notes: [] };
    const b = { ...a, finalPercentage: 72 };
    const c = { ...a, finalPercentage: 68 };
    expect(averageJudges([a, b, c])).toBeCloseTo(70, 3);
  });

  it("medal eligibility: PSG individual needs ≥59%; team needs ≥57%", () => {
    expect(meetsMedalIndividual("PrixStGeorges", 58.99)).toBe(false);
    expect(meetsMedalIndividual("PrixStGeorges", 59)).toBe(true);
    expect(meetsMedalTeam("PrixStGeorges", 56.99)).toBe(false);
    expect(meetsMedalTeam("PrixStGeorges", 57)).toBe(true);
  });
});
