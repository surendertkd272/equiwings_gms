import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function OfficialsPage() {
  const officials = await prisma.official.findMany({ orderBy: [{ lastName: "asc" }] });

  return (
    <div>
      <PageTitle
        title="Officials"
        description="Ground jury, technical delegates, lane judges, vets, timers, and stewards."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Officials" }]}
        right={<LinkButton href="/officials/new" variant="primary">+ New official</LinkButton>}
      />
      <Card>
        <CardHeader title={`${officials.length} officials`} subtitle="No NEC jury member may be from the organising entity (Art. 423)" />
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-500 border-b border-ink-200">
                <th className="px-5 py-2 font-medium">EFI Panel</th>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Roles</th>
                <th className="px-5 py-2 font-medium">Disciplines</th>
                <th className="px-5 py-2 font-medium">Org. entity</th>
              </tr>
            </thead>
            <tbody>
              {officials.map((o) => (
                <tr key={o.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-5 py-3 font-mono text-xs">{o.efiPanelId ?? "—"}</td>
                  <td className="px-5 py-3 font-medium">{o.firstName} {o.lastName}</td>
                  <td className="px-5 py-3">
                    {o.roles.split(",").map((r) => <Badge key={r}>{r.trim()}</Badge>)}
                  </td>
                  <td className="px-5 py-3 text-ink-500">{o.disciplines}</td>
                  <td className="px-5 py-3 text-ink-500">{o.organisingEntity ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
