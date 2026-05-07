import { prisma } from "@/lib/db";
import { Card, CardHeader, CardBody, Stat, Badge, LinkButton, EmptyState } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [tournaments, riderCount, horseCount, entryCount, resultCount, alerts, recentRuns, notices] = await Promise.all([
    prisma.tournament.findMany({ orderBy: { startDate: "desc" }, take: 4, include: { events: true } }),
    prisma.rider.count(),
    prisma.horse.count(),
    prisma.entry.count(),
    prisma.result.count(),
    prisma.biosecurityAlert.findMany({ where: { resolvedAt: null }, take: 3 }),
    prisma.run.findMany({
      where: { isCompleted: true },
      orderBy: { finishedAt: "desc" },
      take: 5,
      include: { event: true, entry: { include: { rider: true, horse: true } } },
    }),
    prisma.officialNotice.findMany({ orderBy: { postedAt: "desc" }, take: 3 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">National Equestrian Tournament — operations at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Tournaments" value={tournaments.length} />
        <Stat label="Riders" value={riderCount} />
        <Stat label="Horses" value={horseCount} />
        <Stat label="Entries" value={entryCount} hint={`${resultCount} scored`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Tournaments"
            subtitle="Recent and upcoming national events"
            right={<LinkButton href="/tournaments" size="sm">All →</LinkButton>}
          />
          <CardBody className="p-0">
            {tournaments.length === 0 ? (
              <EmptyState title="No tournaments yet" hint="Run pnpm db:seed to load demo data." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Code</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Name</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Dates</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Events</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((t) => (
                    <tr key={t.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/50">
                      <td className="px-5 py-3 font-medium">
                        <Link href={`/tournaments/${t.id}`} className="hover:text-brand-600">{t.shortCode}</Link>
                      </td>
                      <td className="px-5 py-3">{t.name}</td>
                      <td className="px-5 py-3 numeric text-ink-500">
                        {t.startDate.toISOString().slice(0, 10)} → {t.endDate.toISOString().slice(0, 10)}
                      </td>
                      <td className="px-5 py-3 numeric">{t.events.length}</td>
                      <td className="px-5 py-3">{t.isJNEC ? <Badge tone="brand">JNEC</Badge> : <Badge>NEC</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Biosecurity" subtitle={`${alerts.length} open`} right={alerts.length > 0 ? <Badge tone="danger">Alert</Badge> : <Badge tone="success">Clear</Badge>} />
            <CardBody>
              {alerts.length === 0 ? (
                <div className="text-sm text-ink-500">All clear across the showgrounds.</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {alerts.map((a) => (
                    <li key={a.id}>
                      <div className="font-medium">{a.reason}</div>
                      <div className="text-xs text-ink-500 numeric">{a.raisedAt.toISOString().slice(0, 10)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notice board" subtitle="Latest 3" right={<LinkButton href="/notices" size="sm">Open →</LinkButton>} />
            <CardBody>
              {notices.length === 0 ? (
                <div className="text-sm text-ink-500">No notices.</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {notices.map((n) => (
                    <li key={n.id}>
                      <div className="font-medium truncate">{n.title}</div>
                      <div className="text-xs text-ink-500">{n.category}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Latest scoring activity" subtitle="Last 5 completed runs" right={<LinkButton href="/leaderboard" size="sm">Leaderboards →</LinkButton>} />
          <CardBody className="p-0">
            {recentRuns.length === 0 ? (
              <EmptyState title="No runs yet" hint="Open one of the scoring pages to record a run." />
            ) : (
              <ul className="divide-y divide-ink-100">
                {recentRuns.map((r) => (
                  <li key={r.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.entry.rider.firstName} {r.entry.rider.lastName}</div>
                      <div className="text-xs text-ink-500 numeric">{r.event.code} · R{r.roundNo}/Run {r.runNo}{r.recordedTimeMs ? ` · ${(r.recordedTimeMs / 1000).toFixed(2)}s` : ""}</div>
                    </div>
                    <Badge>{r.event.discipline}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick add" />
          <CardBody className="space-y-2">
            <LinkButton href="/riders/new" variant="primary" className="w-full">+ New rider</LinkButton>
            <LinkButton href="/horses/new" className="w-full">+ New horse</LinkButton>
            <LinkButton href="/entries/new" className="w-full">+ New entry</LinkButton>
            <LinkButton href="/tournaments/new" className="w-full">+ New tournament</LinkButton>
            <LinkButton href="/events/new" className="w-full">+ New event</LinkButton>
            <div className="text-[11px] text-ink-500 mt-2 text-center">Tip — press <kbd className="px-1.5 py-0.5 rounded bg-ink-100 border border-ink-200">⌘K</kbd> for quick search</div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
