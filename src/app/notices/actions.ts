"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function postNoticeAction(formData: FormData): Promise<void> {
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const category = formData.get("category") as string;
  const eventId = (formData.get("eventId") as string) || null;
  if (!title || !body) return;
  await prisma.officialNotice.create({
    data: { title, body, category, eventId: eventId || undefined },
  });
  await prisma.notification.create({
    data: {
      recipientId: "broadcast",
      recipientType: "Broadcast",
      channel: "Push",
      subject: title,
      body,
    },
  });
  revalidatePath("/notices");
}
