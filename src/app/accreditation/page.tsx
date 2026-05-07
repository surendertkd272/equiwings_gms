import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Button, Field, Select, Input, Badge, EmptyState } from "@/components/ui";
import { issueBadgeAction, revokeBadgeAction } from "./actions";
import { fingerprintSVG } from "@/lib/qr";

export const dynamic = "force-dynamic";

const ROLE_TONES: Record<string, "brand" | "warn" | "neutral" | "success" | "danger"> = {
  Rider: "brand",
  Official: "success",
  Trainer: "neutral",
  Groom: "neutral",
  Volunteer: "neutral",
  Media: "warn",
  VIP: "warn",
};

export default async function AccreditationPage() {
  const [badges, riders] = await Promise.all([
    prisma.badge.findMany({ orderBy: { issuedAt: "desc" }, include: { rider: true } }),
    prisma.rider.findMany({ orderBy: { lastName: "asc" } }),
  ]);
  const active = badges.filter((b) => !b.revokedAt);
  const revoked = badges.filter((b) => b.revokedAt);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Accreditation"
        description="Photo-ID badges with zone access. QR codes scanned at gates; revoked badges flagged in real time."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Accreditation" }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title="Active badges" subtitle={`${active.length} issued`} />
            <CardBody className="p-0">
              {active.length === 0 ? (
                <EmptyState title="No badges issued" hint="Issue one from the form on the right." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5">
                  {active.map((b) => (
                    <div key={b.id} className="flex items-center gap-4 rounded-lg border border-ink-200 bg-white p-3">
                      <div
                        className="w-20 h-20 rounded-md border border-ink-200 overflow-hidden grid place-items-center bg-white shrink-0"
                        dangerouslySetInnerHTML={{ __html: fingerprintSVG(b.qrCode, 80) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge tone={ROLE_TONES[b.role] ?? "neutral"}>{b.role}</Badge>
                        </div>
                        <div className="font-semibold mt-1 truncate">
                          {b.rider ? `${b.rider.firstName} ${b.rider.lastName}` : b.staffName ?? "—"}
                        </div>
                        <div className="text-[11px] text-ink-500 mt-0.5">
                          Zones: {b.zoneAccess.split(",").length} · ID {b.qrCode.slice(-8)}
                        </div>
                      </div>
                      <form action={revokeBadgeAction}>
                        <input type="hidden" name="badgeId" value={b.id} />
                        <Button size="sm" variant="ghost">Revoke</Button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {revoked.length > 0 && (
            <Card>
              <CardHeader title="Revoked" />
              <CardBody className="text-xs">
                <ul className="space-y-1 text-ink-500">
                  {revoked.slice(0, 8).map((b) => (
                    <li key={b.id}>
                      {b.rider ? `${b.rider.firstName} ${b.rider.lastName}` : b.staffName ?? "—"} · {b.role} · revoked {b.revokedAt?.toISOString().slice(0, 10)}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Issue badge" />
          <form action={issueBadgeAction}>
            <CardBody className="space-y-3">
              <Field label="Role">
                <Select name="role" defaultValue="Rider">
                  <option>Rider</option>
                  <option>Trainer</option>
                  <option>Groom</option>
                  <option>Official</option>
                  <option>Volunteer</option>
                  <option>Media</option>
                  <option>VIP</option>
                </Select>
              </Field>
              <Field label="Rider (if rider)">
                <Select name="riderId" defaultValue="">
                  <option value="">—</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Staff name (if not a rider)">
                <Input name="staffName" placeholder="Full name" />
              </Field>
              <div className="flex justify-end pt-2">
                <Button>Issue & generate QR</Button>
              </div>
            </CardBody>
          </form>
        </Card>
      </div>
    </div>
  );
}
