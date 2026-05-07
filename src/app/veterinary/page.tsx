import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, Pill, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const RESULT_TONES: Record<string, "success" | "warn" | "danger" | "neutral"> = {
  Pass: "success",
  Represent: "warn",
  Fail: "danger",
  Eliminated: "danger",
  Withdrawn: "neutral",
};

export default async function VeterinaryPage() {
  const [inspections, vetDocs] = await Promise.all([
    prisma.vetInspection.findMany({
      orderBy: { inspectedAt: "desc" },
      take: 30,
      include: { horse: true, event: true },
    }),
    prisma.vetDocument.findMany({ orderBy: { issuedOn: "desc" }, include: { horse: true } }),
  ]);

  const verifiedCount = vetDocs.filter((d) => d.verifiedAt).length;
  const expiringCount = vetDocs.filter((d) => d.expiresOn && d.expiresOn.getTime() < Date.now() + 30 * 24 * 3600_000).length;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Veterinary"
        description="Trot-ups, vet gates, and health document verification."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Veterinary" }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Inspections" subtitle={`${inspections.length} recent`} />
          <CardBody className="p-0">
            {inspections.length === 0 ? (
              <EmptyState title="No inspections yet" hint="Trot-ups and vet gates will appear here as they're recorded." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">When</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Horse</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Phase</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">HR</th>
                    <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((i) => (
                    <tr key={i.id} className="border-b border-ink-100 last:border-b-0">
                      <td className="px-5 py-3 numeric text-xs text-ink-500">{i.inspectedAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                      <td className="px-5 py-3 font-medium">{i.horse.registeredName}</td>
                      <td className="px-5 py-3">{i.phase}</td>
                      <td className="px-5 py-3 numeric">{i.heartRateBpm ?? "—"}{i.heartRateBpm ? " bpm" : ""}</td>
                      <td className="px-5 py-3"><Pill tone={RESULT_TONES[i.result] ?? "neutral"}>{i.result}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Health documents" subtitle={`${verifiedCount} verified · ${expiringCount} expiring soon`} />
          <CardBody>
            {vetDocs.length === 0 ? (
              <EmptyState title="No documents on file" hint="Coggins, EI vaccination, and health certs are required before access." />
            ) : (
              <ul className="text-sm space-y-2">
                {vetDocs.slice(0, 8).map((d) => (
                  <li key={d.id} className="flex justify-between">
                    <span>
                      <span className="font-medium">{d.horse.registeredName}</span>
                      <span className="text-ink-500"> · {d.type}</span>
                    </span>
                    {d.verifiedAt ? <Badge tone="success">Verified</Badge> : <Badge tone="warn">Pending</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
