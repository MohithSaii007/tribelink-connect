import { createFileRoute } from "@tanstack/react-router";
import { IndianRupee } from "lucide-react";

import { DemoDataBadge, EmptyState, LoadingPanel, PageHeader, StatusPill, statusToState } from "@/components/tribalink/primitives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { INR } from "@/lib/intel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/payments")({
  head: () => ({
    meta: [
      { title: "Scholarship Payments & DBT · TRIBALINK" },
      { name: "description", content: "Track your sanctioned amount, transaction reference and bank credit through the simulated Direct Benefit Transfer pipeline." },
      { property: "og:title", content: "Payments & DBT · TRIBALINK" },
      { property: "og:description", content: "Sanction to bank credit, in plain language." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Payments,
});

const DBT_STAGES = ["Sanctioned", "Payment Initiated", "Bank Processing", "Credited"];

function stageIndex(status: string, bankStatus: string | null) {
  if (status === "paid") return 3;
  if (bankStatus && bankStatus.toLowerCase().includes("process")) return 2;
  if (status === "dbt_processing" || status === "initiated") return 1;
  return 0;
}

function Payments() {
  const { data, isPending } = useWorkspace();

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" />
        <LoadingPanel />
      </div>
    );
  }

  const student = data.student;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & DBT"
        description="Scholarship money moves directly to your DBT-seeded bank account. Every step below is tracked."
      />
      <DemoDataBadge />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your DBT bank account</CardTitle>
          <CardDescription>Account numbers are always shown masked.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Bank</p>
            <p className="font-semibold text-foreground">{student?.bank_name ?? "Not provided"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Account</p>
            <p className="font-semibold text-foreground">{student?.account_number_masked ?? "Not provided"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">DBT seeding</p>
            <StatusPill state={student?.dbt_enabled ? "pass" : "warn"}>
              {student?.dbt_enabled ? "Seeded (simulated)" : "Confirmation pending"}
            </StatusPill>
          </div>
        </CardContent>
      </Card>

      {data.payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Once an application is sanctioned, the sanction amount, transaction reference and bank credit status will appear here."
          icon={IndianRupee}
        />
      ) : (
        data.payments.map((p) => {
          const idx = stageIndex(p.status, p.bank_status);
          const scheme = data.schemes.find((s) => s.id === p.scheme_id);
          return (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{scheme?.name ?? "Scholarship payment"}</CardTitle>
                    <CardDescription>
                      Sanctioned {p.sanction_date ? new Date(p.sanction_date).toLocaleDateString("en-IN") : "—"}
                    </CardDescription>
                  </div>
                  <StatusPill state={statusToState(p.status)}>{p.status.replace(/_/g, " ")}</StatusPill>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Sanction amount</p>
                    <p className="font-display text-xl font-bold text-primary">{INR(Number(p.amount))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transaction reference</p>
                    <p className="font-mono text-sm font-semibold text-foreground">{p.transaction_reference ?? "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment date</p>
                    <p className="font-semibold text-foreground">{p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-IN") : "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bank status</p>
                    <p className="font-semibold text-foreground">{p.bank_status ?? "Awaiting initiation"}</p>
                  </div>
                </div>

                <ol className="grid gap-2 sm:grid-cols-4">
                  {DBT_STAGES.map((s, i) => (
                    <li
                      key={s}
                      className={cn(
                        "rounded-md border p-3 text-sm",
                        i <= idx ? "border-primary/40 bg-primary/8 text-foreground" : "border-border bg-surface/60 text-muted-foreground",
                      )}
                    >
                      <span className="block text-xs font-semibold uppercase tracking-wide opacity-70">Step {i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
