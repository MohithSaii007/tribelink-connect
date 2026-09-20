import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { EmptyState, LoadingPanel, PageHeader, StatusPill, statusToState } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { INR, STAGE_LABELS } from "@/lib/intel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/applications")({
  head: () => ({
    meta: [
      { title: "My Applications · TRIBALINK" },
      { name: "description", content: "Track every scholarship application from submission through institution and ministry verification to sanction and DBT credit." },
      { property: "og:title", content: "My Applications · TRIBALINK" },
      { property: "og:description", content: "A real timeline for every application." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Applications,
});

const TRACK = [
  "submitted",
  "institution_verification",
  "document_verification",
  "ministry_verification",
  "sanctioned",
  "dbt_processing",
  "paid",
];

function trackIndex(status: string) {
  if (status === "paid") return 6;
  if (status === "dbt_processing") return 5;
  if (status === "sanctioned") return 4;
  if (status === "under_verification") return 2;
  if (status === "deficiency" || status === "resubmission_required") return 1;
  return 0;
}

function Applications() {
  const { data, isPending } = useWorkspace();

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="My applications" />
        <LoadingPanel />
      </div>
    );
  }

  if (data.applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="My applications" />
        <EmptyState
          title="No applications yet"
          description="Check which of the five schemes you qualify for and start your first application — your profile will auto-fill most of it."
          actionLabel="Explore Scholarships"
          actionTo="/student/scholarships"
          icon={FileText}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My applications" description="Follow each application stage by stage. Nothing happens behind a closed door." />

      {data.applications.map((a) => {
        const scheme = data.schemes.find((s) => s.id === a.scheme_id);
        const idx = trackIndex(a.status);
        const events = data.events.filter((e) => e.application_id === a.id);
        const payment = data.payments.find((p) => p.application_id === a.id);
        return (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{scheme?.name ?? a.scheme_id}</CardTitle>
                  <CardDescription>
                    Reference {a.reference_no} · submitted {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString("en-IN") : "—"}
                  </CardDescription>
                </div>
                <StatusPill state={statusToState(a.status)}>{STAGE_LABELS[a.status] ?? a.status}</StatusPill>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ol className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {TRACK.map((s, i) => (
                  <li
                    key={s}
                    className={cn(
                      "rounded-md border p-2.5 text-xs",
                      i <= idx ? "border-primary/40 bg-primary/8 text-foreground" : "border-border bg-surface/60 text-muted-foreground",
                    )}
                  >
                    <span className="block font-semibold">{i + 1}</span>
                    {STAGE_LABELS[s] ?? s}
                  </li>
                ))}
              </ol>

              {payment ? (
                <p className="rounded-md border border-border bg-surface/60 p-3 text-sm">
                  <strong>Sanctioned {INR(Number(payment.amount))}</strong> · {payment.transaction_reference ?? "reference pending"} ·{" "}
                  {payment.bank_status ?? "awaiting bank"}
                </p>
              ) : null}

              <div>
                <p className="text-sm font-semibold text-foreground">Activity</p>
                <ul className="mt-2 space-y-2 border-l-2 border-border pl-4">
                  {events.length === 0 ? (
                    <li className="text-sm text-muted-foreground">No activity recorded yet.</li>
                  ) : (
                    events.map((e) => (
                      <li key={e.id} className="text-sm">
                        <p className="font-medium text-foreground">{STAGE_LABELS[e.status] ?? e.status}</p>
                        <p className="text-muted-foreground">{e.note}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("en-IN")}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/student/payments">View payment status</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/student/documents">Manage documents</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
