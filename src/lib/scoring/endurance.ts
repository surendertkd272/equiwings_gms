// Endurance vet-gate logic.
// Source: EFI Technical Guidelines 2021 (Endurance) + FEI Endurance Rules Art. 833.

export interface VetGateInput {
  arrivalHeartRateBpm: number;
  recoveryToTargetSec: number; // time to drop to target threshold
  targetThresholdBpm: number;  // typically 64 bpm
  arrivalAt: Date;
  presentedAt: Date;
}

export interface VetGateResult {
  passed: boolean;
  recoveryWithinLimit: boolean;
  recoveryWindowSec: number;
  notes: string[];
}

export const DEFAULT_RECOVERY_WINDOW_SEC = 30 * 60; // 30 minutes
export const DEFAULT_TARGET_HR_BPM = 64;

export function evaluateVetGate(input: VetGateInput, recoveryWindowSec = DEFAULT_RECOVERY_WINDOW_SEC): VetGateResult {
  const notes: string[] = [];
  const recoveryWithinLimit = input.recoveryToTargetSec <= recoveryWindowSec;
  if (!recoveryWithinLimit) notes.push(`Recovery exceeded ${recoveryWindowSec / 60} min window`);
  if (input.arrivalHeartRateBpm > input.targetThresholdBpm + 40) {
    notes.push(`Arrival HR ${input.arrivalHeartRateBpm} far above threshold`);
  }
  return {
    passed: recoveryWithinLimit,
    recoveryWithinLimit,
    recoveryWindowSec,
    notes,
  };
}

/**
 * Final vet-gate tie-break (Module 3.2):
 * If more than one horse reports to final vet gate within 4 seconds of the first horse,
 * the horse with the lesser heartbeat is ranked higher. Decided by 2 judges + 2 vets.
 */
export interface FinalGateEntry {
  entryId: string;
  arrivalAt: Date;
  arrivalHeartRateBpm: number;
}

export function rankFinalGate(entries: FinalGateEntry[]): string[] {
  if (entries.length === 0) return [];
  const sortedByTime = [...entries].sort((a, b) => a.arrivalAt.getTime() - b.arrivalAt.getTime());
  const firstAt = sortedByTime[0].arrivalAt.getTime();

  // Group entries arriving within 4 seconds of the first.
  const groups: FinalGateEntry[][] = [];
  let currentGroup: FinalGateEntry[] = [];
  for (const e of sortedByTime) {
    if (currentGroup.length === 0) {
      currentGroup.push(e);
      continue;
    }
    const head = currentGroup[0].arrivalAt.getTime();
    if (e.arrivalAt.getTime() - head <= 4000) {
      currentGroup.push(e);
    } else {
      groups.push(currentGroup);
      currentGroup = [e];
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  const ranked: string[] = [];
  for (const g of groups) {
    if (g.length === 1) ranked.push(g[0].entryId);
    else {
      const inOrder = [...g].sort((a, b) => a.arrivalHeartRateBpm - b.arrivalHeartRateBpm);
      ranked.push(...inOrder.map((e) => e.entryId));
    }
  }
  // Reference firstAt to satisfy "noUnused" if ever enforced; also clearer in tests.
  void firstAt;
  return ranked;
}
