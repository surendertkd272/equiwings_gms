import { prisma } from "@/lib/db";
import { PageTitle, Card, CardBody, CardHeader, Stat, Badge, Button, Field, Input } from "@/components/ui";
import { StallGrid } from "./StallGrid";
import { createStallAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function StablingPage() {
  const [stalls, horses, alerts] = await Promise.all([
    prisma.stall.findMany({
      include: { assignments: { where: { untilAt: null }, include: { horse: true }, take: 1 } },
      orderBy: [{ block: "asc" }, { stallNumber: "asc" }],
    }),
    prisma.horse.findMany({ orderBy: { registeredName: "asc" } }),
    prisma.biosecurityAlert.findMany({ where: { resolvedAt: null } }),
  ]);

  const byBlock: Record<string, ReturnType<typeof toView>[]> = {};
  for (const s of stalls) {
    byBlock[s.block] ??= [];
    byBlock[s.block].push(toView(s));
  }

  function toView(s: typeof stalls[number]) {
    const a = s.assignments[0];
    return {
      id: s.id,
      block: s.block,
      stallNumber: s.stallNumber,
      isStallion: s.isStallion,
      isQuarantine: s.isQuarantine,
      isTack: s.isTack,
      isFeed: s.isFeed,
      current: a
        ? {
            assignmentId: a.id,
            horseId: a.horseId,
            horseName: a.horse.registeredName,
            horseSex: a.horse.sex,
            groomName: a.groomName,
          }
        : null,
    };
  }

  const occupied = stalls.filter((s) => s.assignments.length > 0).length;
  const stallions = stalls.filter((s) => s.isStallion).length;
  const horsesUnassigned = horses.length - new Set(stalls.flatMap((s) => s.assignments.map((a) => a.horseId))).size;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Stabling map"
        description="Drag-friendly stall grid. Stallion blocks are guarded; biosecurity alerts trigger quarantine on the affected block."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Stabling" }]}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total stalls" value={stalls.length} />
        <Stat label="Occupied" value={`${occupied} / ${stalls.length}`} />
        <Stat label="Stallion stalls" value={stallions} hint="Designated separate block" />
        <Stat label="Horses unassigned" value={horsesUnassigned} tone={horsesUnassigned > 0 ? "warn" : "default"} />
      </div>

      {alerts.length > 0 && (
        <Card>
          <CardHeader title="Biosecurity in effect" subtitle="Affected blocks are locked for new assignments" right={<Badge tone="danger">{alerts.length} active</Badge>} />
        </Card>
      )}

      <Card>
        <CardHeader title="Add stall" subtitle="Quickly extend a block — for tack, feed, or new horse stalls." />
        <form action={createStallAction}>
          <CardBody className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <Field label="Block"><Input name="block" required placeholder="Block C" /></Field>
            <Field label="Stall #"><Input name="stallNumber" required placeholder="C-9" /></Field>
            <label className="flex items-center gap-2 text-sm pb-2"><input type="checkbox" name="isStallion" /> Stallion</label>
            <label className="flex items-center gap-2 text-sm pb-2"><input type="checkbox" name="isQuarantine" /> Quarantine</label>
            <label className="flex items-center gap-2 text-sm pb-2"><input type="checkbox" name="isTack" /> Tack stall</label>
            <Button>+ Add stall</Button>
          </CardBody>
        </form>
      </Card>

      <StallGrid
        stallsByBlock={byBlock}
        horses={horses.map((h) => ({ id: h.id, registeredName: h.registeredName, sex: h.sex }))}
      />
    </div>
  );
}
