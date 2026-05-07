"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  scoreRun,
  type TPEventCode,
  type TargetHit,
  type RunInput,
  TIME_ALLOWED_MS,
} from "@/lib/scoring/tent-pegging";

const TargetSchema = z.object({
  type: z.enum(["Peg", "Ring", "Lemon"]),
  result: z.enum(["Carry", "Draw", "Strike", "Miss", "Hit", "Slice"]),
});

const RunSchema = z.object({
  eventId: z.string().min(1),
  entryId: z.string().min(1),
  roundNo: z.coerce.number().int().min(1).max(2),
  runNo: z.coerce.number().int().min(1).max(3),
  pegSizeCm: z.coerce.number().refine((n) => [6, 4, 2.5].includes(n), "pegSize must be 6, 4, or 2.5"),
  recordedTimeMs: z.coerce.number().int().min(0),
  targets: z.array(TargetSchema).min(1),
  isTieBreak: z.boolean().optional(),
  weaponDropped: z.boolean().optional(),
  riderFell: z.boolean().optional(),
  horseFell: z.boolean().optional(),
  carriedWrongPeg: z.boolean().optional(),
});

export async function recordRunAction(formData: FormData) {
  // Parse target rows from form. Targets are encoded as targets[i].type / .result.
  const targets: TargetHit[] = [];
  let i = 0;
  while (formData.has(`targets[${i}].type`)) {
    targets.push({
      type: formData.get(`targets[${i}].type`) as TargetHit["type"],
      result: formData.get(`targets[${i}].result`) as TargetHit["result"],
    });
    i++;
  }

  const parsed = RunSchema.safeParse({
    eventId: formData.get("eventId"),
    entryId: formData.get("entryId"),
    roundNo: formData.get("roundNo"),
    runNo: formData.get("runNo"),
    pegSizeCm: formData.get("pegSizeCm"),
    recordedTimeMs: formData.get("recordedTimeMs"),
    targets,
    isTieBreak: formData.get("isTieBreak") === "on",
    weaponDropped: formData.get("weaponDropped") === "on",
    riderFell: formData.get("riderFell") === "on",
    horseFell: formData.get("horseFell") === "on",
    carriedWrongPeg: formData.get("carriedWrongPeg") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten() };
  }

  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!event) return { ok: false, error: "Event not found" };
  if (event.discipline !== "TentPegging") {
    return { ok: false, error: "Not a Tent Pegging event" };
  }

  const tpCode = event.code as TPEventCode;
  if (!(tpCode in TIME_ALLOWED_MS)) {
    return { ok: false, error: `Unknown Tent Pegging event code: ${event.code}` };
  }

  const runInput: RunInput = {
    pegSizeCm: parsed.data.pegSizeCm as 6 | 4 | 2.5,
    recordedTimeMs: parsed.data.recordedTimeMs,
    targets: parsed.data.targets,
    isTieBreak: parsed.data.isTieBreak,
    weaponDropped: parsed.data.weaponDropped,
    riderFell: parsed.data.riderFell,
    horseFell: parsed.data.horseFell,
    carriedWrongPeg: parsed.data.carriedWrongPeg,
  };
  const computed = scoreRun(tpCode, runInput);

  // Persist Run + Score rows + recompute Result.
  const run = await prisma.run.create({
    data: {
      eventId: event.id,
      entryId: parsed.data.entryId,
      roundNo: parsed.data.roundNo,
      runNo: parsed.data.runNo,
      pegSizeCm: parsed.data.pegSizeCm === 2.5 ? 25 : parsed.data.pegSizeCm,
      recordedTimeMs: parsed.data.recordedTimeMs,
      isTieBreak: parsed.data.isTieBreak ?? false,
      isCompleted: true,
      finishedAt: new Date(),
      scores: {
        create: [
          ...parsed.data.targets.map((t) => ({
            entryId: parsed.data.entryId,
            kind: "TPTarget" as const,
            targetType: t.type,
            targetResult: t.result,
            pointsAwarded:
              t.type === "Peg"
                ? t.result === "Carry" ? 6 : t.result === "Draw" ? 4 : t.result === "Strike" ? 2 : 0
                : t.type === "Ring"
                ? t.result === "Hit" ? 6 : 0
                : t.result === "Slice" ? 6 : 0,
          })),
          {
            entryId: parsed.data.entryId,
            kind: "TimePenalty" as const,
            pointsAwarded: -computed.timePenalty,
          },
        ],
      },
    },
    include: { scores: true },
  });

  // Roll up entry total from all runs of this entry.
  const entryRuns = await prisma.run.findMany({
    where: { entryId: parsed.data.entryId },
    include: { scores: true },
  });
  let totalRaw = 0;
  let totalAfterPen = 0;
  let timePen = 0;
  let eliminated = computed.eliminated;
  for (const r of entryRuns) {
    let runRaw = 0;
    let runPen = 0;
    for (const s of r.scores) {
      if (s.kind === "TPTarget") runRaw += s.pointsAwarded ?? 0;
      if (s.kind === "TimePenalty") runPen += -(s.pointsAwarded ?? 0);
    }
    totalRaw += runRaw;
    timePen += runPen;
    totalAfterPen += Math.max(0, runRaw - runPen);
  }

  await prisma.result.upsert({
    where: { entryId: parsed.data.entryId },
    create: {
      entryId: parsed.data.entryId,
      totalRaw,
      totalAfterPen,
      timePenalty: timePen,
      status: eliminated ? "Eliminated" : "Completed",
      meetsMER: totalAfterPen >= 24,
      meetsMedal: totalAfterPen >= 24,
    },
    update: {
      totalRaw,
      totalAfterPen,
      timePenalty: timePen,
      status: eliminated ? "Eliminated" : "Completed",
      meetsMER: totalAfterPen >= 24,
      meetsMedal: totalAfterPen >= 24,
      computedAt: new Date(),
    },
  });

  revalidatePath("/scoring/tent-pegging");
  revalidatePath("/leaderboard");
  return { ok: true, runId: run.id, computed };
}
