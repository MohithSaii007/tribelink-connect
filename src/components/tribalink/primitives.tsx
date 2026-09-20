import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CheckState } from "@/lib/intel";

export function PrototypeBadge({ label = "Prototype / Simulated Government Integration", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-warning-foreground",
        className,
      )}
    >
      <AlertTriangle className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export function DemoDataBadge() {
  return <PrototypeBadge label="Demo / Synthetic Data" />;
}

const stateStyles: Record<CheckState, string> = {
  pass: "bg-success/12 text-success border-success/30",
  warn: "bg-warning/15 text-warning-foreground border-warning/40",
  fail: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusDot({ state }: { state: CheckState }) {
  const Icon = state === "pass" ? CheckCircle2 : state === "warn" ? CircleAlert : AlertTriangle;
  return (
    <Icon
      className={cn("size-4 shrink-0", state === "pass" ? "text-success" : state === "warn" ? "text-warning" : "text-destructive")}
      aria-hidden
    />
  );
}

export function StatusPill({ state, children }: { state: CheckState; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", stateStyles[state])}>
      <StatusDot state={state} />
      {children}
    </span>
  );
}

export function statusToState(status: string): CheckState {
  if (["verified", "paid", "sanctioned", "eligible", "enrolled"].includes(status)) return "pass";
  if (["deficiency", "mismatch", "resubmission_required", "ineligible", "closed"].includes(status)) return "fail";
  return "warn";
}

export function CheckList({ checks }: { checks: { label: string; state: CheckState; detail: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {checks.map((c) => (
        <li key={c.label} className="flex gap-3 rounded-md border border-border/70 bg-surface/60 p-3">
          <StatusDot state={c.state} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{c.label}</p>
            <p className="text-sm text-muted-foreground">{c.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "accent" | "warning" | "success";
}) {
  const toneRing = {
    default: "border-border",
    accent: "border-accent/40",
    warning: "border-warning/40",
    success: "border-success/40",
  }[tone];
  return (
    <Card className={cn("gap-0 py-4", toneRing)}>
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        </div>
        <p className="mt-2 font-display text-2xl font-bold text-foreground tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  icon: Icon = Info,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-display text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionTo ? (
        <Button asChild className="mt-5">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function ProgressBlock({ label, percent, hint }: { label: string; percent: number; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="font-display text-xl font-bold tabular-nums text-primary">{percent}%</p>
      </div>
      <Progress value={percent} className="mt-2 h-2" aria-label={`${label} ${percent} percent`} />
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function LoadingPanel({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function SchemeStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "open" ? "default" : "secondary"} className="capitalize">
      {status === "open" ? "Applications open" : status}
    </Badge>
  );
}
