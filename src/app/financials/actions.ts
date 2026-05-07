"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function generateInvoiceAction(formData: FormData): Promise<void> {
  const riderId = formData.get("riderId") as string;
  if (!riderId) return;
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    include: {
      entries: {
        where: { paidAt: null },
        include: { event: true },
      },
    },
  });
  if (!rider || rider.entries.length === 0) return;

  const lineItems = rider.entries.map((e) => ({
    itemCode: e.isHC ? "HC_ENTRY" : "BASE_ENTRY",
    description: `${e.event.code} — ${e.event.name}`,
    quantity: 1,
    unitMinor: e.feeMinor ?? 250000,
    totalMinor: e.feeMinor ?? 250000,
  }));
  const totalMinor = lineItems.reduce((acc, i) => acc + i.totalMinor, 0);

  await prisma.invoice.create({
    data: {
      riderId,
      totalMinor,
      status: "Pending",
      lineItems: { create: lineItems },
    },
  });

  revalidatePath("/financials");
}

export async function markPaidAction(formData: FormData): Promise<void> {
  const invoiceId = formData.get("invoiceId") as string;
  const inv = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "Paid", paidAt: new Date() },
  });
  if (inv.riderId) {
    await prisma.entry.updateMany({
      where: { riderId: inv.riderId, paidAt: null },
      data: { paidAt: new Date() },
    });
  }
  revalidatePath("/financials");
}
