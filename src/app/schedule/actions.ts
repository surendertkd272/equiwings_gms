"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function setSlotAction(formData: FormData) {
  const entryId = formData.get("entryId") as string;
  const eventId = formData.get("eventId") as string;
  const startISO = formData.get("startsAt") as string;
  const startsAt = new Date(startISO);

  // Schedule via the event-level scheduledStart for now, with one Run row holding the slot.
  // Practical scheduling would model dedicated time-slots, but this keeps the data model lean.
  await prisma.run.upsert({
    where: { id: `${entryId}-slot` },
    create: {
      id: `${entryId}-slot`,
      eventId,
      entryId,
      roundNo: 1,
      runNo: 0, // 0 = scheduling placeholder
      startedAt: startsAt,
    },
    update: { startedAt: startsAt },
  });

  revalidatePath("/schedule");
  return { ok: true };
}

export async function withdrawEntryAction(formData: FormData) {
  const entryId = formData.get("entryId") as string;
  await prisma.entry.update({ where: { id: entryId }, data: { isWithdrawn: true } });

  // Notification side-effect.
  const entry = await prisma.entry.findUnique({ where: { id: entryId }, include: { rider: true, event: true } });
  if (entry) {
    await prisma.notification.create({
      data: {
        recipientId: entry.riderId,
        recipientType: "Rider",
        channel: "Push",
        subject: `Withdrawn from ${entry.event.code}`,
        body: `Your entry for ${entry.event.name} has been withdrawn. Order of go has been recalculated.`,
      },
    });
  }
  revalidatePath("/schedule");
  revalidatePath("/entries");
  return { ok: true };
}
