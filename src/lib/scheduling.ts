// Scheduling & conflict detection.
// Source: Module 4 of the spec.

export interface RideSlot {
  id: string;
  eventId: string;
  eventCode: string;
  riderId: string;
  riderName: string;
  horseId: string | null;
  horseName: string | null;
  arenaOrTrack: string | null;
  startsAt: Date;
  durationMin: number;
  discipline: string;
}

export type Conflict =
  | { kind: "RiderOverlap"; slotIdA: string; slotIdB: string; minutesApart: number }
  | { kind: "HorseOverlap"; slotIdA: string; slotIdB: string; minutesApart: number }
  | { kind: "RiderBufferTooShort"; slotIdA: string; slotIdB: string; minutesApart: number; minBuffer: number }
  | { kind: "HorseDailyLimit"; horseId: string; date: string; count: number; max: number }
  | { kind: "ArenaDoubleBooked"; arena: string; slotIdA: string; slotIdB: string };

export interface ConflictCheckOptions {
  riderBufferMin?: number;       // default 15
  maxRoundsPerHorse?: { TentPegging: number; default: number }; // default {TP:8, default:2}
}

const DEFAULT_BUFFER_MIN = 15;

export function detectConflicts(slots: RideSlot[], opts: ConflictCheckOptions = {}): Conflict[] {
  const conflicts: Conflict[] = [];
  const buffer = opts.riderBufferMin ?? DEFAULT_BUFFER_MIN;
  const maxLimits = opts.maxRoundsPerHorse ?? { TentPegging: 8, default: 2 };

  const sorted = [...slots].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      const aEnd = new Date(a.startsAt.getTime() + a.durationMin * 60_000);
      const overlap = b.startsAt < aEnd;
      const minutesApart = Math.round((b.startsAt.getTime() - aEnd.getTime()) / 60_000);

      // Rider can't be in two places.
      if (overlap && a.riderId === b.riderId) {
        conflicts.push({ kind: "RiderOverlap", slotIdA: a.id, slotIdB: b.id, minutesApart });
        continue;
      }
      if (!overlap && a.riderId === b.riderId && minutesApart < buffer) {
        conflicts.push({ kind: "RiderBufferTooShort", slotIdA: a.id, slotIdB: b.id, minutesApart, minBuffer: buffer });
      }

      // Horse can't be in two places.
      if (overlap && a.horseId && a.horseId === b.horseId) {
        conflicts.push({ kind: "HorseOverlap", slotIdA: a.id, slotIdB: b.id, minutesApart });
      }

      // Same arena, overlapping.
      if (overlap && a.arenaOrTrack && a.arenaOrTrack === b.arenaOrTrack) {
        conflicts.push({ kind: "ArenaDoubleBooked", arena: a.arenaOrTrack, slotIdA: a.id, slotIdB: b.id });
      }
    }
  }

  // Per-horse per-day limits.
  const byHorseDay = new Map<string, RideSlot[]>();
  for (const s of slots) {
    if (!s.horseId) continue;
    const date = s.startsAt.toISOString().slice(0, 10);
    const k = `${s.horseId}|${date}`;
    if (!byHorseDay.has(k)) byHorseDay.set(k, []);
    byHorseDay.get(k)!.push(s);
  }
  for (const [k, list] of byHorseDay.entries()) {
    const [horseId, date] = k.split("|");
    const isTP = list.every((x) => x.discipline === "TentPegging");
    const max = isTP ? maxLimits.TentPegging : maxLimits.default;
    if (list.length > max) {
      conflicts.push({ kind: "HorseDailyLimit", horseId, date, count: list.length, max });
    }
  }

  return conflicts;
}

/**
 * Build an ordered start list for a single event.
 * Ensures HC entries (if allowed for the event) sit at the top of the draw.
 */
export function buildStartList(entries: Array<{ id: string; isHC: boolean; isWithdrawn: boolean; createdAt: Date }>): string[] {
  return entries
    .filter((e) => !e.isWithdrawn)
    .sort((a, b) => {
      if (a.isHC !== b.isHC) return a.isHC ? -1 : 1; // HC first
      return a.createdAt.getTime() - b.createdAt.getTime(); // FCFS within group
    })
    .map((e) => e.id);
}
