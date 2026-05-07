import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge } from "@/components/ui";
import { ScoringForm } from "./ScoringForm";

export const dynamic = "force-dynamic";

export default async function ScoreTentPeggingPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  const sp = await searchParams;
  const events = await prisma.event.findMany({
    where: { discipline: "TentPegging" },
    include: { entries: { include: { rider: true, horse: true }, orderBy: { startNumber: "asc" } } },
    orderBy: { code: "asc" },
  });
  const formData = events.map((e) => ({
    id: e.id,
    code: e.code,
    name: e.name,
    timeAllowedMs: e.timeAllowedMs,
    entries: e.entries.map((en) => ({
      id: en.id,
      startNumber: en.startNumber,
      rider: `${en.rider.firstName} ${en.rider.lastName}`,
      horse: en.horse?.registeredName ?? null,
    })),
  }));

  // Show recent runs for context.
  const recent = await prisma.run.findMany({
    where: { event: { discipline: "TentPegging" } },
    orderBy: { finishedAt: "desc" },
    take: 8,
    include: {
      event: true,
      entry: { include: { rider: true, horse: true } },
      scores: true,
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <PageTitle title="Score · Tent Pegging" description="Lane judge interface — record one run at a time." />
        <Card>
          <CardHeader title="Record run" subtitle="Targets are scored per Art. 414; time penalty per Appendix A" />
          <CardBody>
            {formData.length === 0 ? (
              <div className="text-sm text-ink-500">No Tent Pegging events available. Seed demo data first.</div>
            ) : (
              <ScoringForm events={formData} defaultEventId={sp.eventId} />
            )}
          </CardBody>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader title="Recent runs" />
          <CardBody>
            {recent.length === 0 ? (
              <div className="text-sm text-ink-500">No runs yet.</div>
            ) : (
              <ul className="space-y-3 text-sm">
                {recent.map((r) => {
                  const targetSum = r.scores.filter((s) => s.kind === "TPTarget").reduce((acc, s) => acc + (s.pointsAwarded ?? 0), 0);
                  const timePen = -r.scores.filter((s) => s.kind === "TimePenalty").reduce((acc, s) => acc + (s.pointsAwarded ?? 0), 0);
                  const net = Math.max(0, targetSum - timePen);
                  return (
                    <li key={r.id} className="border-b border-ink-100 pb-2 last:border-b-0">
                      <div className="flex justify-between">
                        <div className="font-medium">{r.entry.rider.firstName} {r.entry.rider.lastName}</div>
                        <div className="numeric">{net}</div>
                      </div>
                      <div className="text-xs text-ink-500 numeric">
                        {r.event.code} · R{r.roundNo}/Run {r.runNo} · {(r.recordedTimeMs ?? 0) / 1000}s · raw {targetSum}
                        {timePen > 0 && ` · −${timePen} time`}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card className="mt-4">
          <CardHeader title="Cheat sheet" />
          <CardBody className="text-sm space-y-1.5">
            <div>Peg: <Badge tone="success">Carry +6</Badge> <Badge tone="brand">Draw +4</Badge> <Badge>Strike +2</Badge></div>
            <div>Ring (lance): <Badge tone="success">Hit +6</Badge></div>
            <div>Lemon (sword): <Badge tone="success">Slice +6</Badge></div>
            <div className="text-ink-500 mt-2">1-second band over time = −0.5 points</div>
            <div className="text-ink-500">Weapon dropped → 0 + eliminated for run</div>
            <div className="text-ink-500">Tie-break: 2.5cm peg, one extra run</div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
