"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createOfficialAction(formData: FormData): Promise<void> {
  const firstName = (formData.get("firstName") as string).trim();
  const lastName = (formData.get("lastName") as string).trim();
  const efiPanelId = ((formData.get("efiPanelId") as string) || "").trim() || null;
  const email = (formData.get("email") as string) || null;
  const disciplines = (formData.get("disciplines") as string) || "";
  const roles = (formData.get("roles") as string) || "";
  const organisingEntity = (formData.get("organisingEntity") as string) || null;
  if (!firstName || !lastName) return;

  await prisma.official.create({
    data: { firstName, lastName, efiPanelId, email, disciplines, roles, organisingEntity },
  });
  revalidatePath("/officials");
  redirect("/officials");
}
