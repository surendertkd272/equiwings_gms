"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex">
      <Sidebar onCommandOpen={() => setCmdOpen(true)} />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-ink-200 lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="font-semibold text-sm">Equiwings GMS</div>
            <button onClick={() => setCmdOpen(true)} className="text-xs px-2 py-1 rounded bg-ink-100">⌕ Search</button>
          </div>
        </header>
        <main className="px-6 lg:px-10 py-8 max-w-[1500px] mx-auto">{children}</main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
