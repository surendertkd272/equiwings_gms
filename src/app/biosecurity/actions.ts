"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function raiseAlertAction(formData: FormData): Promise<void> {
  const horseId = formData.get("horseId") as string;
  const reason = formData.get("reason") as string;
  const horse = await prisma.horse.findUnique({ where: { id: horseId } });
  if (!horse) return;

  await prisma.biosecurityAlert.create({
    data: { horseId, reason, status: "Quarantine" },
  });

  const assignment = await prisma.stallAssignment.findFirst({
    where: { horseId, untilAt: null },
    include: { stall: true },
  });

  await prisma.notification.createMany({
    data: [
      {
        recipientId: horse.id,
        recipientType: "Broadcast",
        channel: "Push",
        subject: `Biosecurity alert: ${horse.registeredName}`,
        body: `Quarantine raised for ${horse.registeredName}. Reason: ${reason}. Block ${assignment?.stall.block ?? "—"} locked.`,
      },
      {
        recipientId: horse.id,
        recipientType: "Official",
        channel: "Push",
        subject: `Biosecurity alert: ${horse.registeredName}`,
        body: `Chief Vet + PGJ: ${horse.registeredName} flagged for ${reason}.`,
      },
    ],
  });

  await prisma.officialNotice.create({
    data: {
      title: `Biosecurity quarantine — ${horse.registeredName}`,
      body: `${horse.registeredName} has been quarantined. Reason: ${reason}. Stall block ${assignment?.stall.block ?? "—"} locked for new assignments.`,
      category: "Vet",
    },
  });

  revalidatePath("/biosecurity");
  revalidatePath("/notices");
  revalidatePath("/stabling");
}

export async function clearAlertAction(formData: FormData): Promise<void> {
  const alertId = formData.get("alertId") as string;
  const alert = await prisma.biosecurityAlert.update({
    where: { id: alertId },
    data: { resolvedAt: new Date(), status: "Cleared" },
  });
  const horse = await prisma.horse.findUnique({ where: { id: alert.horseId } });
  if (horse) {
    await prisma.officialNotice.create({
      data: {
        title: `Biosecurity cleared — ${horse.registeredName}`,
        body: `Quarantine on ${horse.registeredName} has been cleared.`,
        category: "Vet",
      },
    });
  }
  revalidatePath("/biosecurity");
  revalidatePath("/notices");
}
