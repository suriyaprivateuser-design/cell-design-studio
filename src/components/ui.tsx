import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { LEVEL_TEXT, type Level } from "@/simulation/rules";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-3xl border border-line/80 bg-surface shadow-soft", className)} {...rest}>
      {children}
    </div>
  );
}

type Variant = "primary" | "secondary" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary: "bg-sage-700 text-white hover:bg-sage-800 shadow-soft",
  secondary: "bg-white text-sage-800 border border-line hover:border-sage-300 hover:bg-sage-50",
  ghost: "text-sage-800 hover:bg-sage-100",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage-200 disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", className, ...rest }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(BASE, VARIANT[variant], className)} {...rest} />;
}

export function ButtonLink({ variant = "primary", className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(BASE, VARIANT[variant], className)} {...rest} />;
}

const LEVEL_STYLE: Record<Level, string> = {
  high: "bg-good-soft text-good",
  medium: "bg-mid-soft text-mid",
  low: "bg-low-soft text-low",
};

/** Qualitative level shown as words plus a three-step meter (never a score). */
export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", LEVEL_STYLE[level], className)}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cx("h-2.5 w-1.5 rounded-full", i <= filled ? "bg-current" : "bg-current/20")} />
        ))}
      </span>
      {LEVEL_TEXT[level]}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-800", className)}>
      {children}
    </span>
  );
}

export function PageTitle({ eyebrow, title, sub }: { eyebrow?: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="space-y-2">
      {eyebrow && <p className="text-xs font-semibold tracking-wide text-sage-600 uppercase">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{title}</h1>
      {sub && <p className="max-w-2xl text-[15px] leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-7xl px-4 md:px-6", className)}>{children}</div>;
}
