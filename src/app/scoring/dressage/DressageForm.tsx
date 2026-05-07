"use client";

import { useState, useTransition } from "react";
import { Button, Input, Select, Field, Pill, Badge } from "@/components/ui";
import { recordDressageAction } from "./actions";

interface MovementSpec { no: number; coef: 1 | 2; description?: string; }
interface JudgeMarks { name: string; marks: Record<number, string>; } // movementNo → string

const DEFAULT_MOVEMENT_SHEET: MovementSpec[] = [
  { no: 1, coef: 1, description: "Enter at A" },
  { no: 2, coef: 1, description: "Working trot" },
  { no: 3, coef: 2, description: "Half-pass left" },
  { no: 4, coef: 1, description: "Working canter" },
  { no: 5, coef: 2, description: "Halt at G" },
  { no: 6, coef: 1, description: "Free walk" },
  { no: 7, coef: 2, description: "Final salute · Collective" },
];

export function DressageForm({
  events,
}: {
  events: Array<{ id: string; code: string; name: string; entries: Array<{ id: string; rider: string }> }>;
}) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const event = events.find((e) => e.id === eventId);
  const [entryId, setEntryId] = useState(event?.entries[0]?.id ?? "");

  const [movements] = useState<MovementSpec[]>(DEFAULT_MOVEMENT_SHEET);
  const [judges, setJudges] = useState<JudgeMarks[]>([
    { name: "Judge C", marks: {} },
    { name: "Judge E", marks: {} },
    { name: "Judge H", marks: {} },
  ]);
  const [errorsOfCourse, setErrorsOfCourse] = useState("0");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [perJudge, setPerJudge] = useState<Array<{ name: string; percent: number; eliminated: boolean }>>([]);
  const [pending, startTransition] = useTransition();

  function changeEvent(id: string) {
    setEventId(id);
    setEntryId(events.find((e) => e.id === id)?.entries[0]?.id ?? "");
    setFeedback(null);
    setPerJudge([]);
  }

  function setMark(judgeIdx: number, movementNo: number, value: string) {
    setJudges((js) => js.map((j, i) => i === judgeIdx ? { ...j, marks: { ...j.marks, [movementNo]: value } } : j));
  }
  function setJudgeName(judgeIdx: number, name: string) {
    setJudges((js) => js.map((j, i) => i === judgeIdx ? { ...j, name } : j));
  }
  function addJudge() {
    setJudges([...judges, { name: `Judge ${String.fromCharCode(67 + judges.length)}`, marks: {} }]);
  }
  function removeJudge(idx: number) {
    if (judges.length <= 1) return;
    setJudges(judges.filter((_, i) => i !== idx));
  }

  function judgeTotal(j: JudgeMarks): { total: number; max: number; pct: number } {
    let total = 0;
    let max = 0;
    for (const m of movements) {
      const raw = Number(j.marks[m.no] ?? 0);
      total += raw * m.coef;
      max += 10 * m.coef;
    }
    return { total, max, pct: max ? (total / max) * 100 : 0 };
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("judgeCount", String(judges.length));
    judges.forEach((j, ji) => {
      fd.set(`judges[${ji}].name`, j.name);
      movements.forEach((m, mi) => {
        fd.set(`judges[${ji}].movements[${mi}].movementNo`, String(m.no));
        fd.set(`judges[${ji}].movements[${mi}].coefficient`, String(m.coef));
        fd.set(`judges[${ji}].movements[${mi}].mark`, j.marks[m.no] ?? "0");
      });
    });
    startTransition(async () => {
      const r = await recordDressageAction(fd);
      if (!("ok" in r) || !r.ok) {
        setFeedback(`Error: ${typeof (r as { error?: string }).error === "string" ? (r as { error: string }).error : "validation"}`);
      } else {
        setFeedback(`✓ Saved · average ${r.averagePercent?.toFixed(2)}%`);
        if (r.perJudge) setPerJudge(r.perJudge);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
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

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-ink-600">Judges ({judges.length}) — {judges.length >= 3 ? <span className="text-success">NEC quorum met</span> : <span className="text-amber-600">Below 3-judge minimum</span>}</div>
          <Button type="button" size="sm" variant="secondary" onClick={addJudge}>+ Judge</Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-ink-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50/40 border-b border-ink-200 text-left">
                <th className="px-3 py-2 w-14 text-xs font-medium uppercase tracking-wide text-ink-500">#</th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-ink-500">Movement</th>
                <th className="px-3 py-2 w-14 text-xs font-medium uppercase tracking-wide text-ink-500">×</th>
                {judges.map((j, idx) => (
                  <th key={idx} className="px-3 py-2 w-32">
                    <div className="flex items-center justify-between gap-1">
                      <Input value={j.name} onChange={(e) => setJudgeName(idx, e.target.value)} className="text-xs px-2 py-1" />
                      {judges.length > 1 && <button type="button" onClick={() => removeJudge(idx)} className="text-xs text-ink-400 hover:text-danger">×</button>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.no} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{m.no}</td>
                  <td className="px-3 py-2 text-ink-700">{m.description ?? "—"}</td>
                  <td className="px-3 py-2 numeric text-ink-500">×{m.coef}</td>
                  {judges.map((j, idx) => (
                    <td key={idx} className="px-3 py-1">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        value={j.marks[m.no] ?? ""}
                        onChange={(e) => setMark(idx, m.no, e.target.value)}
                        placeholder="0–10"
                        className="text-center"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-ink-50/40 font-medium">
                <td className="px-3 py-2" colSpan={3}>Subtotal</td>
                {judges.map((j, idx) => {
                  const t = judgeTotal(j);
                  return (
                    <td key={idx} className="px-3 py-2 numeric text-center">
                      {t.total.toFixed(1)}/{t.max} · {t.pct.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Errors of course (avg across judges)">
          <Select name="errorsOfCourse" value={errorsOfCourse} onChange={(e) => setErrorsOfCourse(e.target.value)}>
            <option value="0">0</option>
            <option value="1">1 (−2%)</option>
            <option value="2">2 (Elimination)</option>
          </Select>
        </Field>
      </div>

      {perJudge.length > 0 && (
        <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
          <div className="text-xs font-medium text-ink-600 mb-2">Per-judge result</div>
          <div className="flex flex-wrap gap-2">
            {perJudge.map((p, i) => (
              <Badge key={i} tone={p.eliminated ? "danger" : "brand"}>
                {p.name}: {p.eliminated ? "ELIM" : `${p.percent.toFixed(2)}%`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm">
          {feedback ? <Pill tone={feedback.startsWith("✓") ? "success" : "danger"}>{feedback}</Pill> : <span className="text-ink-500">Final % is the average of all judges' percentages.</span>}
        </div>
        <Button disabled={pending}>{pending ? "Saving…" : "Submit panel scores"}</Button>
      </div>
    </form>
  );
}
