import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { CheckList, LoadingPanel, PageHeader, PrototypeBadge, ProgressBlock, StatusPill, statusToState } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { listVerificationRecords, saveVerificationRun } from "@/lib/tribalink.functions";

export const Route = createFileRoute("/student/verification")({
  head: () => ({
    meta: [
      { title: "Verification Centre · TRIBALINK" },
      { name: "description", content: "One unified verification of identity, ST status, income, academics, institution and bank details — with a reason for every result." },
      { property: "og:title", content: "Verification Centre · TRIBALINK" },
      { property: "og:description", content: "Verify once, reuse everywhere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Verification,
});

function Verification() {
  const { data, isPending } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const recordsFn = useServerFn(listVerificationRecords);
  const runFn = useServerFn(saveVerificationRun);

  const records = useQuery({ queryKey: ["verification-records"], queryFn: () => recordsFn({}) });

  const run = useMutation({
    mutationFn: () => runFn({}),
    onSuccess: (res) => {
      refresh();
      void records.refetch();
      toast.success(`Verification complete — unified score ${res.score}%.`);
    },
    onError: () => toast.error("The verification engine is unavailable right now. Your saved results are still shown below."),
  });

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Verification" />
        <LoadingPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification centre"
        description="TRIBALINK cross-checks your profile against your uploaded documents and simulated government registries — once, for all five schemes."
        actions={
          <Button onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />} Run verification
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-5 pt-6">
          <ProgressBlock
            label="Unified verification score"
            percent={data.verification.score}
            hint="Weighted across six checks. A warning is never a rejection — it means an officer may need to look."
          />
          <CheckList checks={data.verification.checks} />
          <PrototypeBadge label="Registry cross-checks (UIDAI, AISHE, UDISE+, APAAR) are simulated for this prototype" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verification history</CardTitle>
          <CardDescription>Every check that has been recorded on your file.</CardDescription>
        </CardHeader>
        <CardContent>
          {records.isPending ? (
            <LoadingPanel rows={3} />
          ) : (records.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No verification has been recorded yet. Run a verification above.</p>
          ) : (
            <ul className="space-y-2">
              {(records.data ?? []).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <ShieldCheck className="size-4 text-primary" aria-hidden /> {r.verification_type}
                    </p>
                    <p className="text-sm text-muted-foreground">{r.remarks}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.source} · {new Date(r.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <StatusPill state={statusToState(r.status)}>{r.status.replace(/_/g, " ")}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
