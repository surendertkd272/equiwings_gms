import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, PageTitle, Button, Field, Input, Select, Textarea, Pill } from "@/components/ui";
import { postNoticeAction } from "./actions";

export const dynamic = "force-dynamic";

const CATEGORY_TONES: Record<string, "neutral" | "brand" | "warn" | "danger" | "success"> = {
  Schedule: "brand",
  Weather: "warn",
  Vet: "danger",
  Track: "neutral",
  Result: "success",
  JuryDecision: "neutral",
};

export default async function NoticesPage() {
  const [notices, notifications, events] = await Promise.all([
    prisma.officialNotice.findMany({ orderBy: { postedAt: "desc" }, take: 30 }),
    prisma.notification.findMany({ orderBy: { sentAt: "desc" }, take: 12 }),
    prisma.event.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Notice board"
        description="Authoritative announcements during the event. Replaces the paper scoreboard."
        breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Notice board" }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {notices.length === 0 ? (
            <Card><CardBody className="text-sm text-ink-500">No notices yet.</CardBody></Card>
          ) : (
            notices.map((n) => (
              <Card key={n.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Pill tone={CATEGORY_TONES[n.category] ?? "neutral"}>{n.category}</Pill>
                        <span className="font-semibold tracking-tight">{n.title}</span>
                      </div>
                      <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap">{n.body}</p>
                    </div>
                    <div className="text-[11px] text-ink-500 numeric shrink-0">
                      {n.postedAt.toISOString().slice(0, 16).replace("T", " ")}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Post notice" />
            <form action={postNoticeAction}>
              <CardBody className="space-y-3">
                <Field label="Title">
                  <Input name="title" required placeholder="Course walk delayed by 30 min" />
                </Field>
                <Field label="Body">
                  <Textarea name="body" required rows={3} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category">
                    <Select name="category" defaultValue="Schedule">
                      <option>Schedule</option>
                      <option>Weather</option>
                      <option>Vet</option>
                      <option>Track</option>
                      <option>Result</option>
                      <option>JuryDecision</option>
                    </Select>
                  </Field>
                  <Field label="Event (optional)">
                    <Select name="eventId" defaultValue="">
                      <option value="">All</option>
                      {events.map((e) => (<option key={e.id} value={e.id}>{e.code}</option>))}
                    </Select>
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button>Post & broadcast</Button>
                </div>
              </CardBody>
            </form>
          </Card>

          <Card>
            <CardHeader title="Recent push" subtitle="Notifications log" />
            <CardBody className="text-xs space-y-2">
              {notifications.length === 0 ? (
                <div className="text-ink-500">No notifications yet.</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="border-l-2 border-brand-200 pl-2">
                    <div className="font-medium">{n.subject}</div>
                    <div className="text-ink-500 numeric">{n.channel} · {n.sentAt.toISOString().slice(11, 16)}</div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
