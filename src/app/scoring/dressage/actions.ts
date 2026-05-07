"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { scoreDressage, averageJudges, type DressageMovement, type DressageGrade } from "@/lib/scoring/dressage";

interface RecordPayload {
  eventId: string;
  entryId: string;
  errorsOfCourse: number;
  judges: Array<{
    judgeName: string;
    movements: DressageMovement[];
  }>;
}

function medalFloor(grade: string | null): number {
  const floors: Partial<Record<DressageGrade, number>> = {
    Preliminary: 65,
    Elementary: 64,
    Medium: 63,
    AdvancedMedium: 62,
    Advanced: 60,
    PrixStGeorges: 59,
    IntermediateI: 58,
  };
  return grade ? (floors[grade as DressageGrade] ?? 60) : 60;
}

export async function recordDressageAction(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const entryId = formData.get("entryId") as string;
  const errorsOfCourse = Number(formData.get("errorsOfCourse") ?? 0);

  // Parse N judges, each with their movement marks.
  const judgeCount = Number(formData.get("judgeCount") ?? 1);
  const judges: RecordPayload["judges"] = [];
  for (let j = 0; j < judgeCount; j++) {
    const judgeName = (formData.get(`judges[${j}].name`) as string) || `Judge ${j + 1}`;
    const movements: DressageMovement[] = [];
    let m = 0;
    while (formData.has(`judges[${j}].movements[${m}].mark`)) {
      const mark = Number(formData.get(`judges[${j}].movements[${m}].mark`) || 0);
      const coefficient = Number(formData.get(`judges[${j}].movements[${m}].coefficient`) || 1);
      const movementNo = Number(formData.get(`judges[${j}].movements[${m}].movementNo`) || m + 1);
      movements.push({ movementNo, coefficient: (coefficient === 2 ? 2 : 1) as 1 | 2, mark, maxMark: 10 });
      m++;
    }
    if (movements.length > 0) judges.push({ judgeName, movements });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.discipline !== "Dressage") return { ok: false, error: "Not a Dressage event" };
  if (judges.length === 0) return { ok: false, error: "No judge data submitted" };

  const perJudge = judges.map((j) => ({
    judgeName: j.judgeName,
    result: scoreDressage({ movements: j.movements, errorsOfCourse }),
  }));
  const avgPercent = averageJudges(perJudge.map((p) => p.result));
  const eliminated = perJudge.some((p) => p.result.eliminated);

  // Persist a Run with all movements from all judges.
  await prisma.run.create({
    data: {
      eventId,
      entryId,
      roundNo: 1,
      runNo: 1,
      isCompleted: true,
      finishedAt: new Date(),
      scores: {
        create: judges.flatMap((j) =>
          j.movements.map((m) => ({
            entryId,
            kind: "DressageMovement" as const,
            movementNo: m.movementNo,
            rawMark: m.mark,
            coefficient: m.coefficient,
            pointsAwarded: m.mark * m.coefficient,
            comments: j.judgeName,
          }))
        ),
      },
    },
  });

  const totalRaw = perJudge.reduce((acc, p) => acc + p.result.totalRaw, 0) / perJudge.length;
  const floor = medalFloor(event.grade);

  await prisma.result.upsert({
    where: { entryId },
    create: {
      entryId,
      totalRaw,
      totalAfterPen: totalRaw,
      percentage: avgPercent,
      status: eliminated ? "Eliminated" : "Completed",
      meetsMER: !eliminated && avgPercent >= 60,
      meetsMedal: !eliminated && avgPercent >= floor,
    },
    update: {
      totalRaw,
      totalAfterPen: totalRaw,
      percentage: avgPercent,
      status: eliminated ? "Eliminated" : "Completed",
      computedAt: new Date(),
      meetsMER: !eliminated && avgPercent >= 60,
      meetsMedal: !eliminated && avgPercent >= floor,
    },
  });

  revalidatePath("/scoring/dressage");
  revalidatePath("/leaderboard");
  return {
    ok: true,
    averagePercent: avgPercent,
    perJudge: perJudge.map((p) => ({ name: p.judgeName, percent: p.result.finalPercentage, eliminated: p.result.eliminated })),
  };
}
