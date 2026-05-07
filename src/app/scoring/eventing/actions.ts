"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { scoreCrossCountry, DRESSAGE_TO_PENALTY_FACTOR } from "@/lib/scoring/eventing";
import { scoreSJRound, type SJFault } from "@/lib/scoring/show-jumping";

// Per-phase persistence model:
// Phase 1 (Dressage)  → store dressage % directly under Result.percentage
// Phase 2 (CC)        → store CC penalty in Result.totalRaw (component) + a marker
// Phase 3 (SJ)        → final combined: total stored in Result.totalAfterPen.
// We keep it simple: each phase upserts Result, recomputing combined from the parts.

interface PhaseRecord {
  dressagePct?: number;
  ccPenalty?: number;
  sjPenalty?: number;
  eliminated: boolean;
}

async function readPhases(entryId: string): Promise<PhaseRecord> {
  const result = await prisma.result.findUnique({ where: { entryId } });
  if (!result) return { eliminated: false };
  // We encode component values via comments-free fields:
  //   percentage → dressage %
  //   totalRaw   → CC penalty
  //   timePenalty→ SJ penalty
  return {
    dressagePct: result.percentage ?? undefined,
    ccPenalty: result.totalRaw || undefined,
    sjPenalty: result.timePenalty ?? undefined,
    eliminated: result.status === "Eliminated",
  };
}

function recompute(phases: PhaseRecord) {
  const eliminated = phases.eliminated;
  if (eliminated) return { total: Number.POSITIVE_INFINITY, eliminated: true };
  const drsPen = phases.dressagePct != null ? (100 - phases.dressagePct) * DRESSAGE_TO_PENALTY_FACTOR : 0;
  const cc = phases.ccPenalty ?? 0;
  const sj = phases.sjPenalty ?? 0;
  return { total: drsPen + cc + sj, eliminated: false };
}

export async function recordEventingDressagePhase(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const entryId = formData.get("entryId") as string;
  const percentage = Number(formData.get("percentage") ?? 0);
  const eliminated = formData.get("eliminated") === "on";

  const cur = await readPhases(entryId);
  const next: PhaseRecord = { ...cur, dressagePct: percentage, eliminated: eliminated || cur.eliminated };
  const rec = recompute(next);

  await prisma.result.upsert({
    where: { entryId },
    create: {
      entryId,
      totalRaw: next.ccPenalty ?? 0,
      totalAfterPen: rec.total === Number.POSITIVE_INFINITY ? 0 : rec.total,
      percentage: percentage,
      timePenalty: next.sjPenalty ?? 0,
      status: rec.eliminated ? "Eliminated" : "Completed",
      meetsMER: false,
      meetsMedal: false,
    },
    update: {
      percentage: percentage,
      totalAfterPen: rec.total === Number.POSITIVE_INFINITY ? 0 : rec.total,
      status: rec.eliminated ? "Eliminated" : "Completed",
      computedAt: new Date(),
    },
  });

  await prisma.run.create({
    data: {
      eventId,
      entryId,
      roundNo: 1,
      runNo: 1,
      isCompleted: true,
      finishedAt: new Date(),
      scores: { create: [{ entryId, kind: "DressageMovement", pointsAwarded: percentage, comments: "Eventing — Dressage phase aggregate %" }] },
    },
  });

  revalidatePath("/scoring/eventing");
  return { ok: true, total: rec.total, dressagePenalty: (100 - percentage) * DRESSAGE_TO_PENALTY_FACTOR };
}

