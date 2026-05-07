import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Badge, EmptyState, LinkButton } from "@/components/ui";
import { isHorseTallEnoughForTentPegging } from "@/lib/eligibility/age-rules";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatHands(handsX10: number) {
  return `${Math.floor(handsX10 / 10)}.${handsX10 % 10}hh`;
}

export default async function HorsesIndex() {
  const horses = await prisma.horse.findMany({
    orderBy: { registeredName: "asc" },
    include: {
      grades: true,
      owner: true,
      _count: { select: { entries: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageTitle
        title="Horses"
        description="Equine digital passports with grade and eligibility data."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Horses" }]}
        right={<LinkButton href="/horses/new" variant="primary">+ New horse</LinkButton>}
      />
      <Card>
        <CardHeader title={`${horses.length} horses`} subtitle="Tent Pegging requires min 14.2hh unshod and 5+ years old" />
        <CardBody className="p-0">
          {horses.length === 0 ? (
            <EmptyState title="No horses" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">EFI ID</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Name</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Sex</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">DOB</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Height</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Owner</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">Grades</th>
                  <th className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">TP</th>
                </tr>
              </thead>
              <tbody>
                {horses.map((h) => {
                  const tpOK = isHorseTallEnoughForTentPegging(h.heightHandsX10);
                  return (
                    <tr key={h.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/50">
                      <td className="px-5 py-3 font-mono text-xs">{h.efiHorseId}</td>
                      <td className="px-5 py-3 font-medium">
                        <Link href={`/horses/${h.id}`} className="hover:text-brand-600">{h.registeredName}</Link>
                      </td>
                      <td className="px-5 py-3">
                        {h.sex === "Stallion" ? <Badge tone="warn">Stallion</Badge> : <Badge>{h.sex}</Badge>}
                      </td>
                      <td className="px-5 py-3 numeric text-ink-500">{h.dateOfBirth.toISOString().slice(0, 10)}</td>
                      <td className="px-5 py-3 numeric">{formatHands(h.heightHandsX10)}</td>
                      <td className="px-5 py-3 text-ink-500">
                        {h.owner ? <Link href={`/riders/${h.owner.id}`} className="hover:text-brand-600">{h.owner.firstName} {h.owner.lastName}</Link> : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {h.grades.map((g) => (
                          <span key={g.id} className="inline-block mr-1 mb-1">
                            <Badge>{g.discipline}: {g.grade}</Badge>
                          </span>
                        ))}
                      </td>
                      <td className="px-5 py-3">
                        {tpOK ? <Badge tone="success">OK</Badge> : <Badge tone="danger">No</Badge>}
                      </td>
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
