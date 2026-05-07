"use client";

import { useState, useTransition } from "react";
import { Button, Input, Select, Field, Pill, Stat } from "@/components/ui";
import {
  recordEventingDressagePhase,
  recordEventingCrossCountryPhase,
  recordEventingShowJumpingPhase,
} from "./actions";

type Phase = "Dressage" | "CrossCountry" | "ShowJumping";

export function EventingForm({
  events,
}: {
  events: Array<{ id: string; code: string; name: string; entries: Array<{ id: string; rider: string; horse: string | null }> }>;
}) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const event = events.find((e) => e.id === eventId);
  const [entryId, setEntryId] = useState(event?.entries[0]?.id ?? "");
  const [phase, setPhase] = useState<Phase>("Dressage");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeEvent(id: string) {
    setEventId(id);
    setEntryId(events.find((e) => e.id === id)?.entries[0]?.id ?? "");
    setFeedback(null);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("eventId", eventId);
    fd.set("entryId", entryId);
    startTransition(async () => {
      const action = phase === "Dressage" ? recordEventingDressagePhase : phase === "CrossCountry" ? recordEventingCrossCountryPhase : recordEventingShowJumpingPhase;
      const r = await action(fd);
      if (!r.ok) setFeedback(`Error`);
      else if ("dressagePenalty" in r) setFeedback(`✓ Dressage saved · ${r.dressagePenalty?.toFixed(2)} pen → combined total ${r.total === Number.POSITIVE_INFINITY ? "ELIM" : r.total?.toFixed(2)}`);
      else if ("ccPenalty" in r) setFeedback(`✓ Cross Country saved · ${r.ccPenalty} pen → combined total ${r.total === Number.POSITIVE_INFINITY ? "ELIM" : r.total?.toFixed(2)}`);
      else if ("sjPenalty" in r) setFeedback(`✓ Show Jumping saved · ${r.sjPenalty} pen → combined total ${r.total === Number.POSITIVE_INFINITY ? "ELIM" : r.total?.toFixed(2)}`);
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Event">
          <Select value={eventId} onChange={(e) => changeEvent(e.target.value)}>
            {events.length === 0 && <option value="">No Eventing events</option>}
            {events.map((e) => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
          </Select>
        </Field>
        <Field label="Combination">
          <Select value={entryId} onChange={(e) => setEntryId(e.target.value)}>
            {event?.entries.map((en) => <option key={en.id} value={en.id}>{en.rider}{en.horse ? ` · ${en.horse}` : ""}</option>)}
          </Select>
        </Field>
      </div>

      <div className="flex gap-2 border-b border-ink-200">
        {(["Dressage", "CrossCountry", "ShowJumping"] as Phase[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPhase(p)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${phase === p ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-700"}`}
          >
            {p === "CrossCountry" ? "Cross Country" : p === "ShowJumping" ? "Show Jumping" : "Dressage"}
          </button>
        ))}
      </div>

      <form key={phase} onSubmit={submit} className="space-y-4">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="entryId" value={entryId} />

        {phase === "Dressage" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dressage %" hint="Aggregate from the dressage scoresheet (avg of judges)">
              <Input name="percentage" type="number" min={0} max={100} step="0.01" required placeholder="68.50" />
            </Field>
            <Field label="Eliminated in Dressage">
              <label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" name="eliminated" /> Yes</label>
            </Field>
          </div>
        )}

        {phase === "CrossCountry" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Refusals (this run)">
              <Select name="refusals" defaultValue="0">
                <option value="0">0</option>
                <option value="1">1 (20)</option>
                <option value="2">2 (60)</option>
                <option value="3">3 (Elim)</option>
              </Select>
            </Field>
            <Field label="Falls of rider"><Input name="fallsRider" type="number" min={0} defaultValue={0} /></Field>
            <Field label="Falls of horse"><Input name="fallsHorse" type="number" min={0} defaultValue={0} /></Field>
            <Field label="Optimum time (s)"><Input name="optimumTimeSec" type="number" min={0} required defaultValue={360} /></Field>
            <Field label="Recorded time (s)"><Input name="recordedTimeSec" type="number" min={0} step="0.1" required /></Field>
            <Field label="Maximum time (s)"><Input name="maximumTimeSec" type="number" min={0} required defaultValue={720} /></Field>
            <label className="flex items-center gap-2 text-sm col-span-3">
              <input type="checkbox" name="isJunior" /> JNEC (penalises &gt;30s under optimum: +25)
            </label>
          </div>
        )}

        {phase === "ShowJumping" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Optimum time (s)"><Input name="optimumTimeSec" type="number" min={0} step="0.1" defaultValue={80} required /></Field>
            <Field label="Recorded time (s)"><Input name="recordedTimeSec" type="number" min={0} step="0.1" required /></Field>
            <Field label="Rails knocked"><Input name="rails" type="number" min={0} defaultValue={0} /></Field>
            <Field label="Refusals">
              <Select name="refusals" defaultValue="0">
                <option value="0">0</option>
                <option value="1">1 (4)</option>
                <option value="2">2 (Elim)</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" name="fallRider" /> Fall of rider (Elim)</label>
            <label className="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" name="fallHorse" /> Fall of horse (Elim)</label>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <div className="text-sm">
            {feedback ? <Pill tone={feedback.startsWith("✓") ? "success" : "danger"}>{feedback}</Pill> : <span className="text-ink-500">Submit each phase as it finishes — combined total recomputes after every phase.</span>}
          </div>
          <Button disabled={pending}>{pending ? "Saving…" : `Submit ${phase} phase`}</Button>
        </div>
      </form>
    </div>
  );
}

export function EventingProgress({ phases }: { phases: { dressagePct: number | null; ccPenalty: number | null; sjPenalty: number | null; total: number | null; eliminated: boolean } }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Stat label="Dressage %" value={phases.dressagePct ?? "—"} />
      <Stat label="CC penalty" value={phases.ccPenalty ?? "—"} />
      <Stat label="SJ penalty" value={phases.sjPenalty ?? "—"} />
      <Stat label="Combined" value={phases.eliminated ? "ELIM" : phases.total?.toFixed(2) ?? "—"} tone={phases.eliminated ? "danger" : "default"} />
    </div>
  );
}
