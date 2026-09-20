import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Clock, ShieldCheck, ShieldQuestion } from "lucide-react";

import { DemoDataBadge, KpiCard, LoadingPanel, PageHeader } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-admin";

export const Route = createFileRoute("/admin/verification")({
  head: () => ({
    meta: [
      { title: "Verification Analytics · TRIBALINK" },
      { name: "description", content: "Verified, pending, mismatched and manually reviewed records, average processing time and the most common mismatch types." },
      { property: "og:title", content: "Verification Analytics · TRIBALINK" },
      { property: "og:description", content: "Where verification time and mismatches concentrate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerificationAnalytics,
});

const COLORS = ["oklch(0.42 0.09 155)", "oklch(0.62 0.13 62)", "oklch(0.48 0.12 25)", "oklch(0.55 0.08 200)"];

function VerificationAnalytics() {
  const { data, isPending, isError } = useAnalytics();

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Verification" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">Staff access is required for this page.</p>
      </div>
    );
  }
  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Verification" />
        <LoadingPanel />
      </div>
    );
  }

  const v = data.verification;
  const donut = [
    { name: "Verified", value: v.verified },
    { name: "Pending", value: v.pending },
    { name: "Mismatch", value: v.mismatch },
    { name: "Manual review", value: v.manual },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification analytics"
        description="Where verification effort is going, and which mismatches recur most often."
        actions={
          <Button asChild>
            <Link to="/admin/review">Open review queue</Link>
          </Button>
        }
      />
      <DemoDataBadge />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Verified records" value={v.verified} icon={ShieldCheck} tone="success" />
        <KpiCard label="Pending" value={v.pending} icon={Clock} tone="warning" />
        <KpiCard label="Mismatches" value={v.mismatch} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Manual review" value={v.manual} icon={ShieldQuestion} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification outcomes</CardTitle>
            <CardDescription>Average officer processing time: {v.avgHours} hours.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {donut.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most common mismatch types</CardTitle>
            <CardDescription>Each one is explained to the officer before any decision.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {v.mismatchTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mismatches recorded in the current dataset.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={v.mismatchTypes} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
