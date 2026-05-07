"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createHorseAction(formData: FormData): Promise<void> {
  const efiHorseId = (formData.get("efiHorseId") as string).trim();
  const registeredName = (formData.get("registeredName") as string).trim();
  const sex = formData.get("sex") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const heightHandsX10 = Number(formData.get("heightHandsX10") ?? 0);
  const breed = (formData.get("breed") as string) || null;
  const microchip = (formData.get("microchip") as string) || null;
  const ownerId = (formData.get("ownerId") as string) || null;
  const trainerId = (formData.get("trainerId") as string) || null;
  const heightCertOnFile = formData.get("heightCertOnFile") === "on";

  if (!efiHorseId || !registeredName || !dateOfBirth || !heightHandsX10) return;

  const horse = await prisma.horse.create({
    data: {
      efiHorseId,
      registeredName,
      sex,
      dateOfBirth: new Date(dateOfBirth),
      heightHandsX10,
      breed,
      microchip,
      ownerId,
      trainerId,
      heightCertOnFile,
    },
  });

  // Optional: initial grade
  const initialDiscipline = (formData.get("gradeDiscipline") as string) || null;
  const initialGrade = (formData.get("gradeGrade") as string) || null;
  if (initialDiscipline && initialGrade) {
    await prisma.horseGrade.create({
      data: { horseId: horse.id, discipline: initialDiscipline, grade: initialGrade },
    });
  }

  revalidatePath("/horses");
  redirect(`/horses/${horse.id}`);
}
