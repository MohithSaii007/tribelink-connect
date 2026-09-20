import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, FileStack, FileText, GraduationCap, IndianRupee, ShieldCheck, Sparkle } from "lucide-react";

import {
  CheckList,
  DemoDataBadge,
  KpiCard,
  LoadingPanel,
  PageHeader,
  ProgressBlock,
  StatusPill,
  statusToState,
} from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { INR, profileCompletion, STAGE_LABELS } from "@/lib/intel";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · TRIBALINK Student Portal" },
      { name: "description", content: "See your profile completion, eligible scholarships, pending actions, verification score and DBT payment status in one place." },
      { property: "og:title", content: "Student Dashboard · TRIBALINK" },
      { property: "og:description", content: "Your scholarship status at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isPending } = useWorkspace();

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading your unified scholarship view…" />
        <LoadingPanel rows={5} />
      </div>
    );
  }

  const student = data.student;
  const completion = profileCompletion(student);
  const eligible = data.eligibility.filter((e) => e.status === "eligible");
  const potential = data.eligibility.filter((e) => e.status === "potential");
  const pendingDocs = data.documents.filter((d) => d.verification_status !== "verified");
  const activeApp = data.applications[0];
  const payment = data.payments[0];
  const unread = data.notifications.filter((n) => !n.read_status);

  const pendingActions = [
    ...(completion.percent < 100 ? [{ label: "Complete your profile", to: "/student/profile" }] : []),
    ...pendingDocs.slice(0, 3).map((d) => ({ label: `${d.doc_type} — ${d.verification_status}`, to: "/student/documents" })),
    ...(student?.dbt_enabled ? [] : [{ label: "Confirm your DBT-seeded bank account", to: "/student/profile" }]),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${student?.full_name?.split(" ")[0] ?? "student"}`}
        description="Your unified scholarship view across all five Ministry of Tribal Affairs schemes."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/student/scholarships">
                <GraduationCap className="size-4" aria-hidden /> Check eligibility
              </Link>
            </Button>
            <Button asChild>
              <Link to="/student/jago">
                <Sparkle className="size-4" aria-hidden /> Ask JAGO
              </Link>
            </Button>
          </>
        }
      />

      <DemoDataBadge />

      <Card>
        <CardContent className="pt-6">
          <ProgressBlock
            label="Profile completion"
            percent={completion.percent}
            hint={
              completion.missing.length
                ? `Still needed: ${completion.missing.slice(0, 4).join(", ")}${completion.missing.length > 4 ? "…" : ""}`
                : "Your unified profile is complete — it will auto-fill every application."
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Eligible scholarships" value={eligible.length} hint={`${potential.length} need extra verification`} icon={GraduationCap} tone="success" />
        <KpiCard label="Applications" value={data.applications.length} hint={activeApp ? STAGE_LABELS[activeApp.status] ?? activeApp.status : "No application yet"} icon={FileText} />
        <KpiCard label="Pending actions" value={pendingActions.length} hint={pendingActions.length ? "Resolve these before applying" : "Nothing pending"} icon={Bell} tone={pendingActions.length ? "warning" : "success"} />
        <KpiCard label="Documents" value={data.documents.length} hint={`${data.documents.filter((d) => d.verification_status === "verified").length} verified`} icon={FileStack} />
        <KpiCard label="Verification score" value={`${data.verification.score}%`} hint="Unified cross-check across six signals" icon={ShieldCheck} tone={data.verification.score >= 80 ? "success" : "warning"} />
        <KpiCard
          label="DBT status"
          value={payment ? (STAGE_LABELS[payment.status] ?? payment.status) : "Not started"}
          hint={payment ? `${INR(Number(payment.amount))} · ${payment.transaction_reference ?? "reference pending"}` : "Available after sanction"}
          icon={IndianRupee}
          tone={payment?.status === "paid" ? "success" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification snapshot</CardTitle>
            <CardDescription>Every signal is explained — no silent decisions.</CardDescription>
          </CardHeader>
          <CardContent>
            <CheckList checks={data.verification.checks} />
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/student/verification">Open verification centre</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending actions</CardTitle>
              <CardDescription>Clear these to reach 100% application readiness.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">You're all caught up. Nothing is waiting on you.</p>
              ) : (
                <ul className="space-y-2">
                  {pendingActions.map((a) => (
                    <li key={a.label}>
                      <Link to={a.to} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface/60 px-3 py-2.5 text-sm hover:bg-surface">
                        <span className="text-foreground">{a.label}</span>
                        <span className="text-xs font-semibold text-primary">Fix</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Latest notifications</CardTitle>
              <CardDescription>{unread.length} unread</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <StatusPill state={statusToState(n.type)}>{n.type.replace(/_/g, " ")}</StatusPill>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                </div>
              ))}
              {data.notifications.length === 0 ? <p className="text-sm text-muted-foreground">You're all caught up.</p> : null}
              <Button asChild variant="ghost" className="w-full">
                <Link to="/student/notifications">View all notifications</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
