import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Stat, Badge, Button, Field, Select, EmptyState } from "@/components/ui";
import { formatCurrencyINR } from "@/lib/utils";
import { generateInvoiceAction, markPaidAction } from "./actions";
import { prizeMoneyMinor } from "@/lib/financials";

export const dynamic = "force-dynamic";

export default async function FinancialsPage() {
  const [invoices, riders, results] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { lineItems: true },
    }),
    prisma.rider.findMany({
      orderBy: { lastName: "asc" },
      include: { entries: { where: { paidAt: null } } },
    }),
    prisma.result.findMany({
      include: {
        entry: {
          include: { rider: true, event: true },
        },
      },
    }),
  ]);

  const ridersWithUnpaid = riders.filter((r) => r.entries.length > 0);

  const totalCollectedMinor = invoices
    .filter((i) => i.status === "Paid")
    .reduce((acc, i) => acc + i.totalMinor, 0);
  const totalPendingMinor = invoices
    .filter((i) => i.status === "Pending")
    .reduce((acc, i) => acc + i.totalMinor, 0);

  // Compute prize money per result (rank 1..6 only). For demo, rank by record order in DB.
  // Real ranking happens on leaderboard; here we just illustrate prize math by score.
  const prizes: Array<{ rider: string; event: string; placement: number; minor: number }> = [];
  const byEvent: Record<string, typeof results> = {};
  for (const r of results) {
    byEvent[r.entry.eventId] ??= [];
    byEvent[r.entry.eventId].push(r);
  }
  for (const evResults of Object.values(byEvent)) {
    const sorted = [...evResults].sort((a, b) => b.totalAfterPen - a.totalAfterPen);
    sorted.slice(0, 6).forEach((res, i) => {
      const placement = i + 1;
      const minor = prizeMoneyMinor(res.entry.event.grade ?? "Default", placement);
      if (minor > 0) {
        prizes.push({
          rider: `${res.entry.rider.firstName} ${res.entry.rider.lastName}`,
          event: res.entry.event.code,
          placement,
          minor,
        });
      }
    });
  }
  const totalPrizeMinor = prizes.reduce((acc, p) => acc + p.minor, 0);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Financials"
        description="Entry fees, invoices, prize money distribution."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Financials" }]}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Collected" value={formatCurrencyINR(totalCollectedMinor)} tone="success" />
        <Stat label="Pending" value={formatCurrencyINR(totalPendingMinor)} tone={totalPendingMinor > 0 ? "warn" : "default"} />
        <Stat label="Prize pool committed" value={formatCurrencyINR(totalPrizeMinor)} />
        <Stat label="Outstanding riders" value={ridersWithUnpaid.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Invoices" subtitle={`${invoices.length} total`} />
          <CardBody className="p-0">
            {invoices.length === 0 ? (
              <EmptyState title="No invoices yet" hint="Generate one from a rider with outstanding entries." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Created</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Rider</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Items</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Total</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Status</th>
                    <th className="px-5 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const rider = riders.find((r) => r.id === inv.riderId);
                    return (
                      <tr key={inv.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/50">
                        <td className="px-5 py-3 numeric text-ink-500">{inv.createdAt.toISOString().slice(0, 10)}</td>
                        <td className="px-5 py-3 font-medium">{rider ? `${rider.firstName} ${rider.lastName}` : "—"}</td>
                        <td className="px-5 py-3 numeric">{inv.lineItems.length}</td>
                        <td className="px-5 py-3 numeric font-medium">{formatCurrencyINR(inv.totalMinor)}</td>
                        <td className="px-5 py-3">
                          {inv.status === "Paid" ? <Badge tone="success">Paid</Badge> :
                            inv.status === "Pending" ? <Badge tone="warn">Pending</Badge> :
                            <Badge>{inv.status}</Badge>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {inv.status === "Pending" && (
                            <form action={markPaidAction}>
                              <input type="hidden" name="invoiceId" value={inv.id} />
                              <Button size="sm" variant="secondary">Mark paid</Button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Generate invoice" />
          <form action={generateInvoiceAction}>
            <CardBody className="space-y-3">
              <Field label="Rider" hint="Bundles all unpaid entries.">
                <Select name="riderId" defaultValue={ridersWithUnpaid[0]?.id ?? ""}>
                  {ridersWithUnpaid.length === 0 && <option value="">No outstanding</option>}
                  {ridersWithUnpaid.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.firstName} {r.lastName} ({r.entries.length} entr{r.entries.length === 1 ? "y" : "ies"})
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex justify-end">
                <Button disabled={ridersWithUnpaid.length === 0}>Generate</Button>
              </div>
            </CardBody>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader title="Prize money distribution" subtitle="Auto-computed from current results, top 6 placements per event" />
        <CardBody className="p-0">
          {prizes.length === 0 ? (
            <EmptyState title="No prize money yet" hint="Will populate as results are scored." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Event</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Placement</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Rider</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Prize</th>
                </tr>
              </thead>
              <tbody>
                {prizes.map((p, i) => (
                  <tr key={i} className="border-b border-ink-100 last:border-b-0">
                    <td className="px-5 py-3 font-mono text-xs">{p.event}</td>
                    <td className="px-5 py-3 numeric">#{p.placement}</td>
                    <td className="px-5 py-3 font-medium">{p.rider}</td>
                    <td className="px-5 py-3 numeric">{formatCurrencyINR(p.minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
