import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, LinkButton, EmptyState } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const DISCIPLINE_TONE: Record<string, "brand" | "neutral" | "warn" | "success"> = {
  TentPegging: "warn",
  Dressage: "brand",
  ShowJumping: "success",
  Eventing: "neutral",
  Endurance: "neutral",
};

export default async function TournamentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await prisma.tournament.findUnique({
    where: { id },
    include: {
      events: { include: { _count: { select: { entries: true } } }, orderBy: { discipline: "asc" } },
    },
  });
  if (!t) notFound();

  return (
    <div>
      <PageTitle
        title={t.name}
        description={`${t.shortCode} · ${t.venue ?? "Venue TBA"} · ${t.startDate.toISOString().slice(0, 10)} → ${t.endDate.toISOString().slice(0, 10)}`}
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { href: "/tournaments", label: "Tournaments" }, { label: t.shortCode }]}
        right={<LinkButton href={`/events/new?tournamentId=${t.id}`} variant="primary">+ Add event</LinkButton>}
      />
      <Card>
        <CardHeader title="Events" subtitle={`${t.events.length} events scheduled`} />
        <CardBody className="p-0">
          {t.events.length === 0 ? (
            <EmptyState
              title="No events yet"
              hint="Add the first event for this tournament."
              action={<LinkButton href={`/events/new?tournamentId=${t.id}`} variant="primary">+ Add event</LinkButton>}
            />
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-500 border-b border-ink-200">
                <th className="px-5 py-2 font-medium">Code</th>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Discipline</th>
                <th className="px-5 py-2 font-medium">Grade</th>
                <th className="px-5 py-2 font-medium">Format</th>
                <th className="px-5 py-2 font-medium">Entries</th>
              </tr>
            </thead>
            <tbody>
              {t.events.map((e) => (
                <tr key={e.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-5 py-3 font-mono text-xs">{e.code}</td>
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/events/${e.id}`} className="hover:text-brand-600">{e.name}</Link>
                  </td>
                  <td className="px-5 py-3"><Badge tone={DISCIPLINE_TONE[e.discipline] ?? "neutral"}>{e.discipline}</Badge></td>
                  <td className="px-5 py-3">{e.grade ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-500">
                    {e.isTeamEvent ? "Team" : "Individual"}{e.isJunior ? " · JNEC" : ""}
                  </td>
                  <td className="px-5 py-3 numeric">{e._count.entries}</td>
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
