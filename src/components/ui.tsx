import { cn } from "@/lib/utils";
import Link from "next/link";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-white border border-ink-200 rounded-xl shadow-[0_1px_0_rgba(0,0,0,0.02)] overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-ink-200 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-semibold tracking-tight truncate">{title}</h3>
        {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 border border-brand-600 shadow-sm",
    secondary: "bg-white text-ink-900 hover:bg-ink-50 border border-ink-200",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-100 border border-transparent",
    danger: "bg-danger text-white hover:opacity-90 border border-danger",
  } as const;
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm" } as const;
  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  className,
  variant = "secondary",
  size = "md",
  children,
}: {
  href: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  children: React.ReactNode;
}) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 border border-brand-600 shadow-sm",
    secondary: "bg-white text-ink-900 hover:bg-ink-50 border border-ink-200",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-100 border border-transparent",
  } as const;
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm" } as const;
  return (
    <Link href={href} className={cn("inline-flex items-center justify-center rounded-md font-medium transition-colors", variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
        props.className
      )}
    />
  );
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("text-xs font-medium text-ink-600 mb-1 block", className)}>{children}</label>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger" | "brand" | "muted";
}) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700",
    success: "bg-green-100 text-green-700",
    warn: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    brand: "bg-brand-50 text-brand-700",
    muted: "bg-ink-50 text-ink-500",
  } as const;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "warn" | "danger" | "success";
}) {
  const tones = {
    default: "",
    warn: "ring-1 ring-amber-200 bg-amber-50",
    danger: "ring-1 ring-red-200 bg-red-50",
    success: "ring-1 ring-green-200 bg-green-50",
  } as const;
  return (
    <div className={cn("rounded-xl border border-ink-200 bg-white px-5 py-4", tone && tones[tone])}>
      <div className="text-xs text-ink-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1 numeric">{value}</div>
      {hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}
    </div>
  );
}

export function PageTitle({
  title,
  description,
  right,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  breadcrumbs?: Array<{ href?: string; label: string }>;
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-ink-500 mb-2">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {b.href ? (
                <Link href={b.href} className="hover:text-ink-900">{b.label}</Link>
              ) : (
                <span className="text-ink-700">{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span className="text-ink-300">/</span>}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-ink-500 mt-1">{description}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12 text-ink-500">
      <div className="text-3xl mb-3 text-ink-300">○</div>
      <div className="text-sm font-medium text-ink-700">{title}</div>
      {hint && <div className="text-xs mt-1 max-w-md mx-auto">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={cn("w-full text-sm", className)}>{children}</table>;
}

export function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="text-left text-ink-500 border-b border-ink-200 bg-ink-50/40">
        {cols.map((c) => (
          <th key={c} className="px-5 py-2.5 font-medium text-xs uppercase tracking-wide">{c}</th>
        ))}
      </tr>
    </thead>
  );
}

export function TR({ children, hover = true, className }: { children: React.ReactNode; hover?: boolean; className?: string }) {
  return (
    <tr className={cn("border-b border-ink-100 last:border-b-0", hover && "hover:bg-ink-50/50", className)}>
      {children}
    </tr>
  );
}

export function TD({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-5 py-3", className)}>{children}</td>;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <div className="text-[11px] text-ink-500 mt-1">{hint}</div>}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "brand" | "success" | "warn" | "danger" | "muted" }) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700 border-ink-200",
    brand: "bg-brand-50 text-brand-700 border-brand-100",
    success: "bg-green-50 text-green-700 border-green-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    muted: "bg-ink-50 text-ink-500 border-ink-100",
  } as const;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs border font-medium", tones[tone])}>
      {children}
    </span>
  );
}
