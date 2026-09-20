import { createFileRoute } from "@tanstack/react-router";
import { StaffAccessCard } from "@/components/tribalink/staff-access";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DemoDataBadge, EmptyState, LoadingPanel, PageHeader, StatusPill, statusToState } from "@/components/tribalink/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useRefreshAdmin, useReviewQueue } from "@/hooks/use-admin";
import { INR } from "@/lib/intel";
import { reviewAction } from "@/lib/tribalink.functions";

export const Route = createFileRoute("/admin/review")({
  head: () => ({
    meta: [
      { title: "Manual Review Queue · TRIBALINK" },
      { name: "description", content: "Officer review queue for flagged tribal scholarship documents, with extracted data, detected mismatches and the reason each item was flagged." },
      { property: "og:title", content: "Manual Review Queue · TRIBALINK" },
      { property: "og:description", content: "AI flags, officers decide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Review,
});

type QueueItem = ReturnType<typeof useReviewQueue>["data"] extends (infer T)[] | undefined ? T : never;

function Review() {
  const { data, isPending, isError, error } = useReviewQueue();
  const refresh = useRefreshAdmin();
  const fn = useServerFn(reviewAction);
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [remarks, setRemarks] = useState("");

  const act = useMutation({
    mutationFn: (input: { documentId: string; action: "verify" | "request_correction" | "escalate"; remarks?: string }) =>
      fn({ data: input }),
    onSuccess: (_r, v) => {
      refresh();
      setSelected(null);
      setRemarks("");
      toast.success(
        v.action === "verify" ? "Document verified and the student notified." : v.action === "request_correction" ? "Correction requested from the student." : "Escalated to the Ministry desk.",
      );
    },
    onError: (e: Error) => toast.error(e.message || "The action could not be recorded."),
  });

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Manual review" />
        <StaffAccessCard error={error} />
      </div>
    );
  }

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Manual review" />
        <LoadingPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual review queue"
        description="TRIBALINK detects and explains. Every decision below is made by you — nothing is auto-rejected."
      />
      <DemoDataBadge />

      {data.length === 0 ? (
        <EmptyState title="Nothing awaiting review" description="Flagged documents and mismatches will appear here for an officer decision." icon={ClipboardCheck} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{data.length} item(s) awaiting a decision</CardTitle>
            <CardDescription>Sorted with the most recently flagged first.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{row.student_name}</p>
                      <p className="text-xs text-muted-foreground">{row.institution} · {row.district}</p>
                    </TableCell>
                    <TableCell>{row.application}</TableCell>
                    <TableCell className="max-w-sm text-sm text-muted-foreground">{row.issue}</TableCell>
                    <TableCell>
                      <Badge variant={row.priority === "High" ? "destructive" : row.priority === "Medium" ? "default" : "secondary"}>
                        {row.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusPill state={statusToState(row.status)}>{row.status.replace(/_/g, " ")}</StatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.student_name} — {selected.doc_type}</DialogTitle>
                <DialogDescription>{selected.issue}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <section>
                  <h3 className="text-sm font-semibold text-foreground">Student profile</h3>
                  <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    <Row label="Institution" value={selected.profile?.institution} />
                    <Row label="State / District" value={[selected.profile?.state, selected.profile?.district].filter(Boolean).join(" · ")} />
                    <Row label="Declared income" value={INR(selected.profile?.annual_income ?? null)} />
                    <Row label="Academic score" value={selected.profile?.academic_score ? `${selected.profile.academic_score}%` : "—"} />
                    <Row label="ST status" value={selected.profile?.st_status ? "Declared" : "Not declared"} />
                    <Row label="DBT seeded" value={selected.profile?.dbt_enabled ? "Yes (simulated)" : "No"} />
                  </dl>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-foreground">Extracted document data</h3>
                  <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {Object.entries((selected.extracted ?? {}) as Record<string, unknown>)
                      .filter(([k]) => !k.startsWith("_"))
                      .map(([k, v]) => (
                        <Row key={k} label={k} value={String(v)} />
                      ))}
                  </dl>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-foreground">Why this was flagged</h3>
                  <p className="mt-1 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">{selected.issue}</p>
                </section>

                <div className="space-y-1.5">
                  <label htmlFor="remarks" className="text-sm font-medium text-foreground">
                    Officer remarks
                  </label>
                  <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="Record the reason for your decision…" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => act.mutate({ documentId: selected.id, action: "verify", remarks: remarks || "Verified by officer." })}
                    disabled={act.isPending}
                  >
                    {act.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Verify
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => act.mutate({ documentId: selected.id, action: "request_correction", remarks: remarks || "Correction requested." })}
                    disabled={act.isPending}
                  >
                    Request correction
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => act.mutate({ documentId: selected.id, action: "escalate", remarks: remarks || "Escalated to Ministry desk." })}
                    disabled={act.isPending}
                  >
                    Escalate
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 py-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
