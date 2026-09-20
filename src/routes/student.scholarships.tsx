import { createFileRoute, Link } from "@tanstack/react-router";
import { Info } from "lucide-react";

import { CheckList, LoadingPanel, PageHeader, PrototypeBadge, StatusPill } from "@/components/tribalink/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { existingBenefit, INR, rulesOf } from "@/lib/intel";

export const Route = createFileRoute("/student/scholarships")({
  head: () => ({
    meta: [
      { title: "Scholarships & Eligibility · TRIBALINK" },
      { name: "description", content: "Check your eligibility for all five tribal scholarship schemes with a clear explanation for every rule that was evaluated." },
      { property: "og:title", content: "Scholarships & Eligibility · TRIBALINK" },
      { property: "og:description", content: "Rule-by-rule eligibility across Pre-Matric, Post-Matric, Top Class, NFST and NOS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Scholarships,
});

function Scholarships() {
  const { data, isPending } = useWorkspace();

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Scholarships" description="Evaluating your eligibility…" />
        <LoadingPanel rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scholarships"
        description="Eligibility is computed from configurable scheme rules against your unified profile. Every outcome tells you why."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <Info className="size-5 text-accent" aria-hidden />
        <p className="flex-1 text-sm text-muted-foreground">
          TRIBALINK never replaces an officer's decision. "Potentially eligible" means a human verification step is needed — it is
          not a rejection.
        </p>
        <PrototypeBadge label="Rules engine · configurable, not hard-coded" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {data.schemes.map((scheme) => {
          const elig = data.eligibility.find((e) => e.scheme_id === scheme.id);
          const benefit = existingBenefit(data.applications as never, scheme.id);
          const r = rulesOf(scheme as never);
          const state = elig?.status === "eligible" ? "pass" : elig?.status === "potential" ? "warn" : "fail";
          const applied = data.applications.find((a) => a.scheme_id === scheme.id);
          return (
            <Card key={scheme.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{scheme.name}</CardTitle>
                    <CardDescription className="mt-1">{scheme.description}</CardDescription>
                  </div>
                  <StatusPill state={state}>{elig?.label ?? "Not evaluated"}</StatusPill>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={scheme.status === "open" ? "default" : "secondary"}>
                    {scheme.status === "open" ? "Applications open" : "Currently closed"}
                  </Badge>
                  <Badge variant="outline">Award {INR(Number(scheme.award_amount))}</Badge>
                  {r.max_income ? <Badge variant="outline">Income ≤ {INR(r.max_income)}</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="rounded-md border border-border bg-surface/60 p-3 text-sm text-foreground">
                  <strong>WHY?</strong> {elig?.summary}
                </p>
                <CheckList checks={elig?.checks ?? []} />

                {benefit.hasConflict ? (
                  <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
                    <strong>Existing benefit check:</strong> {benefit.message}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {applied ? (
                    <Button asChild variant="outline">
                      <Link to="/student/applications">View my application</Link>
                    </Button>
                  ) : (
                    <Button asChild disabled={scheme.status !== "open"}>
                      <Link to="/student/apply/$schemeId" params={{ schemeId: scheme.id }}>
                        {scheme.status === "open" ? "Start application" : "Applications closed"}
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost">
                    <Link to="/student/documents">Required documents ({scheme.required_documents.length})</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
