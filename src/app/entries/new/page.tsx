export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Button, Field, Input, Select, LinkButton, Pill } from "@/components/ui";
import { createEntryAction } from "./actions";

export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ eventId?: string; riderId?: string; errors?: string }> }) {
  const sp = await searchParams;
  const [events, riders, horses] = await Promise.all([
    prisma.event.findMany({ orderBy: { code: "asc" }, include: { tournament: true } }),
    prisma.rider.findMany({ orderBy: { lastName: "asc" } }),
    prisma.horse.findMany({ orderBy: { registeredName: "asc" } }),
  ]);
  const errors = sp.errors ? decodeURIComponent(sp.errors).split("|") : [];

  return (
    <div className="space-y-6">
      <PageTitle
        title="New entry"
        description="Submit a rider–horse combination to an event. The system validates EFI ID renewal, age limits, height (TP), and HC restrictions."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { href: "/entries", label: "Entries" }, { label: "New" }]}
      />
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <div className="text-sm font-semibold text-red-700 mb-1">Entry rejected</div>
            <ul className="text-sm text-red-700 list-disc pl-5 space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </CardBody>
        </Card>
      )}
      <Card className="max-w-3xl">
        <CardHeader title="Entry details" subtitle="Each rider–horse–event combination must be unique." />
        <form action={createEntryAction}>
          <CardBody className="space-y-4">
            <Field label="Event">
              <Select name="eventId" required defaultValue={sp.eventId ?? events[0]?.id ?? ""}>
                {events.length === 0 && <option value="">No events yet</option>}
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.tournament.shortCode} · {e.code} — {e.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Rider">
                <Select name="riderId" required defaultValue={sp.riderId ?? riders[0]?.id ?? ""}>
                  {riders.length === 0 && <option value="">No riders yet</option>}
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>{r.firstName} {r.lastName} · {r.efiId}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Horse">
                <Select name="horseId" defaultValue="">
                  <option value="">— (no horse selected)</option>
                  {horses.map((h) => (
                    <option key={h.id} value={h.id}>{h.registeredName} · {h.sex}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Start number" hint="Leave blank to auto-assign next">
                <Input name="startNumber" type="number" min={1} placeholder="auto" />
              </Field>
              <Field label="Entry fee (paise)">
                <Input name="feeMinor" type="number" min={0} defaultValue={250000} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isHC" /> Hors Concours (non-competitive)
              <Pill tone="muted">Not allowed at JNEC</Pill>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <LinkButton href="/entries" variant="ghost">Cancel</LinkButton>
              <Button>Create entry</Button>
            </div>
          </CardBody>
        </form>
      </Card>
    </div>
  );
}