export async function recordEventingCrossCountryPhase(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const entryId = formData.get("entryId") as string;
  const refusals = Number(formData.get("refusals") ?? 0);
  const fallsRider = Number(formData.get("fallsRider") ?? 0);
  const fallsHorse = Number(formData.get("fallsHorse") ?? 0);
  const optimumTimeSec = Number(formData.get("optimumTimeSec") ?? 360);
  const recordedTimeSec = Number(formData.get("recordedTimeSec") ?? optimumTimeSec);
  const maximumTimeSec = Number(formData.get("maximumTimeSec") ?? optimumTimeSec * 2);
  const isJunior = formData.get("isJunior") === "on";

  const refusalsList: Array<{ obstacleNo: number; ordinal: 1 | 2 | 3 }> = [];
  for (let i = 0; i < Math.min(3, refusals); i++) refusalsList.push({ obstacleNo: 1, ordinal: (i + 1) as 1 | 2 | 3 });

  const cc = scoreCrossCountry({
    refusalsByObstacle: refusalsList,
    fallsRider,
    fallsHorse,
    optimumTimeSec,
    recordedTimeSec,
    maximumTimeSec,
    isJunior,
  });

  const cur = await readPhases(entryId);
  const next: PhaseRecord = { ...cur, ccPenalty: cc.eliminated ? cur.ccPenalty : cc.total, eliminated: cc.eliminated || cur.eliminated };
  const rec = recompute(next);

  await prisma.result.upsert({
    where: { entryId },
    create: {
      entryId,
      totalRaw: next.ccPenalty ?? 0,
      totalAfterPen: rec.total === Number.POSITIVE_INFINITY ? 0 : rec.total,
      percentage: cur.dressagePct ?? 0,
      timePenalty: next.sjPenalty ?? 0,
      status: rec.eliminated ? "Eliminated" : "Completed",
    },
    update: {
      totalRaw: next.ccPenalty ?? 0,
      totalAfterPen: rec.total === Number.POSITIVE_INFINITY ? 0 : rec.total,
      status: rec.eliminated ? "Eliminated" : "Completed",
      computedAt: new Date(),
    },
  });

  revalidatePath("/scoring/eventing");
  return { ok: true, ccPenalty: cc.total, total: rec.total, eliminated: cc.eliminated };
}

export async function recordEventingShowJumpingPhase(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const entryId = formData.get("entryId") as string;
  const optimumTimeSec = Number(formData.get("optimumTimeSec") ?? 80);
  const recordedTimeSec = Number(formData.get("recordedTimeSec") ?? optimumTimeSec);
  const rails = Number(formData.get("rails") ?? 0);
  const refusals = Number(formData.get("refusals") ?? 0);
  const fallRider = formData.get("fallRider") === "on";
  const fallHorse = formData.get("fallHorse") === "on";

  const faults: SJFault[] = [];
  for (let i = 0; i < rails; i++) faults.push({ type: "Rail" });
  if (refusals >= 1) faults.push({ type: "Refusal", ordinal: 1 });
  if (refusals >= 2) faults.push({ type: "Refusal", ordinal: 2 });
  if (fallRider) faults.push({ type: "FallRider" });
  if (fallHorse) faults.push({ type: "FallHorse" });

  const sj = scoreSJRound({ faults, optimumTimeSec, recordedTimeSec });
  const cur = await readPhases(entryId);
  const next: PhaseRecord = { ...cur, sjPenalty: sj.eliminated ? cur.sjPenalty : sj.total, eliminated: sj.eliminated || cur.eliminated };
  const rec = recompute(next);

  await prisma.result.upsert({
    where: { entryId },
    create: {
      entryId,
      totalRaw: cur.ccPenalty ?? 0,
      totalAfterPen: rec.total === Number.POSITIVE_INFINITY ? 0 : rec.total,
      percentage: cur.dressagePct ?? 0,
      timePenalty: next.sjPenalty ?? 0,
      status: rec.eliminated ? "Eliminated" : "Completed",
      meetsMER: !rec.eliminated,
      meetsMedal: !rec.eliminated,
    },
    update: {
      timePenalty: next.sjPenalty ?? 0,
      totalAfterPen: rec.total === Number.POSITIVE_INFINITY ? 0 : rec.total,
      status: rec.eliminated ? "Eliminated" : "Completed",
      meetsMER: !rec.eliminated,
      meetsMedal: !rec.eliminated,
      computedAt: new Date(),
    },
  });

  revalidatePath("/scoring/eventing");
  revalidatePath("/leaderboard");
  return { ok: true, sjPenalty: sj.total, total: rec.total, eliminated: sj.eliminated };
}
