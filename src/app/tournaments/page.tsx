import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, LinkButton } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TournamentsIndex() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "desc" },
    include: { events: true },
  });

  return (
    <div>
      <PageTitle
        title="Tournaments"
        description="National Equestrian Championships and Junior NEC events."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Tournaments" }]}
        right={<LinkButton href="/tournaments/new" variant="primary">+ New tournament</LinkButton>}
      />
      <Card>
        <CardHeader title="All tournaments" subtitle={`${tournaments.length} on record`} />
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-500 border-b border-ink-200">
                <th className="px-5 py-2 font-medium">Code</th>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Venue</th>
                <th className="px-5 py-2 font-medium">Dates</th>
                <th className="px-5 py-2 font-medium">Events</th>
                <th className="px-5 py-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/tournaments/${t.id}`} className="hover:text-brand-600">{t.shortCode}</Link>
                  </td>
                  <td className="px-5 py-3">{t.name}</td>
                  <td className="px-5 py-3 text-ink-500">{t.venue ?? "—"}</td>
                  <td className="px-5 py-3 numeric text-ink-500">{t.startDate.toISOString().slice(0, 10)} → {t.endDate.toISOString().slice(0, 10)}</td>
                  <td className="px-5 py-3 numeric">{t.events.length}</td>
                  <td className="px-5 py-3">{t.isJNEC ? <Badge tone="brand">JNEC</Badge> : <Badge>NEC</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
