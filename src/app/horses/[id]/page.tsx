import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, Pill, Stat, EmptyState } from "@/components/ui";
import { isHorseTallEnoughForTentPegging } from "@/lib/eligibility/age-rules";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function formatHands(handsX10: number) {
  return `${Math.floor(handsX10 / 10)}.${handsX10 % 10}hh`;
}

export default async function HorseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const horse = await prisma.horse.findUnique({
    where: { id },
    include: {
      grades: true,
      owner: true,
      trainer: true,
      vetDocs: { orderBy: { issuedOn: "desc" } },
      vetInspections: { orderBy: { inspectedAt: "desc" }, take: 6 },
      stallAssignments: { include: { stall: true }, orderBy: { fromAt: "desc" }, take: 4 },
      entries: { include: { event: true, rider: true } },
    },
  });
  if (!horse) notFound();

  const tpEligible = isHorseTallEnoughForTentPegging(horse.heightHandsX10);
  const ageYears = ((Date.now() - horse.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  const currentStall = horse.stallAssignments.find((a) => !a.untilAt);

  return (
    <div className="space-y-6">
      <PageTitle
        title={horse.registeredName}
        description={`${horse.efiHorseId} · ${horse.sex} · ${formatHands(horse.heightHandsX10)} · ${ageYears}y`}
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { href: "/horses", label: "Horses" }, { label: horse.registeredName }]}
        right={
          <div className="flex gap-2">
            {horse.sex === "Stallion" && <Pill tone="warn">Stallion</Pill>}
            {tpEligible && <Pill tone="success">TP-eligible</Pill>}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Stat label="Owner" value={horse.owner ? `${horse.owner.firstName} ${horse.owner.lastName}` : "—"} />
        <Stat label="Trainer" value={horse.trainer ? `${horse.trainer.firstName} ${horse.trainer.lastName}` : "—"} />
        <Stat label="Stall" value={currentStall ? `${currentStall.stall.block} ${currentStall.stall.stallNumber}` : "Unassigned"} />
        <Stat label="Microchip" value={horse.microchip ?? "—"} hint="ISO standard" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Entries" />
          <CardBody className="p-0">
            {horse.entries.length === 0 ? (
              <EmptyState title="No entries" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Event</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Rider</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {horse.entries.map((e) => (
                    <tr key={e.id} className="border-b border-ink-100 last:border-b-0">
                      <td className="px-5 py-3">
                        <Link href={`/events/${e.event.id}`} className="font-mono text-xs hover:text-brand-600">{e.event.code}</Link>
                      </td>
                      <td className="px-5 py-3 font-medium">
                        <Link href={`/riders/${e.rider.id}`} className="hover:text-brand-600">{e.rider.firstName} {e.rider.lastName}</Link>
                      </td>
                      <td className="px-5 py-3">
                        {e.isWithdrawn ? <Badge tone="warn">Withdrawn</Badge> :
                          e.isEliminated ? <Badge tone="danger">Eliminated</Badge> :
                          <Badge tone="success">Active</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Grades" />
            <CardBody>
              {horse.grades.length === 0 ? (
                <div className="text-sm text-ink-500">No grades on file.</div>
              ) : (
                <ul className="text-sm space-y-1.5">
                  {horse.grades.map((g) => (
                    <li key={g.id} className="flex justify-between">
                      <span>{g.discipline}</span>
                      <Badge>{g.grade}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Recent vet inspections" />
            <CardBody>
              {horse.vetInspections.length === 0 ? (
                <div className="text-sm text-ink-500">No inspections.</div>
              ) : (
                <ul className="text-xs space-y-1.5">
                  {horse.vetInspections.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span>{i.phase}</span>
                      <span className="numeric text-ink-500">{i.inspectedAt.toISOString().slice(0, 10)} · {i.result}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
