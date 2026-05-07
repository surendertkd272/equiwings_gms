import { describe, it, expect } from "vitest";
import { detectConflicts, buildStartList, type RideSlot } from "./scheduling";

function slot(over: Partial<RideSlot>): RideSlot {
  return {
    id: "s",
    eventId: "e",
    eventCode: "TP-ILN",
    riderId: "r",
    riderName: "Rider",
    horseId: "h",
    horseName: "Horse",
    arenaOrTrack: "Track A",
    startsAt: new Date("2026-05-12T10:00:00Z"),
    durationMin: 5,
    discipline: "TentPegging",
    ...over,
  };
}

describe("Scheduling — conflict detection", () => {
  it("detects rider overlap", () => {
    const c = detectConflicts([
      slot({ id: "1", riderId: "R1", horseId: "H1", startsAt: new Date("2026-05-12T10:00:00Z"), durationMin: 30 }),
      slot({ id: "2", riderId: "R1", horseId: "H2", startsAt: new Date("2026-05-12T10:15:00Z") }),
    ]);
    expect(c.some((x) => x.kind === "RiderOverlap")).toBe(true);
  });

  it("detects too-short buffer between rider's slots", () => {
    const c = detectConflicts([
      slot({ id: "1", riderId: "R1", horseId: "H1", startsAt: new Date("2026-05-12T10:00:00Z"), durationMin: 5 }),
      slot({ id: "2", riderId: "R1", horseId: "H2", startsAt: new Date("2026-05-12T10:10:00Z"), durationMin: 5 }),
    ]);
    expect(c.find((x) => x.kind === "RiderBufferTooShort")).toBeTruthy();
  });

  it("detects horse overlap (same horse, two events)", () => {
    const c = detectConflicts([
      slot({ id: "1", riderId: "R1", horseId: "H1", startsAt: new Date("2026-05-12T10:00:00Z"), durationMin: 30 }),
      slot({ id: "2", riderId: "R2", horseId: "H1", startsAt: new Date("2026-05-12T10:15:00Z") }),
    ]);
    expect(c.some((x) => x.kind === "HorseOverlap")).toBe(true);
  });

  it("detects arena double-booking", () => {
    const c = detectConflicts([
      slot({ id: "1", riderId: "R1", horseId: "H1", arenaOrTrack: "Arena 1", startsAt: new Date("2026-05-12T10:00:00Z"), durationMin: 30 }),
      slot({ id: "2", riderId: "R2", horseId: "H2", arenaOrTrack: "Arena 1", startsAt: new Date("2026-05-12T10:15:00Z") }),
    ]);
    expect(c.some((x) => x.kind === "ArenaDoubleBooked")).toBe(true);
  });

  it("Tent Pegging max 8 runs/day per horse", () => {
    const slots = Array.from({ length: 9 }).map((_, i) =>
      slot({
        id: `s${i}`,
        riderId: "R1",
        horseId: "H1",
        startsAt: new Date(`2026-05-12T${String(10 + i).padStart(2, "0")}:00:00Z`),
        durationMin: 5,
        arenaOrTrack: `Track ${i}`, // avoid arena conflicts in this test
      })
    );
    const c = detectConflicts(slots);
    expect(c.some((x) => x.kind === "HorseDailyLimit" && x.max === 8)).toBe(true);
  });

  it("default disciplines limited to 2/day per horse", () => {
    const slots = [
      slot({ id: "a", discipline: "Dressage", arenaOrTrack: "A", riderId: "R", horseId: "H", startsAt: new Date("2026-05-12T09:00:00Z") }),
      slot({ id: "b", discipline: "Dressage", arenaOrTrack: "B", riderId: "R", horseId: "H", startsAt: new Date("2026-05-12T11:00:00Z") }),
      slot({ id: "c", discipline: "ShowJumping", arenaOrTrack: "C", riderId: "R", horseId: "H", startsAt: new Date("2026-05-12T13:00:00Z") }),
    ];
    const c = detectConflicts(slots);
    expect(c.some((x) => x.kind === "HorseDailyLimit" && x.max === 2)).toBe(true);
  });
});

describe("Scheduling — start list ordering", () => {
  it("HC first, then FCFS", () => {
    const list = buildStartList([
      { id: "a", isHC: false, isWithdrawn: false, createdAt: new Date("2026-01-01") },
      { id: "b", isHC: true, isWithdrawn: false, createdAt: new Date("2026-01-02") },
      { id: "c", isHC: true, isWithdrawn: false, createdAt: new Date("2026-01-01") },
      { id: "d", isHC: false, isWithdrawn: true, createdAt: new Date("2026-01-01") },
    ]);
    expect(list).toEqual(["c", "b", "a"]);
  });
});
