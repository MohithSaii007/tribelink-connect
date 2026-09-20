import { createFileRoute } from "@tanstack/react-router";
import { StaffAccessCard } from "@/components/tribalink/staff-access";
import { useState } from "react";
import { ScrollText } from "lucide-react";

import { EmptyState, LoadingPanel, PageHeader } from "@/components/tribalink/primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/use-admin";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs · TRIBALINK" },
      { name: "description", content: "A complete trail of profile updates, uploads, verification decisions, status changes, outreach and scheme rule changes." },
      { property: "og:title", content: "Audit Logs · TRIBALINK" },
      { property: "og:description", content: "Every important action is recorded." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditLogs,
});

function AuditLogs() {
  const { data, isPending, isError, error } = useAuditLogs();
  const [search, setSearch] = useState("");

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Audit logs" />
        <StaffAccessCard error={error} />
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit logs" />
        <LoadingPanel />
      </div>
    );
  }

  const rows = (data ?? []).filter(
    (r) => search === "" || [r.action, r.entity, r.actor_name].filter(Boolean).some((v) => String(v).toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Audit logs" description="Every important action across the platform, newest first." />

      <Card>
        <CardContent className="pt-6">
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="audit-search">Search</Label>
            <Input id="audit-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Action, table or actor…" />
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="No audit entries" description="Actions taken in TRIBALINK will be recorded here." icon={ScrollText} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{rows.length} entries</CardTitle>
            <CardDescription>Immutable record of platform activity.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString("en-IN")}</TableCell>
                    <TableCell>{r.actor_name || "—"}</TableCell>
                    <TableCell className="font-medium text-foreground">{r.action}</TableCell>
                    <TableCell>{r.entity}</TableCell>
                    <TableCell className="max-w-sm truncate font-mono text-xs text-muted-foreground">{JSON.stringify(r.metadata)}</TableCell>
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
