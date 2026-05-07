"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createTournamentAction(formData: FormData): Promise<void> {
  const name = (formData.get("name") as string).trim();
  const shortCode = (formData.get("shortCode") as string).trim().toUpperCase();
  const venue = (formData.get("venue") as string) || null;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const isJNEC = formData.get("isJNEC") === "on";

  if (!name || !shortCode || !startDate || !endDate) return;

  const t = await prisma.tournament.create({
    data: {
      name,
      shortCode,
      venue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isJNEC,
    },
  });
  revalidatePath("/tournaments");
  redirect(`/tournaments/${t.id}`);
}
