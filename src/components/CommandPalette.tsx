"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: string;
}

const COMMANDS: CommandItem[] = [
  { id: "dashboard", label: "Go to Dashboard", group: "Navigate", href: "/" },
  { id: "tournaments", label: "Go to Tournaments", group: "Navigate", href: "/tournaments" },
  { id: "events", label: "Go to Events", group: "Navigate", href: "/events" },
  { id: "schedule", label: "Go to Schedule", group: "Navigate", href: "/schedule" },
  { id: "entries", label: "Go to Entries", group: "Navigate", href: "/entries" },
  { id: "leaderboard", label: "Go to Leaderboards", group: "Navigate", href: "/leaderboard" },
  { id: "riders", label: "Go to Riders", group: "Navigate", href: "/riders" },
  { id: "horses", label: "Go to Horses", group: "Navigate", href: "/horses" },
  { id: "officials", label: "Go to Officials", group: "Navigate", href: "/officials" },
  { id: "accred", label: "Go to Accreditation", group: "Navigate", href: "/accreditation" },
  { id: "stabling", label: "Open Stabling map", group: "Operations", href: "/stabling" },
  { id: "vet", label: "Veterinary inspections", group: "Operations", href: "/veterinary" },
  { id: "bio", label: "Biosecurity alerts", group: "Operations", href: "/biosecurity" },
  { id: "fin", label: "Financials", group: "Operations", href: "/financials" },
  { id: "notices", label: "Notice board", group: "Operations", href: "/notices" },
  { id: "score-tp", label: "Score Tent Pegging", group: "Scoring", href: "/scoring/tent-pegging" },
  { id: "score-dr", label: "Score Dressage", group: "Scoring", href: "/scoring/dressage" },
  { id: "score-sj", label: "Score Show Jumping", group: "Scoring", href: "/scoring/show-jumping" },
  { id: "score-ev", label: "Score Eventing", group: "Scoring", href: "/scoring/eventing" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setHighlight(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return COMMANDS;
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(ql) || c.group.toLowerCase().includes(ql));
  }, [q]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach((c) => { (groups[c.group] ??= []).push(c); });
    return groups;
  }, [filtered]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(filtered.length - 1, h + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)); }
    if (e.key === "Enter") {
      const sel = filtered[highlight];
      if (sel) { router.push(sel.href); onClose(); }
    }
  }

  if (!open) return null;
  let i = 0;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-start pt-24 px-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-ink-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-ink-200 flex items-center gap-3">
          <span className="text-ink-400">⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setHighlight(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, riders, events, horses…"
            className="w-full text-sm bg-transparent outline-none placeholder:text-ink-400"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-ink-50 border border-ink-200 numeric">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-ink-500">No matches</div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2">
                <div className="px-4 py-1 text-[10px] font-semibold text-ink-500 uppercase tracking-wider">{group}</div>
                {items.map((cmd) => {
                  const idx = i++;
                  const isHl = idx === highlight;
                  return (
                    <button
                      key={cmd.id}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => { router.push(cmd.href); onClose(); }}
                      className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm ${isHl ? "bg-brand-50 text-brand-700" : ""}`}
                    >
                      <span>{cmd.label}</span>
                      {cmd.hint && <span className="text-xs text-ink-500">{cmd.hint}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
