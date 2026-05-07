import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, LinkButton, EmptyState } from "@/components/ui";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tournament: true,
      entries: {
        include: { rider: true, horse: true },
        orderBy: { startNumber: "asc" },
      },
    },
  });
  if (!event) notFound();

  const scoringHref =
    event.discipline === "TentPegging"
      ? `/scoring/tent-pegging?eventId=${event.id}`
      : event.discipline === "Dressage"
      ? `/scoring/dressage?eventId=${event.id}`
      : "/leaderboard";

  return (
    <div>
      <PageTitle
        title={event.name}
        description={`${event.tournament.shortCode} · ${event.discipline} · ${event.grade ?? "—"}`}
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/events", label: "Events" },
          { label: event.code },
        ]}
        right={
          <div className="flex gap-2">
            <LinkButton href={`/entries/new?eventId=${event.id}`}>+ Add entry</LinkButton>
            <LinkButton href={scoringHref} variant="primary">Open scoring</LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Event spec" />
          <CardBody className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-ink-500">Code</span><span className="font-mono">{event.code}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Format</span><span>{event.isTeamEvent ? "Team" : "Individual"}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">HC allowed</span><span>{event.isHCAllowed ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Rounds</span><span className="numeric">{event.rounds}</span></div>
            {event.speedMpm && <div className="flex justify-between"><span className="text-ink-500">Speed</span><span className="numeric">{event.speedMpm} m/min</span></div>}
            {event.timeAllowedMs && <div className="flex justify-between"><span className="text-ink-500">Time allowed</span><span className="numeric">{(event.timeAllowedMs / 1000).toFixed(2)}s</span></div>}
            {event.minHeightCm && <div className="flex justify-between"><span className="text-ink-500">Height</span><span className="numeric">{event.minHeightCm}–{event.maxHeightCm}cm</span></div>}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Order of go" subtitle={`${event.entries.length} entries`} />
          <CardBody className="p-0">
            {event.entries.length === 0 ? (
              <EmptyState
                title="No entries yet"
                hint="Add the first rider–horse combination to this event."
                action={<LinkButton href={`/entries/new?eventId=${event.id}`} variant="primary">+ Add entry</LinkButton>}
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-200">
                    <th className="px-5 py-2 font-medium w-14">#</th>
                    <th className="px-5 py-2 font-medium">Rider</th>
                    <th className="px-5 py-2 font-medium">Horse</th>
                    <th className="px-5 py-2 font-medium">Unit / Club</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {event.entries.map((e) => (
                    <tr key={e.id} className="border-b border-ink-100 last:border-b-0">
                      <td className="px-5 py-3 font-mono numeric">{e.startNumber ?? "—"}</td>
                      <td className="px-5 py-3 font-medium">{e.rider.firstName} {e.rider.lastName}</td>
                      <td className="px-5 py-3">{e.horse?.registeredName ?? "—"}</td>
                      <td className="px-5 py-3 text-ink-500">{e.rider.unitOrClub ?? "—"}</td>
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
    </div>
  );
}
