"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Card, CardBody, Button, Badge } from "@/components/ui";
import { AssignForm } from "./AssignForm";
import { releaseStallAction } from "./actions";

interface StallView {
  id: string;
  block: string;
  stallNumber: string;
  isStallion: boolean;
  isQuarantine: boolean;
  isTack: boolean;
  isFeed: boolean;
  current?: {
    assignmentId: string;
    horseId: string;
    horseName: string;
    horseSex: string;
    groomName: string | null;
  } | null;
}

export function StallGrid({
  stallsByBlock,
  horses,
}: {
  stallsByBlock: Record<string, StallView[]>;
  horses: Array<{ id: string; registeredName: string; sex: string }>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function release(assignmentId: string) {
    const fd = new FormData();
    fd.set("assignmentId", assignmentId);
    startTransition(async () => { await releaseStallAction(fd); });
  }

  return (
    <div className="space-y-6">
      {Object.entries(stallsByBlock).map(([block, stalls]) => (
        <Card key={block}>
          <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
            <div>
              <div className="font-semibold tracking-tight">{block}</div>
              <div className="text-xs text-ink-500">
                {stalls.filter((s) => s.current).length} occupied · {stalls.filter((s) => !s.current).length} open
              </div>
            </div>
            <div className="flex gap-1.5">
              {stalls.some((s) => s.isStallion) && <Badge tone="warn">Stallion block</Badge>}
            </div>
          </div>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {stalls.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "aspect-square rounded-lg border-2 transition-all relative p-2 flex flex-col items-center justify-center text-center",
                    s.current
                      ? "bg-brand-50 border-brand-200 hover:border-brand-400"
                      : "bg-white border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/40",
                    s.isStallion && !s.current && "border-amber-300 bg-amber-50/40"
                  )}
                >
                  <div className="text-[10px] text-ink-500 font-mono">{s.stallNumber}</div>
                  {s.current ? (
                    <>
                      <div className="text-xs font-semibold mt-1 leading-tight">{s.current.horseName}</div>
                      <div className="text-[10px] text-ink-500 mt-0.5">{s.current.horseSex}</div>
                      {s.current.groomName && <div className="text-[10px] text-ink-400 mt-0.5">{s.current.groomName}</div>}
                    </>
                  ) : (
                    <div className="text-xs text-ink-400 mt-2">+ Assign</div>
                  )}
                  {s.isStallion && (
                    <div className="absolute top-1 right-1 text-[9px] px-1 py-px rounded bg-amber-100 text-amber-700">S</div>
                  )}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}

      {selected && (() => {
        const s = Object.values(stallsByBlock).flat().find((x) => x.id === selected);
        if (!s) return null;
        const usableHorses = s.isStallion ? horses.filter((h) => h.sex === "Stallion") : horses.filter((h) => h.sex !== "Stallion");
        return (
          <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
            <Card className="w-full max-w-md" >
              <div onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-ink-200">
                  <div className="font-semibold">{s.block} · {s.stallNumber}</div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {s.isStallion ? "Stallion-only block" : "Regular block"}
                    {s.isQuarantine && " · Quarantine"}
                  </div>
                </div>
                <CardBody className="space-y-4">
                  {s.current ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-ink-500">Currently assigned</div>
                        <div className="font-semibold">{s.current.horseName}</div>
                        <div className="text-xs text-ink-500">{s.current.horseSex}{s.current.groomName ? ` · groom: ${s.current.groomName}` : ""}</div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Close</Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={pending}
                          onClick={() => { release(s.current!.assignmentId); setSelected(null); }}
                        >
                          Release stall
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <AssignForm stallId={s.id} horses={usableHorses} onClose={() => setSelected(null)} />
                  )}
                </CardBody>
              </div>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
