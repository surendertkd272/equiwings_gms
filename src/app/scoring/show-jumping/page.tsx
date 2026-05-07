import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle } from "@/components/ui";
import { SJForm } from "./SJForm";

export const dynamic = "force-dynamic";

export default async function ScoreShowJumpingPage() {
  const events = await prisma.event.findMany({
    where: { discipline: "ShowJumping" },
    include: { entries: { include: { rider: true, horse: true } } },
    orderBy: { code: "asc" },
  });
  const data = events.map((e) => ({
    id: e.id,
    code: e.code,
    name: e.name,
    speedMpm: e.speedMpmCourse,
    entries: e.entries.map((en) => ({ id: en.id, rider: `${en.rider.firstName} ${en.rider.lastName}` + (en.horse ? ` · ${en.horse.registeredName}` : "") })),
  }));

  return (
    <div className="space-y-6">
      <PageTitle
        title="Score · Show Jumping"
        description="Record fault points and time penalties per round."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Scoring" }, { label: "Show Jumping" }]}
      />
      <Card>
        <CardHeader title="Record round" />
        <CardBody>
          {data.length === 0 ? (
            <div className="text-sm text-ink-500">No Show Jumping events available.</div>
          ) : (
            <SJForm events={data} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
