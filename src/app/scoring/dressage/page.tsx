import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle } from "@/components/ui";
import { DressageForm } from "./DressageForm";

export const dynamic = "force-dynamic";

export default async function ScoreDressagePage() {
  const events = await prisma.event.findMany({
    where: { discipline: "Dressage" },
    include: { entries: { include: { rider: true, horse: true } } },
    orderBy: { code: "asc" },
  });
  const data = events.map((e) => ({
    id: e.id,
    code: e.code,
    name: e.name,
    entries: e.entries.map((en) => ({ id: en.id, rider: `${en.rider.firstName} ${en.rider.lastName}` + (en.horse ? ` · ${en.horse.registeredName}` : "") })),
  }));

  return (
    <div className="space-y-6">
      <PageTitle title="Score · Dressage" description="Per-judge entry — collect movement marks and course errors." />
      <Card>
        <CardHeader title="Single-judge entry" subtitle="At NEC, three judges' scores are averaged. This form represents one judge's submission." />
        <CardBody>
          {data.length === 0 ? (
            <div className="text-sm text-ink-500">No Dressage events available.</div>
          ) : (
            <DressageForm events={data} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
