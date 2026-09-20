import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DemoDataBadge, EmptyState, LoadingPanel, PageHeader, StatusPill, statusToState } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminApplications, useRefreshAdmin } from "@/hooks/use-admin";
import { STAGE_LABELS } from "@/lib/intel";
import { advanceApplication } from "@/lib/tribalink.functions";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({
    meta: [
      { title: "Applications · TRIBALINK Ministry Console" },
      { name: "description", content: "Review every tribal scholarship application, move files through verification and sanction, and trigger simulated DBT processing." },
      { property: "og:title", content: "Applications · TRIBALINK Ministry Console" },
      { property: "og:description", content: "Officer workflow for scholarship applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminApplications,
});

const NEXT_ACTIONS: { value: string; label: string }[] = [
  { value: "under_verification", label: "Move to verification" },
  { value: "deficiency", label: "Raise deficiency" },
  { value: "sanctioned", label: "Sanction" },
  { value: "dbt_processing", label: "Start DBT processing" },
  { value: "paid", label: "Mark credited" },
  { value: "closed", label: "Close" },
];

function AdminApplications() {
  const { data, isPending, isError } = useAdminApplications();
  const refresh = useRefreshAdmin();
  const fn = useServerFn(advanceApplication);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [scheme, setScheme] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = data ?? [];
  const schemes = useMemo(() => [...new Set(rows.map((r) => r.scheme_name))], [rows]);

  const advance = useMutation({
    mutationFn: (input: { applicationId: string; status: string }) =>
      fn({ data: { ...input, note: `Status updated to ${input.status.replace(/_/g, " ")} by officer.` } }),
    onSuccess: () => {
      refresh();
      setBusyId(null);
      toast.success("Application updated and the student notified.");
    },
    onError: (e: Error) => {
      setBusyId(null);
      toast.error(e.message || "The application could not be updated.");
    },
  });

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Applications" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">Staff access is required for this page.</p>
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="Applications" />
        <LoadingPanel />
      </div>
    );
  }

  const filtered = rows.filter(
    (r) =>
      (status === "all" || r.status === status) &&
      (scheme === "all" || r.scheme_name === scheme) &&
      (search === "" ||
        [r.student_name, r.reference_no, r.institution, r.district]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search.toLowerCase()))),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Applications" description="Move files through verification, sanction and DBT. Every change is recorded in the audit log." />
      <DemoDataBadge />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="a-search">Search</Label>
            <Input id="a-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student, application ID, institution…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-scheme">Scheme</Label>
            <Select value={scheme} onValueChange={setScheme}>
              <SelectTrigger id="a-scheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schemes</SelectItem>
                {schemes.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="a-status">
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
        <EmptyState title="No applications match these filters" description="Try a different search term, scheme or status." icon={FileText} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{filtered.length} applications</CardTitle>
            <CardDescription>Officer decisions are always explicit — nothing moves on its own.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Scheme</TableHead>
                  <TableHead>District / State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Move to</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.reference_no}</TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{r.student_name}</p>
                      <p className="text-xs text-muted-foreground">{r.institution}</p>
                    </TableCell>
                    <TableCell>{r.scheme_name}</TableCell>
                    <TableCell>
                      {r.district} · {r.state}
                    </TableCell>
                    <TableCell>
                      <StatusPill state={statusToState(r.status)}>{STAGE_LABELS[r.status] ?? r.status}</StatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {busyId === r.id && advance.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                        <Select
                          onValueChange={(v) => {
                            setBusyId(r.id);
                            advance.mutate({ applicationId: r.id, status: v });
                          }}
                        >
                          <SelectTrigger className="w-48" aria-label={`Update ${r.reference_no}`}>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            {NEXT_ACTIONS.map((a) => (
                              <SelectItem key={a.value} value={a.value}>
                                {a.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Button variant="ghost" onClick={() => refresh()}>
        Refresh list
      </Button>
    </div>
  );
}
