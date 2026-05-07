import { describe, it, expect } from "vitest";
import { scoreCrossCountry, scoreEventing } from "./eventing";

describe("Eventing — Cross Country penalties", () => {
  it("first refusal = 20", () => {
    const r = scoreCrossCountry({
      refusalsByObstacle: [{ obstacleNo: 5, ordinal: 1 }],
      fallsRider: 0,
      fallsHorse: 0,
      optimumTimeSec: 360,
      recordedTimeSec: 360,
      maximumTimeSec: 720,
    });
    expect(r.refusalPenalties).toBe(20);
    expect(r.eliminated).toBe(false);
  });

  it("third refusal at same obstacle eliminates", () => {
    const r = scoreCrossCountry({
      refusalsByObstacle: [{ obstacleNo: 5, ordinal: 3 }],
      fallsRider: 0,
      fallsHorse: 0,
      optimumTimeSec: 360,
      recordedTimeSec: 360,
      maximumTimeSec: 720,
    });
    expect(r.eliminated).toBe(true);
  });

  it("fall of horse eliminates", () => {
    const r = scoreCrossCountry({
      refusalsByObstacle: [],
      fallsRider: 0,
      fallsHorse: 1,
      optimumTimeSec: 360,
      recordedTimeSec: 360,
      maximumTimeSec: 720,
    });
    expect(r.eliminated).toBe(true);
  });

  it("first rider fall = 65 penalties; second eliminates", () => {
    const r1 = scoreCrossCountry({ refusalsByObstacle: [], fallsRider: 1, fallsHorse: 0, optimumTimeSec: 360, recordedTimeSec: 360, maximumTimeSec: 720 });
    expect(r1.fallPenalties).toBe(65);
    const r2 = scoreCrossCountry({ refusalsByObstacle: [], fallsRider: 2, fallsHorse: 0, optimumTimeSec: 360, recordedTimeSec: 360, maximumTimeSec: 720 });
    expect(r2.eliminated).toBe(true);
  });

  it("0.4 penalty per commenced second over optimum", () => {
    const r = scoreCrossCountry({ refusalsByObstacle: [], fallsRider: 0, fallsHorse: 0, optimumTimeSec: 360, recordedTimeSec: 365.2, maximumTimeSec: 720 });
    expect(r.timePenalties).toBeCloseTo(6 * 0.4, 6);
  });

  it("max time exceeded eliminates", () => {
    const r = scoreCrossCountry({ refusalsByObstacle: [], fallsRider: 0, fallsHorse: 0, optimumTimeSec: 360, recordedTimeSec: 800, maximumTimeSec: 720 });
    expect(r.eliminated).toBe(true);
  });

  it("JNEC: finishing >30s under optimum adds 25 penalties", () => {
    const r = scoreCrossCountry({ refusalsByObstacle: [], fallsRider: 0, fallsHorse: 0, optimumTimeSec: 360, recordedTimeSec: 320, maximumTimeSec: 720, isJunior: true });
    expect(r.earlyPenalties).toBe(25);
  });
});

describe("Eventing — combined", () => {
  it("totals across the three phases", () => {
    const r = scoreEventing({
      dressage: { movements: [{ movementNo: 1, maxMark: 10, coefficient: 1, mark: 8 }] },
      crossCountry: { refusalsByObstacle: [], fallsRider: 0, fallsHorse: 0, optimumTimeSec: 360, recordedTimeSec: 365, maximumTimeSec: 720 },
      showJumping: { faults: [{ type: "Rail" }], optimumTimeSec: 80, recordedTimeSec: 78 },
    });
    // Dressage 80% → 30 penalty (20 * 1.5)
    expect(r.dressagePenalty).toBeCloseTo((100 - 80) * 1.5, 6);
    expect(r.crossCountryPenalty).toBeCloseTo(5 * 0.4, 6);
    expect(r.showJumpingPenalty).toBe(4);
    expect(r.eliminated).toBe(false);
  });

  it("elimination in any phase eliminates overall", () => {
    const r = scoreEventing({
      dressage: { movements: [{ movementNo: 1, maxMark: 10, coefficient: 1, mark: 8 }] },
      crossCountry: { refusalsByObstacle: [], fallsRider: 0, fallsHorse: 1, optimumTimeSec: 360, recordedTimeSec: 365, maximumTimeSec: 720 },
      showJumping: { faults: [], optimumTimeSec: 80, recordedTimeSec: 78 },
    });
    expect(r.eliminated).toBe(true);
  });
});
