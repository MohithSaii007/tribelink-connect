import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BadgeIndianRupee, FileCheck2, FileText, Radar, ShieldCheck, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DemoDataBadge, KpiCard, LoadingPanel, PageHeader } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { StaffAccessCard } from "@/components/tribalink/staff-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-admin";
import { INR, STAGE_LABELS } from "@/lib/intel";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Ministry Dashboard · TRIBALINK" },
      { name: "description", content: "Scheme, state and district level statistics for tribal scholarship applications, verification, disbursement and unreached beneficiaries." },
      { property: "og:title", content: "Ministry Dashboard · TRIBALINK" },
      { property: "og:description", content: "Live programme statistics across all five schemes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

const COLORS = ["oklch(0.42 0.09 155)", "oklch(0.62 0.13 62)", "oklch(0.55 0.08 200)", "oklch(0.48 0.12 25)", "oklch(0.66 0.1 130)", "oklch(0.36 0.05 250)"];

function AdminDashboard() {
  const { data, isPending, isError, error, refetch, isFetching } = useAnalytics();

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Ministry dashboard" />
        <StaffAccessCard error={error} onRetry={() => void refetch()} isFetching={isFetching} />
      </div>
    );
  }

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ministry dashboard" />
        <LoadingPanel rows={5} />
      </div>
    );
  }

  const k = data.kpis;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ministry dashboard"
        description="Programme-wide view across all five tribal scholarship schemes."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/review">Manual review queue</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/beneficiary-gaps">
                <Radar className="size-4" aria-hidden /> Beneficiary gaps
              </Link>
            </Button>
          </>
        }
      />
      <DemoDataBadge />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total students" value={k.students} icon={Users} />
        <KpiCard label="Total applications" value={k.applications} icon={FileText} />
        <KpiCard label="Under verification" value={k.underVerification} icon={ShieldCheck} tone="warning" />
        <KpiCard label="Sanctioned" value={k.sanctioned} icon={FileCheck2} tone="success" />
        <KpiCard label="Total disbursement" value={INR(k.disbursed)} icon={BadgeIndianRupee} tone="success" />
        <KpiCard label="Potential unreached beneficiaries" value={k.gaps} hint="Identified from simulated UDISE+/APAAR data" icon={Radar} tone="accent" />
        <KpiCard label="Verification mismatches" value={k.mismatches} hint="Awaiting human decision" icon={AlertTriangle} tone="warning" />
        <KpiCard label="Avg processing time" value={`${data.verification.avgHours} hrs`} hint="Submission to officer decision" icon={ShieldCheck} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by scheme</CardTitle>
            <CardDescription>Where demand is concentrated.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byScheme} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {data.byScheme.map((_, i) => (
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
            <CardTitle className="text-base">Application status distribution</CardTitle>
            <CardDescription>Where files are sitting right now.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byStatus.map((s) => ({ ...s, name: STAGE_LABELS[s.name] ?? s.name }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">State-wise coverage</CardTitle>
            <CardDescription>Students, applications and potential gaps by state.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byState.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" name="Students" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="applications" name="Applications" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="gaps" name="Potential gaps" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">District-wise potential gaps</CardTitle>
            <CardDescription>Districts where eligible students are least reached.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDistrict} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="district" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="gaps" name="Potential gaps" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
