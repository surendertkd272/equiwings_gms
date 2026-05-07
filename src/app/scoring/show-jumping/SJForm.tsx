"use client";

import { useState, useTransition } from "react";
import { Button, Input, Select, Field, Pill } from "@/components/ui";
import { recordSJRoundAction } from "./actions";

export function SJForm({
  events,
}: {
  events: Array<{ id: string; code: string; name: string; entries: Array<{ id: string; rider: string }>; speedMpm: number | null }>;
}) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const event = events.find((e) => e.id === eventId);
  const [entryId, setEntryId] = useState(event?.entries[0]?.id ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeEvent(id: string) {
    setEventId(id);
    setEntryId(events.find((e) => e.id === id)?.entries[0]?.id ?? "");
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await recordSJRoundAction(fd);
      if (!r.ok) setFeedback(`Error: ${typeof r.error === "string" ? r.error : "validation"}`);
      else if (r.computed) {
        const c = r.computed;
        setFeedback(`✓ Saved · faults ${c.faultPoints} · time ${c.timeFault} · total ${c.eliminated ? "ELIM" : c.total}`);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="entryId" value={entryId} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Event">
          <Select value={eventId} onChange={(e) => changeEvent(e.target.value)}>
            {events.map((e) => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
          </Select>
        </Field>
        <Field label="Rider">
          <Select value={entryId} onChange={(e) => setEntryId(e.target.value)}>
            {event?.entries.map((en) => <option key={en.id} value={en.id}>{en.rider}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Optimum time (s)">
          <Input name="optimumTimeSec" type="number" min={0} step="0.1" defaultValue="80" required />
        </Field>
        <Field label="Recorded time (s)">
          <Input name="recordedTimeSec" type="number" min={0} step="0.1" required />
        </Field>
        <Field label="Rails knocked">
          <Input name="rails" type="number" min={0} defaultValue="0" />
        </Field>
        <Field label="Refusals">
          <Select name="refusals" defaultValue="0">
            <option value="0">0</option>
            <option value="1">1 (4 faults)</option>
            <option value="2">2 (Elimination)</option>
          </Select>
        </Field>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="fallRider" /> Fall of rider (Elim)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="fallHorse" /> Fall of horse (Elim)</label>
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="text-sm text-ink-600">
          {feedback ? <Pill tone={feedback.startsWith("✓") ? "success" : "danger"}>{feedback}</Pill> : <span className="text-ink-500">Rail = 4 · 1st refusal = 4 · time over = 1/sec</span>}
        </div>
        <Button disabled={pending}>{pending ? "Saving…" : "Save round"}</Button>
      </div>
    </form>
  );
}
