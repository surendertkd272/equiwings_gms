import { describe, it, expect } from "vitest";
import {
  dressageUpgrade,
  dressageDowngrade,
  showJumpingUpgrade,
  showJumpingDowngrade,
} from "./mer";

describe("Dressage MER", () => {
  it("Preliminary → Elementary on score ≥60", () => {
    expect(dressageUpgrade({ fromGrade: "Preliminary", qualifyingScores: [62], yearsAtCurrentGrade: 0 }).toGrade).toBe("Elementary");
  });

  it("Preliminary → Elementary auto after 2 years", () => {
    expect(dressageUpgrade({ fromGrade: "Preliminary", qualifyingScores: [55], yearsAtCurrentGrade: 2 }).toGrade).toBe("Elementary");
  });

  it("Medium → AdvancedMedium needs 2 MERs ≥60 OR 1 MER ≥65 with written request", () => {
    expect(dressageUpgrade({ fromGrade: "Medium", qualifyingScores: [62, 61], yearsAtCurrentGrade: 0 }).toGrade).toBe("AdvancedMedium");
    expect(dressageUpgrade({ fromGrade: "Medium", qualifyingScores: [66], yearsAtCurrentGrade: 0, hasWrittenRequest: true }).toGrade).toBe("AdvancedMedium");
    expect(dressageUpgrade({ fromGrade: "Medium", qualifyingScores: [66], yearsAtCurrentGrade: 0 }).toGrade).toBe(null);
  });

  it("blocks second upgrade in same season unless written request", () => {
    const decision = dressageUpgrade({
      fromGrade: "Preliminary",
      qualifyingScores: [70],
      yearsAtCurrentGrade: 0,
      upgradesUsedThisSeason: 1,
    });
    expect(decision.blocked).toBe(true);
  });

  it("downgrade blocked below Medium", () => {
    expect(dressageDowngrade({ grade: "Elementary", consecutiveScoresUnder50: 5, yearsSinceLastEvent: 5 }).downgrade).toBe(false);
  });

  it("Advanced downgrades on 2 consecutive <50%", () => {
    expect(dressageDowngrade({ grade: "Advanced", consecutiveScoresUnder50: 2, yearsSinceLastEvent: 0 }).downgrade).toBe(true);
  });
});

describe("Show Jumping MER", () => {
  it("Preliminary → Novice on ≤4 faults in one round", () => {
    expect(showJumpingUpgrade({ fromGrade: "Preliminary", qualifyingFaults: [4], yearsAtCurrentGrade: 0 }).toGrade).toBe("Novice");
    expect(showJumpingUpgrade({ fromGrade: "Preliminary", qualifyingFaults: [8], yearsAtCurrentGrade: 0 }).toGrade).toBe(null);
  });

  it("Novice → GradeIII on ≤12 faults across 2 rounds", () => {
    expect(showJumpingUpgrade({ fromGrade: "Novice", qualifyingFaults: [4, 8], yearsAtCurrentGrade: 0 }).toGrade).toBe("GradeIII");
  });

  it("GradeI → GrandPrix is open", () => {
    expect(showJumpingUpgrade({ fromGrade: "GradeI", qualifyingFaults: [], yearsAtCurrentGrade: 0 }).toGrade).toBe("GrandPrix");
  });

  it("3 consecutive eliminations downgrades GradeII", () => {
    expect(showJumpingDowngrade({ grade: "GradeII", consecutiveEliminations: 3 }).downgrade).toBe(true);
    expect(showJumpingDowngrade({ grade: "GradeIII", consecutiveEliminations: 3 }).downgrade).toBe(false);
  });
});
