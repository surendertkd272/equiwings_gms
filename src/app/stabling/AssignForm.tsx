"use client";

import { useState, useTransition } from "react";
import { Button, Input, Select, Field } from "@/components/ui";
import { assignStallAction } from "./actions";

export function AssignForm({
  stallId,
  horses,
  onClose,
}: {
  stallId: string;
  horses: Array<{ id: string; registeredName: string; sex: string }>;
  onClose: () => void;
}) {
  const [horseId, setHorseId] = useState(horses[0]?.id ?? "");
  const [groomName, setGroomName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await assignStallAction(fd);
      if (!r.ok) setError(r.error ?? "Failed");
      else onClose();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input type="hidden" name="stallId" value={stallId} />
      <Field label="Horse">
        <Select name="horseId" value={horseId} onChange={(e) => setHorseId(e.target.value)}>
          {horses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.registeredName} ({h.sex})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Groom (optional)">
        <Input name="groomName" value={groomName} onChange={(e) => setGroomName(e.target.value)} />
      </Field>
      {error && <div className="text-xs text-danger">{error}</div>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" disabled={pending}>{pending ? "Assigning…" : "Assign"}</Button>
      </div>
    </form>
  );
}
