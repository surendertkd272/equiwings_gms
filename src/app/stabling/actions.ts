"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createStallAction(formData: FormData): Promise<void> {
  const block = (formData.get("block") as string).trim();
  const stallNumber = (formData.get("stallNumber") as string).trim();
  const isStallion = formData.get("isStallion") === "on";
  const isQuarantine = formData.get("isQuarantine") === "on";
  const isTack = formData.get("isTack") === "on";
  const isFeed = formData.get("isFeed") === "on";
  if (!block || !stallNumber) return;
  await prisma.stall.create({ data: { block, stallNumber, isStallion, isQuarantine, isTack, isFeed } });
  revalidatePath("/stabling");
}

export async function assignStallAction(formData: FormData) {
  const stallId = formData.get("stallId") as string;
  const horseId = formData.get("horseId") as string;
  const groomName = (formData.get("groomName") as string) || null;

  // Stallion-block guard.
  const [stall, horse] = await Promise.all([
    prisma.stall.findUnique({ where: { id: stallId } }),
    prisma.horse.findUnique({ where: { id: horseId } }),
  ]);
  if (!stall || !horse) return { ok: false, error: "Not found" };
  if (horse.sex === "Stallion" && !stall.isStallion) {
    return { ok: false, error: "Stallions must be allocated to designated stallion blocks" };
  }
  if (stall.isStallion && horse.sex !== "Stallion") {
    return { ok: false, error: "Stallion-only stall — non-stallion horses not allowed" };
  }

  // Close any prior assignment for the horse.
  await prisma.stallAssignment.updateMany({
    where: { horseId, untilAt: null },
    data: { untilAt: new Date() },
  });

  await prisma.stallAssignment.create({
    data: { stallId, horseId, groomName: groomName ?? undefined },
  });

  revalidatePath("/stabling");
  return { ok: true };
}

export async function releaseStallAction(formData: FormData) {
  const assignmentId = formData.get("assignmentId") as string;
  await prisma.stallAssignment.update({
    where: { id: assignmentId },
    data: { untilAt: new Date() },
  });
  revalidatePath("/stabling");
  return { ok: true };
}
