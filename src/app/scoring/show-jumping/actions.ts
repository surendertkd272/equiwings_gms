"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { scoreSJRound, type SJFault, type SJGrade, meetsSJMedalIndividual } from "@/lib/scoring/show-jumping";

export async function recordSJRoundAction(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const entryId = formData.get("entryId") as string;
  const optimumTimeSec = Number(formData.get("optimumTimeSec") ?? 0);
  const recordedTimeSec = Number(formData.get("recordedTimeSec") ?? 0);
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

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.discipline !== "ShowJumping") return { ok: false, error: "Not a Show Jumping event" };

  const result = scoreSJRound({ faults, optimumTimeSec, recordedTimeSec });

  await prisma.run.create({
    data: {
      eventId,
      entryId,
      roundNo: 1,
      runNo: 1,
      isCompleted: true,
      finishedAt: new Date(),
      scores: {
        create: faults.map((f) => ({
          entryId,
          kind: "SJFault" as const,
          faultType: f.type,
          pointsAwarded: f.type === "Rail" || (f.type === "Refusal" && f.ordinal === 1) ? 4 : 0,
        })),
      },
    },
  });

  const totalPenalties = result.eliminated ? 999 : result.total;
  await prisma.result.upsert({
    where: { entryId },
    create: {
      entryId,
      totalRaw: totalPenalties,
      totalAfterPen: totalPenalties,
      timePenalty: result.timeFault,
      status: result.eliminated ? "Eliminated" : "Completed",
      meetsMER: !result.eliminated,
      meetsMedal: !result.eliminated && (event.grade ? meetsSJMedalIndividual(event.grade as SJGrade, totalPenalties) : false),
    },
    update: {
      totalRaw: totalPenalties,
      totalAfterPen: totalPenalties,
      timePenalty: result.timeFault,
      status: result.eliminated ? "Eliminated" : "Completed",
      meetsMER: !result.eliminated,
      meetsMedal: !result.eliminated && (event.grade ? meetsSJMedalIndividual(event.grade as SJGrade, totalPenalties) : false),
      computedAt: new Date(),
    },
  });

  revalidatePath("/scoring/show-jumping");
  revalidatePath("/leaderboard");
  return { ok: true, computed: result };
}
