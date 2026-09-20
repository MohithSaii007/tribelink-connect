import { createFileRoute } from "@tanstack/react-router";
import { StaffAccessCard } from "@/components/tribalink/staff-access";
import { useMemo, useState } from "react";
import { Users } from "lucide-react";

import { DemoDataBadge, EmptyState, LoadingPanel, PageHeader, StatusPill, statusToState } from "@/components/tribalink/primitives";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminStudents } from "@/hooks/use-admin";
import { INR, STAGE_LABELS } from "@/lib/intel";

export const Route = createFileRoute("/admin/students")({
  head: () => ({
    meta: [
      { title: "Students Register · TRIBALINK" },
      { name: "description", content: "Search and filter registered tribal scholarship students by name, institution, district, state and application status." },
      { property: "og:title", content: "Students Register · TRIBALINK" },
      { property: "og:description", content: "Every registered student in one searchable register." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Students,
});

function Students() {
  const { data, isPending, isError, error } = useAdminStudents();
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = data ?? [];
  const states = useMemo(() => [...new Set(rows.map((r) => r.state).filter(Boolean))].sort() as string[], [rows]);

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Students" />
        <StaffAccessCard error={error} />
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="Students" />
        <LoadingPanel />
      </div>
    );
  }

  const filtered = rows.filter(
    (r) =>
      (state === "all" || r.state === state) &&
      (status === "all" || r.latest_status === status) &&
      (search === "" ||
        [r.full_name, r.institution, r.district, r.enrollment_no]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search.toLowerCase()))),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Students register" description="Search by name, institution, district or enrollment reference." />
      <DemoDataBadge />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="s-search">Search</Label>
            <Input id="s-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, institution, district…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-state">State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger id="s-state">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-status">Latest application status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="s-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.keys(STAGE_LABELS).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No students match these filters" description="Try a different search term, state or status." icon={Users} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{filtered.length} students</CardTitle>
            <CardDescription>Sensitive identifiers are always masked.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>District / State</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Latest status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{r.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.st_status ? "ST" : "—"}
                        {r.pvtg_status ? " · PVTG" : ""} · {r.account_number_masked ?? "no bank on file"}
                      </p>
                    </TableCell>
                    <TableCell>{r.institution ?? "—"}</TableCell>
                    <TableCell>
                      {r.district ?? "—"} · {r.state ?? "—"}
                    </TableCell>
                    <TableCell>{INR(r.annual_income)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.applications}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.latest_status ? (
                        <StatusPill state={statusToState(r.latest_status)}>{STAGE_LABELS[r.latest_status] ?? r.latest_status}</StatusPill>
                      ) : (
                        <span className="text-sm text-muted-foreground">No application</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
