import { describe, it, expect } from "vitest";
import {
  scoreSJRound,
  meetsSJMedalIndividual,
  meetsSJMedalTeam,
  SJ_MAX_PEN_INDIVIDUAL,
} from "./show-jumping";

describe("Show Jumping — fault scoring", () => {
  it("rail = 4 faults", () => {
    const r = scoreSJRound({
      faults: [{ type: "Rail" }],
      optimumTimeSec: 80,
      recordedTimeSec: 78,
    });
    expect(r.total).toBe(4);
    expect(r.eliminated).toBe(false);
  });

  it("first refusal = 4 faults; second refusal = elimination", () => {
    const r1 = scoreSJRound({
      faults: [{ type: "Refusal", ordinal: 1 }],
      optimumTimeSec: 80,
      recordedTimeSec: 78,
    });
    expect(r1.total).toBe(4);
    expect(r1.eliminated).toBe(false);

    const r2 = scoreSJRound({
      faults: [
        { type: "Refusal", ordinal: 1 },
        { type: "Refusal", ordinal: 2 },
      ],
      optimumTimeSec: 80,
      recordedTimeSec: 78,
    });
    expect(r2.eliminated).toBe(true);
  });

  it("fall of horse or rider = elimination", () => {
    expect(scoreSJRound({ faults: [{ type: "FallRider" }], optimumTimeSec: 80, recordedTimeSec: 78 }).eliminated).toBe(true);
    expect(scoreSJRound({ faults: [{ type: "FallHorse" }], optimumTimeSec: 80, recordedTimeSec: 78 }).eliminated).toBe(true);
  });

  it("time fault: 1 per commenced second over", () => {
    const r = scoreSJRound({
      faults: [{ type: "Rail" }],
      optimumTimeSec: 80,
      recordedTimeSec: 82.3, // 3 seconds commenced
    });
    expect(r.timeFault).toBe(3);
    expect(r.total).toBe(4 + 3);
  });

  it("wrong course corrected: no elimination", () => {
    const r = scoreSJRound({
      faults: [{ type: "WrongCourse", corrected: true }],
      optimumTimeSec: 80,
      recordedTimeSec: 78,
    });
    expect(r.eliminated).toBe(false);
  });

  it("wrong course not corrected: elimination", () => {
    const r = scoreSJRound({
      faults: [{ type: "WrongCourse", corrected: false }],
      optimumTimeSec: 80,
      recordedTimeSec: 78,
    });
    expect(r.eliminated).toBe(true);
  });
});

describe("Show Jumping — medal eligibility (Art. 211)", () => {
  it("Grand Prix individual max = 24 penalties", () => {
    expect(SJ_MAX_PEN_INDIVIDUAL.GrandPrix).toBe(24);
    expect(meetsSJMedalIndividual("GrandPrix", 24)).toBe(true);
    expect(meetsSJMedalIndividual("GrandPrix", 25)).toBe(false);
  });

  it("Preliminary individual max = 4", () => {
    expect(meetsSJMedalIndividual("Preliminary", 4)).toBe(true);
    expect(meetsSJMedalIndividual("Preliminary", 8)).toBe(false);
  });

  it("Team max higher than individual", () => {
    expect(meetsSJMedalTeam("GrandPrix", 72)).toBe(true);
    expect(meetsSJMedalTeam("GrandPrix", 73)).toBe(false);
  });
});
