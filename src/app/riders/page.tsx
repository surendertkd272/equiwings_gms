import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, EmptyState, LinkButton } from "@/components/ui";
import { efiIdValidFor } from "@/lib/eligibility/registration";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RidersIndex() {
  const riders = await prisma.rider.findMany({
    orderBy: [{ lastName: "asc" }],
    include: { _count: { select: { entries: true, ownedHorses: true } } },
  });
  const today = new Date();

  return (
    <div className="space-y-6">
      <PageTitle
        title="Riders"
        description="Registered athletes with EFI IDs and renewal status."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Riders" }]}
        right={<LinkButton href="/riders/new" variant="primary">+ New rider</LinkButton>}
      />
      <Card>
        <CardHeader title={`${riders.length} riders`} subtitle="EFI ID must be renewed before 01 Aug to compete next calendar year" />
        <CardBody className="p-0">
          {riders.length === 0 ? (
            <EmptyState title="No riders" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">EFI ID</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Name</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Category</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Unit / Club</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Renewal</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Horses</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Entries</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((r) => {
                  const valid = efiIdValidFor(today, r.efiIdRenewedAt);
                  return (
                    <tr key={r.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/50">
                      <td className="px-5 py-3 font-mono text-xs">{r.efiId}</td>
                      <td className="px-5 py-3 font-medium">
                        <Link href={`/riders/${r.id}`} className="hover:text-brand-600">
                          {r.firstName} {r.lastName}
                        </Link>
                        {r.isForeign && <Badge tone="warn">Foreign</Badge>}
                      </td>
                      <td className="px-5 py-3"><Badge>{r.category}</Badge></td>
                      <td className="px-5 py-3 text-ink-500">{r.unitOrClub ?? "—"}</td>
                      <td className="px-5 py-3 numeric">
                        {valid ? (
                          <Badge tone="success">Valid · {r.efiIdRenewedAt.toISOString().slice(0, 10)}</Badge>
                        ) : (
                          <Badge tone="danger">Expired · {r.efiIdRenewedAt.toISOString().slice(0, 10)}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 numeric">{r._count.ownedHorses}</td>
                      <td className="px-5 py-3 numeric">{r._count.entries}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
