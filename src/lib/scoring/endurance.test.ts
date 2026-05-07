import { describe, it, expect } from "vitest";
import { evaluateVetGate, rankFinalGate } from "./endurance";

describe("Endurance vet gate", () => {
  it("passes when recovery is within window", () => {
    const r = evaluateVetGate({
      arrivalHeartRateBpm: 80,
      recoveryToTargetSec: 600,
      targetThresholdBpm: 64,
      arrivalAt: new Date("2026-05-12T10:00:00Z"),
      presentedAt: new Date("2026-05-12T10:10:00Z"),
    });
    expect(r.passed).toBe(true);
    expect(r.recoveryWithinLimit).toBe(true);
  });

  it("fails when recovery exceeds window", () => {
    const r = evaluateVetGate({
      arrivalHeartRateBpm: 90,
      recoveryToTargetSec: 1900,
      targetThresholdBpm: 64,
      arrivalAt: new Date(),
      presentedAt: new Date(),
    });
    expect(r.passed).toBe(false);
  });
});

describe("Endurance — final gate ranking (Module 3.2 tie-break)", () => {
  it("when arrivals within 4s, lower heart rate ranks higher", () => {
    const t0 = new Date("2026-05-12T10:00:00Z").getTime();
    const ranked = rankFinalGate([
      { entryId: "A", arrivalAt: new Date(t0), arrivalHeartRateBpm: 70 },
      { entryId: "B", arrivalAt: new Date(t0 + 2000), arrivalHeartRateBpm: 64 },
      { entryId: "C", arrivalAt: new Date(t0 + 4000), arrivalHeartRateBpm: 68 },
    ]);
    expect(ranked).toEqual(["B", "C", "A"]);
  });

  it("arrivals beyond 4s window stay in arrival order", () => {
    const t0 = new Date("2026-05-12T10:00:00Z").getTime();
    const ranked = rankFinalGate([
      { entryId: "A", arrivalAt: new Date(t0), arrivalHeartRateBpm: 70 },
      { entryId: "B", arrivalAt: new Date(t0 + 5000), arrivalHeartRateBpm: 60 },
    ]);
    expect(ranked).toEqual(["A", "B"]);
  });
});
