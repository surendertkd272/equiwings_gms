import { describe, it, expect } from "vitest";
import {
  pegPoints,
  ringPoints,
  lemonPoints,
  timePenalty,
  scoreRun,
  resolveTie,
  TP_MIN_INDIVIDUAL_FOR_MEDAL,
  timeAllowedMs,
} from "./tent-pegging";

describe("Tent Pegging — target scoring (Art. 414)", () => {
  it("peg: Carry=6, Draw=4, Strike=2, Miss=0", () => {
    expect(pegPoints("Carry")).toBe(6);
    expect(pegPoints("Draw")).toBe(4);
    expect(pegPoints("Strike")).toBe(2);
    expect(pegPoints("Miss")).toBe(0);
  });

  it("ring: Hit=6, Miss=0", () => {
    expect(ringPoints("Hit")).toBe(6);
    expect(ringPoints("Miss")).toBe(0);
  });

  it("lemon: Slice=6, Miss=0", () => {
    expect(lemonPoints("Slice")).toBe(6);
    expect(lemonPoints("Miss")).toBe(0);
  });
});

describe("Tent Pegging — time penalty (Appendix A)", () => {
  it("Individual Lance: at-or-under 6.40s = 0", () => {
    const allowed = timeAllowedMs("TP-ILN");
    expect(timePenalty(0, allowed)).toBe(0);
    expect(timePenalty(6000, allowed)).toBe(0);
    expect(timePenalty(6400, allowed)).toBe(0);
  });

  it("Individual Lance: 6.41–7.40s = 0.5", () => {
    const allowed = timeAllowedMs("TP-ILN");
    expect(timePenalty(6410, allowed)).toBe(0.5);
    expect(timePenalty(7000, allowed)).toBe(0.5);
    expect(timePenalty(7400, allowed)).toBe(0.5);
  });

  it("Individual Lance: 7.41–8.40s = 1.0", () => {
    const allowed = timeAllowedMs("TP-ILN");
    expect(timePenalty(7410, allowed)).toBe(1);
    expect(timePenalty(8400, allowed)).toBe(1);
  });

  it("Team / Ring & Peg: at-or-under 7.00s = 0; 7.01–8.00 = 0.5", () => {
    const allowed = timeAllowedMs("TP-TLN");
    expect(timePenalty(7000, allowed)).toBe(0);
    expect(timePenalty(7010, allowed)).toBe(0.5);
    expect(timePenalty(8000, allowed)).toBe(0.5);
    expect(timePenalty(8010, allowed)).toBe(1);
  });

  it("Indian File: allowed 10.00s; bands as per Appendix A", () => {
    const allowed = timeAllowedMs("TP-INF");
    expect(timePenalty(10000, allowed)).toBe(0);
    expect(timePenalty(10010, allowed)).toBe(0.5);
    expect(timePenalty(11000, allowed)).toBe(0.5);
    expect(timePenalty(11010, allowed)).toBe(1);
    // Spot-check from table: 19.01–20.00 = 5.00
    expect(timePenalty(20000, allowed)).toBe(5);
    expect(timePenalty(20010, allowed)).toBe(5.5);
  });
});

describe("Tent Pegging — scoreRun integration", () => {
  it("clean Individual Lance run with Carry inside time", () => {
    const r = scoreRun("TP-ILN", {
      pegSizeCm: 6,
      recordedTimeMs: 6300,
      targets: [{ type: "Peg", result: "Carry" }],
    });
    expect(r.rawTargetPoints).toBe(6);
    expect(r.timePenalty).toBe(0);
    expect(r.netPoints).toBe(6);
    expect(r.eliminated).toBe(false);
  });

  it("Carry but slightly over time → 0.5 penalty subtracted", () => {
    const r = scoreRun("TP-ILN", {
      pegSizeCm: 6,
      recordedTimeMs: 6500, // 6.41–7.40 band → 0.5
      targets: [{ type: "Peg", result: "Carry" }],
    });
    expect(r.rawTargetPoints).toBe(6);
    expect(r.timePenalty).toBe(0.5);
    expect(r.netPoints).toBe(5.5);
  });

  it("weapon dropped → 0 points + eliminated for run", () => {
    const r = scoreRun("TP-ILN", {
      pegSizeCm: 6,
      recordedTimeMs: 6000,
      targets: [{ type: "Peg", result: "Carry" }],
      weaponDropped: true,
    });
    expect(r.netPoints).toBe(0);
    expect(r.eliminated).toBe(true);
  });

  it("Indian File — wrong peg carried → 0 points, run not eliminated", () => {
    const r = scoreRun("TP-INF", {
      pegSizeCm: 6,
      recordedTimeMs: 9000,
      targets: [{ type: "Peg", result: "Carry" }],
      carriedWrongPeg: true,
    });
    expect(r.netPoints).toBe(0);
    expect(r.eliminated).toBe(false);
    expect(r.notes.some((n) => n.includes("wrong peg"))).toBe(true);
  });

  it("Ring & Peg — ring carried + peg drawn", () => {
    const r = scoreRun("TP-RPL", {
      pegSizeCm: 6,
      recordedTimeMs: 6800,
      targets: [
        { type: "Ring", result: "Hit" },
        { type: "Ring", result: "Hit" },
        { type: "Peg", result: "Draw" },
      ],
    });
    expect(r.rawTargetPoints).toBe(6 + 6 + 4);
    expect(r.timePenalty).toBe(0);
    expect(r.netPoints).toBe(16);
  });

  it("Lemon & Peg — push on lemon scores 0", () => {
    const r = scoreRun("TP-LPS", {
      pegSizeCm: 6,
      recordedTimeMs: 6900,
      targets: [
        { type: "Lemon", result: "Miss" },
        { type: "Peg", result: "Strike" },
      ],
    });
    expect(r.rawTargetPoints).toBe(2);
  });

  it("net never goes below zero", () => {
    const r = scoreRun("TP-ILN", {
      pegSizeCm: 6,
      recordedTimeMs: 60000, // wildly over
      targets: [{ type: "Peg", result: "Miss" }],
    });
    expect(r.netPoints).toBe(0);
  });
});

describe("Tent Pegging — tie-break resolution (Art. 402.5)", () => {
  it("higher base score wins; falls through to tie-break score, then times", () => {
    const ranked = resolveTie([
      { entryId: "A", baseScore: 30, tieBreakRun: { score: 6, timeMs: 6500 }, priorRunTimeMs: 6300 },
      { entryId: "B", baseScore: 30, tieBreakRun: { score: 6, timeMs: 6400 }, priorRunTimeMs: 6300 },
      { entryId: "C", baseScore: 28, priorRunTimeMs: 6200 },
    ]);
    // A and B have same baseScore + same tie-break score; B wins on tie-break time.
    expect(ranked).toEqual(["B", "A", "C"]);
  });

  it("falls through to prior run time as final tie-break", () => {
    const ranked = resolveTie([
      { entryId: "A", baseScore: 30, tieBreakRun: { score: 4, timeMs: 6500 }, priorRunTimeMs: 6300 },
      { entryId: "B", baseScore: 30, tieBreakRun: { score: 4, timeMs: 6500 }, priorRunTimeMs: 6200 },
    ]);
    expect(ranked).toEqual(["B", "A"]);
  });
});

describe("Tent Pegging — medal minimums (Art. 418)", () => {
  it("individual minimum is 24", () => {
    expect(TP_MIN_INDIVIDUAL_FOR_MEDAL).toBe(24);
  });
});
