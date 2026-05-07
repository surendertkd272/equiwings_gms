import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, Button, Field, Select, Textarea, EmptyState } from "@/components/ui";
import { raiseAlertAction, clearAlertAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function BiosecurityPage() {
  const [alerts, horses] = await Promise.all([
    prisma.biosecurityAlert.findMany({ orderBy: { raisedAt: "desc" } }),
    prisma.horse.findMany({ orderBy: { registeredName: "asc" } }),
  ]);
  const horseById = new Map(horses.map((h) => [h.id, h]));
  const open = alerts.filter((a) => !a.resolvedAt);
  const closed = alerts.filter((a) => a.resolvedAt);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Biosecurity"
        description="Raise quarantine on a horse. The system locks affected stall blocks and notifies vet, PGJ, rider, and groom."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Biosecurity" }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Open alerts" subtitle={`${open.length} active`} />
            <CardBody className="p-0">
              {open.length === 0 ? (
                <EmptyState title="No open alerts" hint="The showgrounds is clear of quarantine flags." />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {open.map((a) => {
                    const horse = horseById.get(a.horseId);
                    return (
                      <li key={a.id} className="px-5 py-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{horse?.registeredName ?? "Unknown"}</span>
                            <Badge tone="danger">{a.status}</Badge>
                          </div>
                          <div className="text-sm text-ink-600 mt-1">{a.reason}</div>
                          <div className="text-[11px] text-ink-500 numeric mt-1">
                            Raised {a.raisedAt.toISOString().slice(0, 16).replace("T", " ")}
                          </div>
                        </div>
                        <form action={clearAlertAction}>
                          <input type="hidden" name="alertId" value={a.id} />
                          <Button size="sm" variant="secondary">Clear</Button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {closed.length > 0 && (
            <Card>
              <CardHeader title="Resolved" subtitle={`${closed.length} cleared`} />
              <CardBody className="p-0">
                <ul className="divide-y divide-ink-100 text-sm">
                  {closed.slice(0, 8).map((a) => {
                    const horse = horseById.get(a.horseId);
                    return (
                      <li key={a.id} className="px-5 py-3 flex justify-between text-ink-500">
                        <span>{horse?.registeredName ?? "—"} · {a.reason}</span>
                        <span className="numeric">{a.resolvedAt!.toISOString().slice(0, 10)}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Raise alert" />
          <form action={raiseAlertAction}>
            <CardBody className="space-y-4">
              <Field label="Horse">
                <Select name="horseId" defaultValue={horses[0]?.id ?? ""}>
                  {horses.map((h) => (
                    <option key={h.id} value={h.id}>{h.registeredName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Reason / suspected condition" hint="Will be sent to vet, PGJ, rider and groom.">
                <Textarea name="reason" required placeholder="e.g. Suspected equine influenza — elevated temp 39.4°C, nasal discharge" rows={4} />
              </Field>
              <div className="flex justify-end">
                <Button variant="danger">Raise quarantine</Button>
              </div>
            </CardBody>
          </form>
        </Card>
      </div>
    </div>
  );
}
