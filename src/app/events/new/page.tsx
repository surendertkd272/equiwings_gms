export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Button, Field, Input, Select, LinkButton } from "@/components/ui";
import { createEventAction } from "./actions";

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ tournamentId?: string }> }) {
  const sp = await searchParams;
  const tournaments = await prisma.tournament.findMany({ orderBy: { startDate: "desc" } });
  return (
    <div className="space-y-6">
      <PageTitle
        title="New event"
        description="Add a competition class to a tournament."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { href: "/events", label: "Events" }, { label: "New" }]}
      />
      <Card className="max-w-3xl">
        <CardHeader title="Event details" />
        <form action={createEventAction}>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tournament">
                <Select name="tournamentId" required defaultValue={sp.tournamentId ?? tournaments[0]?.id ?? ""}>
                  {tournaments.length === 0 && <option value="">No tournaments — create one first</option>}
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.shortCode} — {t.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Code" hint="TP-ILN, D-PSG, SJ-GP, EV-NOV …">
                <Input name="code" required placeholder="TP-ISW" />
              </Field>
              <Field label="Name"><Input name="name" required placeholder="Tent Pegging — Sword (Individual)" /></Field>
              <Field label="Discipline">
                <Select name="discipline" defaultValue="TentPegging">
                  <option>TentPegging</option>
                  <option>Dressage</option>
                  <option>ShowJumping</option>
                  <option>Eventing</option>
                  <option>Endurance</option>
                </Select>
              </Field>
              <Field label="Grade (optional)">
                <Input name="grade" placeholder="GrandPrix · PrixStGeorges · GradeI · …" />
              </Field>
              <Field label="Arena / Track"><Input name="arenaOrTrack" placeholder="Arena 1 / Track A" /></Field>
              <Field label="Rounds">
                <Input name="rounds" type="number" min={1} max={4} defaultValue={1} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="isTeamEvent" /> Team event</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="isHCAllowed" /> HC entries allowed</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="isJunior" /> Junior / JNEC</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <LinkButton href="/events" variant="ghost">Cancel</LinkButton>
              <Button>Create event</Button>
            </div>
          </CardBody>
        </form>
      </Card>
    </div>
  );
}
