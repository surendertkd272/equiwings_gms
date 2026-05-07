import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, EmptyState, LinkButton } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EntriesIndex() {
  const entries = await prisma.entry.findMany({
    orderBy: [{ event: { code: "asc" } }, { startNumber: "asc" }],
    include: { rider: true, horse: true, event: { include: { tournament: true } } },
  });

  return (
    <div className="space-y-6">
      <PageTitle
        title="Entries"
        description="Rider–horse combinations registered for events."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Entries" }]}
        right={<LinkButton href="/entries/new" variant="primary">+ New entry</LinkButton>}
      />
      <Card>
        <CardHeader title={`${entries.length} entries`} />
        <CardBody className="p-0">
          {entries.length === 0 ? (
            <EmptyState title="No entries" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide w-14">#</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Event</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Rider</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Horse</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Tournament</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/50">
                    <td className="px-5 py-3 font-mono numeric">{e.startNumber ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Link href={`/events/${e.event.id}`} className="font-mono text-xs hover:text-brand-600">{e.event.code}</Link>
                      <div className="text-xs text-ink-500">{e.event.name}</div>
                    </td>
                    <td className="px-5 py-3 font-medium">
                      <Link href={`/riders/${e.rider.id}`} className="hover:text-brand-600">{e.rider.firstName} {e.rider.lastName}</Link>
                    </td>
                    <td className="px-5 py-3">
                      {e.horse ? <Link href={`/horses/${e.horse.id}`} className="hover:text-brand-600">{e.horse.registeredName}</Link> : "—"}
                    </td>
                    <td className="px-5 py-3 text-ink-500">{e.event.tournament.shortCode}</td>
                    <td className="px-5 py-3">
                      {e.isWithdrawn ? <Badge tone="warn">Withdrawn</Badge> :
                        e.isEliminated ? <Badge tone="danger">Eliminated</Badge> :
                        e.isHC ? <Badge>HC</Badge> :
                        <Badge tone="success">Active</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
