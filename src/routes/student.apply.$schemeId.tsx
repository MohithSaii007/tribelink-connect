import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  CheckList,
  EmptyState,
  LoadingPanel,
  PageHeader,
  PrototypeBadge,
  ProgressBlock,
  StatusPill,
  statusToState,
} from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { applicationReadiness, existingBenefit, INR, rulesOf } from "@/lib/intel";
import { submitApplication } from "@/lib/tribalink.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/apply/$schemeId")({
  head: () => ({
    meta: [
      { title: "Apply for a Scholarship · TRIBALINK" },
      { name: "description", content: "An eight-step scholarship application pre-filled from your unified TRIBALINK profile, with a readiness check before you submit." },
      { property: "og:title", content: "Apply for a Scholarship · TRIBALINK" },
      { property: "og:description", content: "Pre-filled, checked and submitted in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Apply,
});

const STEPS = ["Personal", "Academic", "Income", "Bank", "Documents", "Verification", "Review", "Submit"];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function Apply() {
  const { schemeId } = Route.useParams();
  const { data, isPending } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const navigate = useNavigate();
  const submitFn = useServerFn(submitApplication);
  const [step, setStep] = useState(0);

  const submit = useMutation({
    mutationFn: () => submitFn({ data: { schemeId } }),
    onSuccess: (res) => {
      refresh();
      toast.success(`Application submitted. Your reference number is ${(res as { reference_no?: string }).reference_no ?? "generated"}.`);
      void navigate({ to: "/student/applications" });
    },
    onError: (e: Error) => toast.error(e.message || "We couldn't submit your application. Please try again."),
  });

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Apply" />
        <LoadingPanel rows={5} />
      </div>
    );
  }

  const scheme = data.schemes.find((s) => s.id === schemeId);
  if (!scheme) {
    return (
      <EmptyState title="Scheme not found" description="This scholarship scheme is no longer available." actionLabel="Back to scholarships" actionTo="/student/scholarships" />
    );
  }

  const s = data.student;
  const readiness = applicationReadiness(scheme as never, s as never, data.documents as never, data.applications as never);
  const benefit = existingBenefit(data.applications as never, schemeId);
  const elig = data.eligibility.find((e) => e.scheme_id === schemeId);
  const r = rulesOf(scheme as never);
  const required = scheme.required_documents ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Apply — ${scheme.short_name}`}
        description="Every answer below comes from your unified profile. Correct anything that looks wrong before you submit."
        actions={
          <Button asChild variant="outline">
            <Link to="/student/scholarships">
              <ArrowLeft className="size-4" aria-hidden /> Back to scholarships
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold text-foreground">
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </p>
            <p className="text-muted-foreground">{Math.round(((step + 1) / STEPS.length) * 100)}% complete</p>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((label, i) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium",
                    i === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : i < step
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {i + 1}. {label}
                </button>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 7
              ? "Confirm and submit your application."
              : "Pre-filled from your unified profile — you only enter this information once."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <dl>
              <Row label="Full name" value={s?.full_name} />
              <Row label="Date of birth" value={s?.dob} />
              <Row label="Gender" value={s?.gender} />
              <Row label="Mobile" value={s?.phone} />
              <Row label="Email" value={s?.email} />
              <Row label="State / District" value={[s?.state, s?.district].filter(Boolean).join(" · ")} />
              <Row label="Tribe" value={s?.tribe} />
              <Row label="ST status" value={s?.st_status ? "Declared" : "Not declared"} />
              <Row label="PVTG status" value={s?.pvtg_status ? "Yes" : "No"} />
            </dl>
          ) : null}

          {step === 1 ? (
            <dl>
              <Row label="Institution" value={s?.institution} />
              <Row label="AISHE / UDISE+ reference" value={s?.aishe_code} />
              <Row label="Course" value={s?.course} />
              <Row label="Level" value={s?.degree_level} />
              <Row label="Year of study" value={s?.year_of_study} />
              <Row label="Enrollment / APAAR ID" value={s?.enrollment_no} />
              <Row label="Latest score" value={s?.academic_score ? `${s.academic_score}%` : null} />
            </dl>
          ) : null}

          {step === 2 ? (
            <dl>
              <Row label="Parent / guardian" value={s?.parent_name} />
              <Row label="Occupation" value={s?.parent_occupation} />
              <Row label="Annual family income" value={INR(s?.annual_income)} />
              <Row label="Scheme income ceiling" value={r.max_income ? INR(r.max_income) : "Not applicable"} />
            </dl>
          ) : null}

          {step === 3 ? (
            <dl>
              <Row label="Account holder" value={s?.bank_account_name} />
              <Row label="Bank" value={s?.bank_name} />
              <Row label="Account (masked)" value={s?.account_number_masked} />
              <Row label="IFSC" value={s?.ifsc} />
              <Row label="DBT seeding" value={s?.dbt_enabled ? "Confirmed (simulated)" : "Pending confirmation"} />
            </dl>
          ) : null}

          {step === 4 ? (
            <ul className="space-y-2">
              {required.map((t) => {
                const doc = data.documents.find((d) => d.doc_type === t);
                return (
                  <li key={t} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                    <span className="font-medium text-foreground">{t}</span>
                    {doc ? (
                      <StatusPill state={statusToState(doc.verification_status)}>{doc.verification_status.replace(/_/g, " ")}</StatusPill>
                    ) : (
                      <span className="flex items-center gap-2">
                        <StatusPill state="fail">Not uploaded</StatusPill>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/student/documents">Upload</Link>
                        </Button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {step === 5 ? (
            <>
              <ProgressBlock label="Unified verification score" percent={data.verification.score} />
              <CheckList checks={data.verification.checks} />
            </>
          ) : null}

          {step === 6 ? (
            <>
              <p className="rounded-md border border-border bg-surface/60 p-3 text-sm">
                <strong>Eligibility:</strong> {elig?.label} — {elig?.summary}
              </p>
              <CheckList checks={elig?.checks ?? []} />
              {benefit.hasConflict ? (
                <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                  <strong>Existing benefit check:</strong> {benefit.message}
                </p>
              ) : null}
            </>
          ) : null}

          {step === 7 ? (
            <>
              <ProgressBlock
                label="Application readiness"
                percent={readiness.percent}
                hint="Submit when everything below is green. Warnings will be reviewed by an officer."
              />
              <ul className="space-y-2">
                {readiness.items.map((i) => (
                  <li key={i.label} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{i.label}</span>
                      <span className="block text-muted-foreground">{i.detail}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusPill state={i.state}>{i.state === "pass" ? "Ready" : i.state === "warn" ? "Check" : "Fix"}</StatusPill>
                      {i.state !== "pass" && i.action ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to={i.action.to}>{i.action.label}</Link>
                        </Button>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" size="lg" onClick={() => submit.mutate()} disabled={submit.isPending || benefit.blocking}>
                {submit.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}{" "}
                Submit application
              </Button>
              {benefit.blocking ? <p className="text-sm text-destructive">{benefit.message}</p> : null}
              <PrototypeBadge label="Submission is recorded in TRIBALINK only — no live NSP/SFMP submission is made" />
            </>
          ) : null}

          <div className="flex justify-between gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>
              <ArrowLeft className="size-4" aria-hidden /> Previous
            </Button>
            <Button onClick={() => setStep((v) => Math.min(STEPS.length - 1, v + 1))} disabled={step === STEPS.length - 1}>
              Next <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
