"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TIME_ALLOWED_MS, type TPEventCode } from "@/lib/scoring/tent-pegging";

export async function createEventAction(formData: FormData): Promise<void> {
  const tournamentId = formData.get("tournamentId") as string;
  const code = (formData.get("code") as string).trim().toUpperCase();
  const name = (formData.get("name") as string).trim();
  const discipline = formData.get("discipline") as string;
  const grade = ((formData.get("grade") as string) || "").trim() || null;
  const isTeamEvent = formData.get("isTeamEvent") === "on";
  const isHCAllowed = formData.get("isHCAllowed") === "on";
  const isJunior = formData.get("isJunior") === "on";
  const arenaOrTrack = (formData.get("arenaOrTrack") as string) || null;
  const rounds = Number(formData.get("rounds") ?? 1);

  if (!tournamentId || !code || !name || !discipline) return;

  // Auto-fill TP-specific time-allowed if the code is one we know.
  const tpAllowed = (TIME_ALLOWED_MS as Record<string, number>)[code as TPEventCode];

  await prisma.event.create({
    data: {
      tournamentId,
      code,
      name,
      discipline,
      grade,
      isTeamEvent,
      isHCAllowed,
      isJunior,
      arenaOrTrack,
      rounds,
      timeAllowedMs: discipline === "TentPegging" ? tpAllowed ?? null : null,
      speedMpm: discipline === "TentPegging" && tpAllowed ? Math.round(80 / (tpAllowed / 60000)) : null,
    },
  });

  revalidatePath("/events");
  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}`);
}
