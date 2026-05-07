import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, Pill, Stat, EmptyState } from "@/components/ui";
import { efiIdValidFor } from "@/lib/eligibility/registration";
import { juniorCategoryFor } from "@/lib/eligibility/age-rules";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RiderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rider = await prisma.rider.findUnique({
    where: { id },
    include: {
      ownedHorses: true,
      entries: {
        include: { event: { include: { tournament: true } }, horse: true },
        orderBy: { event: { code: "asc" } },
      },
      waivers: true,
      badges: true,
      riderPoints: { orderBy: { awardedAt: "desc" } },
    },
  });
  if (!rider) notFound();

  const today = new Date();
  const idValid = efiIdValidFor(today, rider.efiIdRenewedAt);
  const cat = juniorCategoryFor(rider.dateOfBirth, today.getUTCFullYear());

  return (
    <div className="space-y-6">
      <PageTitle
        title={`${rider.firstName} ${rider.lastName}`}
        description={`${rider.efiId} · ${rider.unitOrClub ?? "—"}`}
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { href: "/riders", label: "Riders" }, { label: `${rider.firstName} ${rider.lastName}` }]}
        right={
          <div className="flex items-center gap-2">
            {idValid ? <Pill tone="success">EFI ID valid</Pill> : <Pill tone="danger">EFI ID expired</Pill>}
            <Pill tone="brand">{rider.category}</Pill>
            {rider.isForeign && <Pill tone="warn">Foreign</Pill>}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Stat label="Entries" value={rider.entries.length} />
        <Stat label="Owned horses" value={rider.ownedHorses.length} />
        <Stat label="Points awarded" value={rider.riderPoints.reduce((acc, p) => acc + p.points, 0)} />
        <Stat label="Auto-classified" value={cat} hint="Per JNEC age rules (01 Jan ref)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Entries" />
          <CardBody className="p-0">
            {rider.entries.length === 0 ? (
              <EmptyState title="No entries" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Event</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Horse</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Tournament</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rider.entries.map((e) => (
                    <tr key={e.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/50">
                      <td className="px-5 py-3">
                        <Link href={`/events/${e.event.id}`} className="font-mono text-xs hover:text-brand-600">{e.event.code}</Link>
                        <div className="text-xs text-ink-500">{e.event.name}</div>
                      </td>
                      <td className="px-5 py-3">{e.horse?.registeredName ?? "—"}</td>
                      <td className="px-5 py-3 text-ink-500">{e.event.tournament.shortCode}</td>
                      <td className="px-5 py-3">
                        {e.isWithdrawn ? <Badge tone="warn">Withdrawn</Badge> :
                          e.isEliminated ? <Badge tone="danger">Eliminated</Badge> :
                          e.isHC ? <Badge>HC</Badge> :
                          e.paidAt ? <Badge tone="success">Active</Badge> : <Badge tone="warn">Unpaid</Badge>}
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
            <CardHeader title="Owned horses" />
            <CardBody>
              {rider.ownedHorses.length === 0 ? (
                <EmptyState title="No horses on this passport" />
              ) : (
                <ul className="text-sm space-y-2">
                  {rider.ownedHorses.map((h) => (
                    <li key={h.id} className="flex items-center justify-between">
                      <Link href={`/horses/${h.id}`} className="hover:text-brand-600">
                        <span className="font-medium">{h.registeredName}</span>
                      </Link>
                      <span className="text-xs text-ink-500">{h.sex} · {Math.floor(h.heightHandsX10 / 10)}.{h.heightHandsX10 % 10}hh</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Waivers & badges" />
            <CardBody>
              <div className="text-xs text-ink-600 mb-2">Waivers signed: {rider.waivers.length}</div>
              <div className="text-xs text-ink-600">Badges issued: {rider.badges.length}</div>
              {rider.badges.length > 0 && (
                <ul className="text-xs mt-2 space-y-1">
                  {rider.badges.slice(0, 4).map((b) => (
                    <li key={b.id} className="flex justify-between">
                      <span>{b.role}</span>
                      <span className="text-ink-500 numeric">{b.qrCode.slice(-8)}</span>
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
