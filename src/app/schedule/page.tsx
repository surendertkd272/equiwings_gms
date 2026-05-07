import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, Pill, EmptyState } from "@/components/ui";
import { detectConflicts, type RideSlot } from "@/lib/scheduling";

export const dynamic = "force-dynamic";

function eventDuration(discipline: string): number {
  if (discipline === "TentPegging") return 3;
  if (discipline === "Dressage") return 8;
  if (discipline === "ShowJumping") return 5;
  if (discipline === "Eventing") return 12;
  return 5;
}

export default async function SchedulePage() {
  const events = await prisma.event.findMany({
    include: {
      tournament: true,
      entries: {
        include: { rider: true, horse: true },
        orderBy: { startNumber: "asc" },
      },
    },
    orderBy: { discipline: "asc" },
  });

  // Synthesize ride slots — start time = event.scheduledStart (or t0) + offset by start number.
  const t0 = new Date("2026-05-12T09:00:00Z");
  const slots: RideSlot[] = [];
  for (const event of events) {
    const base = event.scheduledStart ?? new Date(t0.getTime() + Math.abs(hashCode(event.id)) % (4 * 3600_000));
    const dur = eventDuration(event.discipline);
    event.entries.forEach((entry, i) => {
      if (entry.isWithdrawn) return;
      const startsAt = new Date(base.getTime() + i * dur * 60_000);
      slots.push({
        id: entry.id,
        eventId: event.id,
        eventCode: event.code,
        riderId: entry.riderId,
        riderName: `${entry.rider.firstName} ${entry.rider.lastName}`,
        horseId: entry.horseId,
        horseName: entry.horse?.registeredName ?? null,
        arenaOrTrack: event.arenaOrTrack ?? `${event.discipline} Arena`,
        startsAt,
        durationMin: dur,
        discipline: event.discipline,
      });
    });
  }
  slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const conflicts = detectConflicts(slots);
  const conflictsByPair = new Map<string, number>();
  for (const c of conflicts) {
    if ("slotIdA" in c) {
      conflictsByPair.set(c.slotIdA, (conflictsByPair.get(c.slotIdA) ?? 0) + 1);
      conflictsByPair.set(c.slotIdB, (conflictsByPair.get(c.slotIdB) ?? 0) + 1);
    }
  }

  return (
    <div>
      <PageTitle
        title="Schedule"
        description="Order of go across all events. Conflicts flagged automatically per Module 4."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Schedule" }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader title="Order of go (today)" subtitle={`${slots.length} ride slots · ${conflicts.length} flagged`} />
            <CardBody className="p-0">
              {slots.length === 0 ? (
                <EmptyState title="No slots yet" hint="Events with entries will appear here." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                      <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Time</th>
                      <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Event</th>
                      <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Rider</th>
                      <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Horse</th>
                      <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Arena</th>
                      <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((s) => {
                      const issueCount = conflictsByPair.get(s.id) ?? 0;
                      return (
                        <tr key={s.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/50">
                          <td className="px-5 py-3 numeric font-mono text-xs">
                            {s.startsAt.toISOString().slice(11, 16)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-mono text-xs">{s.eventCode}</div>
                            <div className="text-[11px] text-ink-500">{s.discipline}</div>
                          </td>
                          <td className="px-5 py-3 font-medium">{s.riderName}</td>
                          <td className="px-5 py-3">{s.horseName ?? "—"}</td>
                          <td className="px-5 py-3 text-ink-500">{s.arenaOrTrack}</td>
                          <td className="px-5 py-3">
                            {issueCount > 0
                              ? <Pill tone="danger">{issueCount} conflict{issueCount > 1 ? "s" : ""}</Pill>
                              : <Pill tone="success">OK</Pill>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Conflicts" subtitle="Auto-detected" />
            <CardBody>
              {conflicts.length === 0 ? (
                <div className="text-sm text-ink-500"><Badge tone="success">All clear</Badge></div>
              ) : (
                <ul className="space-y-2 text-xs">
                  {conflicts.slice(0, 12).map((c, i) => (
                    <li key={i} className="border-l-2 border-amber-400 pl-2">
                      <div className="font-medium text-ink-800">{c.kind.replace(/([A-Z])/g, " $1").trim()}</div>
                      <div className="text-ink-500 numeric">
                        {c.kind === "HorseDailyLimit"
                          ? `Horse exceeded ${c.max}/day on ${c.date} (${c.count})`
                          : c.kind === "ArenaDoubleBooked"
                          ? `Arena ${c.arena} double-booked`
                          : "minutesApart" in c
                          ? `${c.minutesApart} min apart`
                          : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Daily ride limits" />
            <CardBody className="text-xs space-y-1.5 text-ink-600">
              <div className="flex justify-between"><span>Tent Pegging</span><span className="numeric">8 runs/day</span></div>
              <div className="flex justify-between"><span>Dressage / SJ (Senior)</span><span className="numeric">2 rounds/day</span></div>
              <div className="flex justify-between"><span>Children category</span><span className="numeric">3 rounds/day</span></div>
              <div className="text-ink-500 mt-2 text-[11px]">Per Module 4.1</div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
