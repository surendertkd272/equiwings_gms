"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkRiderEligibility, canEnterHC } from "@/lib/eligibility/registration";
import { isHorseOldEnough, isHorseTallEnoughForTentPegging } from "@/lib/eligibility/age-rules";
import type { Discipline } from "@/lib/eligibility/age-rules";

export interface CreateEntryResult {
  ok: boolean;
  errors: string[];
  entryId?: string;
}

export async function createEntryAction(formData: FormData): Promise<void> {
  const eventId = formData.get("eventId") as string;
  const riderId = formData.get("riderId") as string;
  const horseId = (formData.get("horseId") as string) || null;
  const isHC = formData.get("isHC") === "on";
  const startNumber = formData.get("startNumber") ? Number(formData.get("startNumber")) : null;
  const feeMinor = formData.get("feeMinor") ? Number(formData.get("feeMinor")) : 250000;

  if (!eventId || !riderId) {
    redirect("/entries/new?error=missing_required");
    return;
  }

  const [event, rider, horse, totalEntries] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, include: { tournament: true } }),
    prisma.rider.findUnique({ where: { id: riderId } }),
    horseId ? prisma.horse.findUnique({ where: { id: horseId } }) : Promise.resolve(null),
    prisma.entry.count({ where: { eventId } }),
  ]);
  if (!event || !rider) {
    redirect("/entries/new?error=not_found");
    return;
  }

  const reasons: string[] = [];

  // Rider eligibility.
  const re = checkRiderEligibility({
    efiId: rider.efiId,
    efiIdRenewedAt: rider.efiIdRenewedAt,
    competitionDate: event.scheduledStart ?? event.tournament.startDate,
    isForeign: rider.isForeign,
    nocOnFile: rider.nocOnFile,
    hasIndianPassport: !!rider.passportNumber,
    isNECChampionship: !event.tournament.isJNEC,
  });
  reasons.push(...re.reasons);

  // HC restrictions.
  if (isHC) {
    const hc = canEnterHC({ isJNEC: event.tournament.isJNEC, discipline: event.discipline, totalEntries });
    reasons.push(...hc.reasons);
    if (!event.isHCAllowed) reasons.push("This event does not allow HC entries");
  }

  // Horse eligibility.
  if (horse) {
    const validDisciplines: Discipline[] = ["Dressage", "ShowJumping", "Eventing", "Endurance", "TentPegging"];
    if (!validDisciplines.includes(event.discipline as Discipline)) {
      reasons.push(`Unknown discipline ${event.discipline}`);
    } else {
      const ok = isHorseOldEnough({
        horseDob: horse.dateOfBirth,
        competitionDate: event.scheduledStart ?? event.tournament.startDate,
        discipline: event.discipline as Discipline,
        grade: event.grade ?? undefined,
      });
      if (!ok) reasons.push(`Horse below minimum age for ${event.discipline}${event.grade ? ` ${event.grade}` : ""}`);
    }
    if (event.discipline === "TentPegging" && !isHorseTallEnoughForTentPegging(horse.heightHandsX10)) {
      reasons.push("Horse below 14.2hh — not eligible for Tent Pegging");
    }
  }

  if (reasons.length > 0) {
    const q = encodeURIComponent(reasons.join("|"));
    redirect(`/entries/new?eventId=${eventId}&riderId=${riderId}&errors=${q}`);
    return;
  }

  const entry = await prisma.entry.create({
    data: {
      eventId,
      riderId,
      horseId,
      startNumber: startNumber ?? totalEntries + 1,
      isHC,
      feeMinor,
    },
  });

  revalidatePath("/entries");
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}
