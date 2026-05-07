import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, LinkButton } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventsIndex() {
  const events = await prisma.event.findMany({
    include: {
      tournament: true,
      _count: { select: { entries: true, runs: true } },
    },
    orderBy: [{ discipline: "asc" }, { code: "asc" }],
  });

  return (
    <div>
      <PageTitle
        title="Events"
        description="All competition events across tournaments."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Events" }]}
        right={<LinkButton href="/events/new" variant="primary">+ New event</LinkButton>}
      />
      <Card>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-500 border-b border-ink-200">
                <th className="px-5 py-2 font-medium">Code</th>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Tournament</th>
                <th className="px-5 py-2 font-medium">Discipline</th>
                <th className="px-5 py-2 font-medium">Grade</th>
                <th className="px-5 py-2 font-medium">Entries</th>
                <th className="px-5 py-2 font-medium">Runs</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-5 py-3 font-mono text-xs">
                    <Link href={`/events/${e.id}`} className="hover:text-brand-600">{e.code}</Link>
                  </td>
                  <td className="px-5 py-3 font-medium">{e.name}</td>
                  <td className="px-5 py-3 text-ink-500">{e.tournament.shortCode}</td>
                  <td className="px-5 py-3"><Badge>{e.discipline}</Badge></td>
                  <td className="px-5 py-3">{e.grade ?? "—"}</td>
                  <td className="px-5 py-3 numeric">{e._count.entries}</td>
                  <td className="px-5 py-3 numeric">{e._count.runs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
