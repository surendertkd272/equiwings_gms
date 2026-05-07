import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeaderboardIndex() {
  const events = await prisma.event.findMany({
    include: {
      tournament: true,
      entries: {
        include: {
          rider: true,
          horse: true,
        },
      },
    },
    orderBy: [{ discipline: "asc" }, { code: "asc" }],
  });
  const allResults = await prisma.result.findMany();
  const byEntry = new Map(allResults.map((r) => [r.entryId, r]));

  const grouped: Record<string, typeof events> = {};
  for (const e of events) {
    grouped[e.discipline] ??= [];
    grouped[e.discipline].push(e);
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Leaderboards" description="Live standings — updated each time a judge submits scores." />
      {Object.entries(grouped).map(([discipline, list]) => (
        <div key={discipline} className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">{discipline}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {list.map((event) => {
              const ranked = [...event.entries]
                .map((entry) => ({ entry, result: byEntry.get(entry.id) }))
                .filter((x) => x.result)
                .sort((a, b) => {
                  if (event.discipline === "Dressage") return (b.result!.percentage ?? 0) - (a.result!.percentage ?? 0);
                  if (event.discipline === "TentPegging") return (b.result!.totalAfterPen ?? 0) - (a.result!.totalAfterPen ?? 0);
                  // Show jumping: lower is better
                  return (a.result!.totalAfterPen ?? 0) - (b.result!.totalAfterPen ?? 0);
                });
              return (
                <Card key={event.id}>
                  <CardHeader
                    title={`${event.code} · ${event.name}`}
                    subtitle={`${event.tournament.shortCode} · ${ranked.length} scored / ${event.entries.length} entries`}
                    right={<Link href={`/events/${event.id}`} className="text-xs text-brand-600 hover:underline">View →</Link>}
                  />
                  <CardBody className="p-0">
                    {ranked.length === 0 ? (
                      <div className="px-5 py-6 text-sm text-ink-500">No scores yet.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-ink-500 border-b border-ink-200">
                            <th className="px-5 py-2 font-medium w-10">#</th>
                            <th className="px-5 py-2 font-medium">Rider</th>
                            <th className="px-5 py-2 font-medium">Horse</th>
                            <th className="px-5 py-2 font-medium">Score</th>
                            <th className="px-5 py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ranked.map(({ entry, result }, i) => (
                            <tr key={entry.id} className="border-b border-ink-100 last:border-b-0">
                              <td className="px-5 py-2 numeric font-mono">{i + 1}</td>
                              <td className="px-5 py-2 font-medium">{entry.rider.firstName} {entry.rider.lastName}</td>
                              <td className="px-5 py-2">{entry.horse?.registeredName ?? "—"}</td>
                              <td className="px-5 py-2 numeric">
                                {event.discipline === "Dressage"
                                  ? `${(result!.percentage ?? 0).toFixed(2)}%`
                                  : event.discipline === "TentPegging"
                                  ? result!.totalAfterPen.toFixed(1)
                                  : `${result!.totalAfterPen} pen`}
                              </td>
                              <td className="px-5 py-2">
                                {result!.status === "Eliminated"
                                  ? <Badge tone="danger">Eliminated</Badge>
                                  : result!.meetsMedal
                                  ? <Badge tone="success">Medal eligible</Badge>
                                  : result!.meetsMER
                                  ? <Badge tone="brand">MER met</Badge>
                                  : <Badge>Below medal</Badge>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
