"use client";

import { useState, useTransition } from "react";
import { Button, Input, Select, Label, Badge } from "@/components/ui";
import { recordRunAction } from "./actions";

type TargetRow = { type: "Peg" | "Ring" | "Lemon"; result: string };

const PEG_RESULTS = ["Carry", "Draw", "Strike", "Miss"] as const;
const RING_RESULTS = ["Hit", "Miss"] as const;
const LEMON_RESULTS = ["Slice", "Miss"] as const;

export function ScoringForm({
  events,
  defaultEventId,
}: {
  events: Array<{
    id: string;
    code: string;
    name: string;
    timeAllowedMs: number | null;
    entries: Array<{ id: string; startNumber: number | null; rider: string; horse: string | null }>;
  }>;
  defaultEventId?: string;
}) {
  const [eventId, setEventId] = useState(defaultEventId ?? events[0]?.id ?? "");
  const event = events.find((e) => e.id === eventId);
  const [entryId, setEntryId] = useState(event?.entries[0]?.id ?? "");
  const [pegSizeCm, setPegSizeCm] = useState<"6" | "4" | "2.5">("6");
  const [recordedTimeMs, setRecordedTimeMs] = useState<string>("");
  const [targets, setTargets] = useState<TargetRow[]>([{ type: "Peg", result: "Carry" }]);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function changeEvent(id: string) {
    setEventId(id);
    const ev = events.find((e) => e.id === id);
    setEntryId(ev?.entries[0]?.id ?? "");
    // Default targets shape per event
    if (ev?.code === "TP-RPL") setTargets([{ type: "Ring", result: "Hit" }, { type: "Ring", result: "Hit" }, { type: "Peg", result: "Carry" }]);
    else if (ev?.code === "TP-LPS") setTargets([{ type: "Lemon", result: "Slice" }, { type: "Lemon", result: "Slice" }, { type: "Peg", result: "Carry" }]);
    else setTargets([{ type: "Peg", result: "Carry" }]);
  }

  function addTarget() { setTargets([...targets, { type: "Peg", result: "Miss" }]); }
  function removeTarget(i: number) { setTargets(targets.filter((_, j) => j !== i)); }
  function updateTarget(i: number, patch: Partial<TargetRow>) {
    setTargets(targets.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  }

  function resultsFor(type: TargetRow["type"]): readonly string[] {
    if (type === "Peg") return PEG_RESULTS;
    if (type === "Ring") return RING_RESULTS;
    return LEMON_RESULTS;
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    targets.forEach((t, i) => {
      fd.set(`targets[${i}].type`, t.type);
      fd.set(`targets[${i}].result`, t.result);
    });
    startTransition(async () => {
      const res = await recordRunAction(fd);
      if (!("ok" in res) || !res.ok) {
        setResult(`Error: ${typeof res.error === "string" ? res.error : "Validation failed"}`);
      } else if (res.ok && res.computed) {
        setResult(
          `✓ Saved · raw ${res.computed.rawTargetPoints} · time penalty ${res.computed.timePenalty} · net ${res.computed.netPoints}${
            res.computed.eliminated ? " · ELIMINATED" : ""
          }`
        );
        // Clear time + targets but keep event/entry selection.
        setRecordedTimeMs("");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="entryId" value={entryId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Event</Label>
          <Select value={eventId} onChange={(e) => changeEvent(e.target.value)}>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.code} — {e.name}</option>
            ))}
          </Select>
          {event && (
            <div className="text-xs text-ink-500 mt-1 numeric">
              Time allowed: {event.timeAllowedMs ? (event.timeAllowedMs / 1000).toFixed(2) + "s" : "—"}
            </div>
          )}
        </div>
        <div>
          <Label>Entry (rider · horse)</Label>
          <Select value={entryId} onChange={(e) => setEntryId(e.target.value)}>
            {event?.entries.map((en) => (
              <option key={en.id} value={en.id}>
                #{en.startNumber ?? "—"} · {en.rider}{en.horse ? ` · ${en.horse}` : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label>Round</Label>
          <Select name="roundNo" defaultValue="1">
            <option value="1">Round 1</option>
            <option value="2">Round 2</option>
          </Select>
        </div>
        <div>
          <Label>Run #</Label>
          <Select name="runNo" defaultValue="1">
            <option value="1">Run 1</option>
            <option value="2">Run 2</option>
            <option value="3">Run 3</option>
          </Select>
        </div>
        <div>
          <Label>Peg size</Label>
          <Select name="pegSizeCm" value={pegSizeCm} onChange={(e) => setPegSizeCm(e.target.value as "6" | "4" | "2.5")}>
            <option value="6">6 cm</option>
            <option value="4">4 cm</option>
            <option value="2.5">2.5 cm (tie-break)</option>
          </Select>
        </div>
        <div>
          <Label>Recorded time (ms)</Label>
          <Input
            name="recordedTimeMs"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="e.g. 6420"
            value={recordedTimeMs}
            onChange={(e) => setRecordedTimeMs(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Targets</Label>
          <Button type="button" size="sm" variant="secondary" onClick={addTarget}>+ Add target</Button>
        </div>
        <div className="space-y-2">
          {targets.map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Select value={t.type} onChange={(e) => {
                const newType = e.target.value as TargetRow["type"];
                const opts = newType === "Peg" ? PEG_RESULTS : newType === "Ring" ? RING_RESULTS : LEMON_RESULTS;
                updateTarget(i, { type: newType, result: opts[0] });
              }} className="w-32">
                <option value="Peg">Peg</option>
                <option value="Ring">Ring</option>
                <option value="Lemon">Lemon</option>
              </Select>
              <Select value={t.result} onChange={(e) => updateTarget(i, { result: e.target.value })} className="w-40">
                {resultsFor(t.type).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
              <Badge tone={t.result === "Miss" ? "neutral" : "success"}>
                {t.type === "Peg"
                  ? t.result === "Carry" ? "+6" : t.result === "Draw" ? "+4" : t.result === "Strike" ? "+2" : "0"
                  : t.type === "Ring"
                  ? t.result === "Hit" ? "+6" : "0"
                  : t.result === "Slice" ? "+6" : "0"}
              </Badge>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeTarget(i)}>Remove</Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isTieBreak" /> Tie-break</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="weaponDropped" /> Weapon dropped</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="riderFell" /> Rider fell</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="horseFell" /> Horse fell</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="carriedWrongPeg" /> Wrong peg (Indian File)</label>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-ink-600">
          {result ?? "Pure-function preview will appear here on save."}
        </div>
        <Button disabled={pending}>{pending ? "Saving…" : "Record run"}</Button>
      </div>
    </form>
  );
}
