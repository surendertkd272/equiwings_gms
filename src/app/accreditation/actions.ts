"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const ZONES_BY_ROLE: Record<string, string> = {
  Rider: "GeneralShowground,CompetitionArena,WarmUp,Stabling,VetBox,StartFinish",
  Trainer: "GeneralShowground,WarmUp,Stabling",
  Groom: "GeneralShowground,Stabling,VetBox",
  Official: "GeneralShowground,CompetitionArena,WarmUp,OfficialsArea,VetBox,StartFinish",
  Volunteer: "GeneralShowground,CompetitionArena",
  Media: "GeneralShowground,MediaCentre",
  VIP: "GeneralShowground,VIP",
};

export async function issueBadgeAction(formData: FormData): Promise<void> {
  const role = formData.get("role") as string;
  const riderId = (formData.get("riderId") as string) || null;
  const staffName = (formData.get("staffName") as string) || null;
  const zoneAccess = ZONES_BY_ROLE[role] ?? "GeneralShowground";
  const seed = riderId ?? staffName ?? `${role}-${Date.now()}`;
  const qrCode = `EW-${role.slice(0, 2).toUpperCase()}-${seed}-${Date.now()}`;

  await prisma.badge.create({
    data: {
      role,
      riderId,
      staffName,
      qrCode,
      zoneAccess,
    },
  });
  revalidatePath("/accreditation");
}

export async function revokeBadgeAction(formData: FormData): Promise<void> {
  const badgeId = formData.get("badgeId") as string;
  await prisma.badge.update({ where: { id: badgeId }, data: { revokedAt: new Date() } });
  revalidatePath("/accreditation");
}
