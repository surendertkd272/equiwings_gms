"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const Schema = z.object({
  efiId: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(8),
  gender: z.enum(["M", "F", "X"]),
  category: z.enum(["Senior", "YoungRider", "Junior", "ChildrenI", "ChildrenII"]),
  unitOrClub: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  isForeign: z.coerce.boolean().optional(),
  efiIdRenewedAt: z.string().min(8),
  passportNumber: z.string().optional(),
});

export async function createRiderAction(formData: FormData): Promise<void> {
  const parsed = Schema.parse({
    efiId: formData.get("efiId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
    category: formData.get("category"),
    unitOrClub: formData.get("unitOrClub") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    isForeign: formData.get("isForeign") === "on",
    efiIdRenewedAt: formData.get("efiIdRenewedAt"),
    passportNumber: formData.get("passportNumber") || undefined,
  });

  const rider = await prisma.rider.create({
    data: {
      efiId: parsed.efiId,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      dateOfBirth: new Date(parsed.dateOfBirth),
      gender: parsed.gender,
      category: parsed.category,
      unitOrClub: parsed.unitOrClub || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      isForeign: parsed.isForeign ?? false,
      efiIdRenewedAt: new Date(parsed.efiIdRenewedAt),
      passportNumber: parsed.passportNumber || null,
    },
  });
  revalidatePath("/riders");
  redirect(`/riders/${rider.id}`);
}
