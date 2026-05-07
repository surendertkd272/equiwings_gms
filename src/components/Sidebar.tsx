"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: "▣" },
      { href: "/notices", label: "Notice board", icon: "▤" },
    ],
  },
  {
    title: "Competition",
    items: [
      { href: "/tournaments", label: "Tournaments", icon: "◆" },
      { href: "/events", label: "Events", icon: "◇" },
      { href: "/entries", label: "Entries", icon: "◊" },
      { href: "/schedule", label: "Schedule", icon: "▦" },
      { href: "/leaderboard", label: "Leaderboards", icon: "▲" },
    ],
  },
  {
    title: "People & horses",
    items: [
      { href: "/riders", label: "Riders", icon: "◉" },
      { href: "/horses", label: "Horses", icon: "◎" },
      { href: "/officials", label: "Officials", icon: "◈" },
      { href: "/accreditation", label: "Accreditation", icon: "◐" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/stabling", label: "Stabling map", icon: "▥" },
      { href: "/veterinary", label: "Veterinary", icon: "+" },
      { href: "/biosecurity", label: "Biosecurity", icon: "!" },
      { href: "/financials", label: "Financials", icon: "₹" },
    ],
  },
  {
    title: "Scoring",
    items: [
      { href: "/scoring/tent-pegging", label: "Tent Pegging", icon: "→" },
      { href: "/scoring/dressage", label: "Dressage", icon: "→" },
      { href: "/scoring/show-jumping", label: "Show Jumping", icon: "→" },
      { href: "/scoring/eventing", label: "Eventing", icon: "→" },
    ],
  },
];

export function Sidebar({ onCommandOpen }: { onCommandOpen: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 hidden lg:flex flex-col border-r border-ink-200 bg-white sticky top-0 h-screen">
      <div className="px-4 py-4 border-b border-ink-200">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white grid place-items-center font-bold text-sm">EW</div>
          <div>
            <div className="font-semibold text-sm tracking-tight">Equiwings GMS</div>
            <div className="text-[10px] text-ink-500 uppercase tracking-wider">National Tournament</div>
          </div>
        </Link>
      </div>
      <button
        onClick={onCommandOpen}
        className="mx-3 mt-3 px-3 py-2 rounded-md border border-ink-200 bg-ink-50 hover:bg-ink-100 text-xs text-ink-500 flex items-center justify-between transition-colors"
      >
        <span className="flex items-center gap-2"><span>⌕</span><span>Quick search…</span></span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-ink-200 numeric">⌘K</kbd>
      </button>
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-2 mb-1.5 text-[10px] font-semibold text-ink-500 uppercase tracking-wider">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm",
                      active
                        ? "bg-brand-50 text-brand-700 font-medium"
                        : "text-ink-700 hover:bg-ink-100"
                    )}
                  >
                    <span className={cn("w-4 text-center text-[14px]", active ? "text-brand-600" : "text-ink-400")}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-ink-200 text-[10px] text-ink-500 numeric">
        EFI Tech. Guidelines 2021 · ITPF 2019
      </div>
    </aside>
  );
}
