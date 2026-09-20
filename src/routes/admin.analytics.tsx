import { createFileRoute } from "@tanstack/react-router";
import { StaffAccessCard } from "@/components/tribalink/staff-access";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DemoDataBadge, LoadingPanel, PageHeader, PrototypeBadge } from "@/components/tribalink/primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalytics } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Programme Analytics · TRIBALINK" },
      { name: "description", content: "State and district coverage of tribal scholarships, application throughput and unreached-beneficiary concentration." },
      { property: "og:title", content: "Programme Analytics · TRIBALINK" },
      { property: "og:description", content: "Coverage and gap analytics across states and districts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analytics,
});

const COLORS = ["oklch(0.42 0.09 155)", "oklch(0.62 0.13 62)", "oklch(0.48 0.12 25)"];

function Analytics() {
  const { data, isPending, isError, error } = useAnalytics();
  const [view, setView] = useState<"applications" | "gaps">("applications");

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Analytics" />
        <StaffAccessCard error={error} />
      </div>
    );
  }
  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" />
        <LoadingPanel />
      </div>
    );
  }

  const max = Math.max(1, ...data.byState.map((s) => (view === "gaps" ? s.gaps : s.applications)));

  return (
    <div className="space-y-6">
      <PageHeader title="Programme analytics" description="Coverage by state and district, and where the biggest gaps sit." />
      <DemoDataBadge />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="view">Coverage view</Label>
            <Select value={view} onValueChange={(v) => setView(v as typeof view)}>
              <SelectTrigger id="view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applications">Applications received</SelectItem>
                <SelectItem value="gaps">Potential unreached beneficiaries</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">State coverage map</CardTitle>
          <CardDescription>Intensity shows {view === "gaps" ? "potential gaps" : "applications received"} per state.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {data.byState.map((s) => {
              const value = view === "gaps" ? s.gaps : s.applications;
              const intensity = value / max;
              return (
                <div
                  key={s.state}
                  className={cn("rounded-md border border-border p-3")}
                  style={{ backgroundColor: `color-mix(in oklch, var(--primary) ${Math.round(intensity * 70)}%, var(--card))` }}
                >
                  <p className={cn("text-sm font-semibold", intensity > 0.5 ? "text-primary-foreground" : "text-foreground")}>{s.state}</p>
                  <p className={cn("text-xs", intensity > 0.5 ? "text-primary-foreground/85" : "text-muted-foreground")}>
                    {value} {view === "gaps" ? "potential gaps" : "applications"} · {s.students} students
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Low</span>
            <span className="h-2 flex-1 rounded-full bg-[linear-gradient(to_right,var(--card),var(--primary))]" aria-hidden />
            <span>High</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">State comparison</CardTitle>
          <CardDescription>Students, applications and potential gaps side by side.</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byState}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="state" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={90} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" name="Students" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="applications" name="Applications" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="gaps" name="Potential gaps" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">District detail</CardTitle>
          <CardDescription>Districts with the highest number of potential unreached beneficiaries.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>District</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Potential gaps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byDistrict.map((d) => (
                <TableRow key={`${d.state}-${d.district}`}>
                  <TableCell className="font-medium text-foreground">{d.district}</TableCell>
                  <TableCell>{d.state}</TableCell>
                  <TableCell>{d.applications}</TableCell>
                  <TableCell>{d.gaps}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PrototypeBadge label="All figures come from the synthetic demonstration dataset" />
    </div>
  );
}
