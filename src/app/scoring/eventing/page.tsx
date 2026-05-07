import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, EmptyState, LinkButton } from "@/components/ui";
import { EventingForm } from "./EventingForm";

export const dynamic = "force-dynamic";

export default async function EventingScoringPage() {
  const events = await prisma.event.findMany({
    where: { discipline: "Eventing" },
    include: { entries: { include: { rider: true, horse: true } } },
    orderBy: { code: "asc" },
  });
  const data = events.map((e) => ({
    id: e.id,
    code: e.code,
    name: e.name,
    entries: e.entries.map((en) => ({
      id: en.id,
      rider: `${en.rider.firstName} ${en.rider.lastName}`,
      horse: en.horse?.registeredName ?? null,
    })),
  }));

  return (
    <div className="space-y-6">
      <PageTitle
        title="Score · Eventing"
        description="Three-phase combined: Dressage % → CC refusals/falls/time → SJ rails/refusals. Each phase rolls into a combined penalty total."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Scoring" }, { label: "Eventing" }]}
      />
      <Card>
        <CardHeader title="Three-phase scoring" subtitle="Submit each phase as it finishes; the combined total recomputes." />
        <CardBody>
          {data.length === 0 ? (
            <EmptyState
              title="No Eventing events yet"
              hint="Create an Eventing event with at least one entry to begin scoring."
              action={<LinkButton href="/events/new" variant="primary">+ New event</LinkButton>}
            />
          ) : (
            <EventingForm events={data} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
