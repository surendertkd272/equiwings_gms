// Rider points award rules (Module 5 + Appendix E).

import { D_RIDER_POINTS } from "./dressage";
import { SJ_RIDER_POINTS } from "./show-jumping";
import { TP_RIDER_POINTS } from "./tent-pegging";

export type EventClass =
  | { discipline: "Dressage"; key: keyof typeof D_RIDER_POINTS }
  | { discipline: "ShowJumping"; key: keyof typeof SJ_RIDER_POINTS }
  | { discipline: "TentPegging"; key: keyof typeof TP_RIDER_POINTS };

export function pointsForPlacement(ev: EventClass, placement: number): number {
  if (placement < 1 || placement > 6) return 0;
  const idx = placement - 1;
  switch (ev.discipline) {
    case "Dressage": return D_RIDER_POINTS[ev.key]?.[idx] ?? 0;
    case "ShowJumping": return SJ_RIDER_POINTS[ev.key]?.[idx] ?? 0;
    case "TentPegging": return TP_RIDER_POINTS[ev.key]?.[idx] ?? 0;
  }
}

/**
 * EFI calendar: 01 Aug → 31 Jul. Points are valid until the next equivalent
 * event is held in the next calendar year, capped at 12 months from earning.
 */
export function pointsValidUntil(awardedAt: Date): Date {
  const cal = new Date(awardedAt);
  cal.setUTCFullYear(cal.getUTCFullYear() + 1);
  return cal;
}
