import { describe, it, expect } from "vitest";
import {
  isHorseOldEnough,
  isHorseTallEnoughForTentPegging,
  juniorCategoryFor,
} from "./age-rules";

describe("Horse minimum age", () => {
  it("Dressage Preliminary needs 4yo", () => {
    const dob = new Date("2022-04-01T00:00:00Z");
    const comp = new Date("2026-04-01T00:00:00Z");
    expect(isHorseOldEnough({ horseDob: dob, competitionDate: comp, discipline: "Dressage", grade: "Preliminary" })).toBe(true);
  });

  it("Dressage Prix St-Georges needs 7yo", () => {
    const dob = new Date("2020-04-01T00:00:00Z");
    const comp = new Date("2026-04-01T00:00:00Z");
    expect(isHorseOldEnough({ horseDob: dob, competitionDate: comp, discipline: "Dressage", grade: "PrixStGeorges" })).toBe(false);
  });

  it("Tent Pegging needs 5yo", () => {
    const dob = new Date("2020-01-01T00:00:00Z");
    const comp = new Date("2026-04-01T00:00:00Z");
    expect(isHorseOldEnough({ horseDob: dob, competitionDate: comp, discipline: "TentPegging" })).toBe(true);
  });
});

describe("Tent Pegging height check", () => {
  it("14.2hh unshod passes", () => {
    expect(isHorseTallEnoughForTentPegging(142, false)).toBe(true);
  });
  it("14.1hh fails", () => {
    expect(isHorseTallEnoughForTentPegging(141, false)).toBe(false);
  });
  it("14.3hh shod passes (allowance for shoes)", () => {
    expect(isHorseTallEnoughForTentPegging(143, true)).toBe(true);
  });
});

describe("Junior category resolver (JNEC)", () => {
  it("classifies a 16yo as Junior", () => {
    expect(juniorCategoryFor(new Date("2010-06-01T00:00:00Z"), 2026)).toBe("Junior");
  });
  it("classifies an 11yo as Children II", () => {
    expect(juniorCategoryFor(new Date("2015-06-01T00:00:00Z"), 2026)).toBe("ChildrenII");
  });
});
