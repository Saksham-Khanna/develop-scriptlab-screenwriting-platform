import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";
const variants = {
  primary: "bg-gold text-ink hover:bg-gold-soft shadow-[0_0_0_1px_rgba(201,162,77,0.4)]",
  secondary: "border border-line bg-slate text-ivory hover:border-gold/50 hover:bg-charcoal",
  ghost: "text-parchment hover:text-ivory hover:bg-slate",
  danger: "border border-red-900/60 text-red-300 hover:bg-red-950/40",
};
const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants; size?: keyof typeof sizes; loading?: boolean };
export function Button({ variant = "primary", size = "md", loading, className = "", children, ...rest }: BtnProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = "primary", size = "md", className = "", children }: { href: string; variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const fieldCls = "w-full rounded-md border border-line bg-charcoal px-3 py-2.5 text-sm text-ivory placeholder:text-muted/70 transition focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCls} ${props.className ?? ""}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldCls} min-h-[120px] leading-relaxed ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldCls} ${props.className ?? ""}`} />;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gold" | "green" | "amber" | "red" }) {
  const tones = {
    neutral: "border-line text-parchment",
    gold: "border-gold/40 text-gold-soft bg-gold/5",
    green: "border-emerald-800/60 text-emerald-300 bg-emerald-950/30",
    amber: "border-amber-800/60 text-amber-300 bg-amber-950/30",
    red: "border-red-900/60 text-red-300 bg-red-950/30",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${tones[tone]}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (status === "reviewed") return <Badge tone="green">Reviewed</Badge>;
  if (status === "submitted") return <Badge tone="amber">Submitted</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-charcoal ${className}`}>{children}</div>;
}

export function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-line ${className}`}>
      <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "info" | "success"; children: ReactNode }) {
  const cls = kind === "error" ? "border-red-900/60 bg-red-950/30 text-red-200" : kind === "success" ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200" : "border-gold/30 bg-gold/5 text-gold-soft";
  return <div className={`rounded-md border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-line text-gold">✦</div>
      <p className="font-display text-xl text-ivory">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-muted">
      <Spinner className="h-5 w-5 text-gold" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{eyebrow}</p>}
        <h2 className="font-display text-2xl text-ivory sm:text-3xl">{title}</h2>
        {description && <p className="mt-1 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-charcoal px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-ivory">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}
