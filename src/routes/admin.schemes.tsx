import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { LoadingPanel, PageHeader, PrototypeBadge } from "@/components/tribalink/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEGREE_LEVELS, rulesOf } from "@/lib/intel";
import { listPublicSchemes, updateScheme } from "@/lib/tribalink.functions";

export const Route = createFileRoute("/admin/schemes")({
  head: () => ({
    meta: [
      { title: "Scheme Management · TRIBALINK" },
      { name: "description", content: "Configure scholarship names, income ceilings, academic criteria, required documents, deadlines and status without changing any code." },
      { property: "og:title", content: "Scheme Management · TRIBALINK" },
      { property: "og:description", content: "Policy changes without a new release." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Schemes,
});

function Schemes() {
  const listFn = useServerFn(listPublicSchemes);
  const saveFn = useServerFn(updateScheme);
  const schemes = useQuery({ queryKey: ["public-schemes"], queryFn: () => listFn({}) });
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => saveFn({ data: payload as never }),
    onSuccess: () => {
      void schemes.refetch();
      setEditing(null);
      toast.success("Scheme rules saved. A new rule version was recorded.");
    },
    onError: (e: Error) => toast.error(e.message || "The scheme could not be updated."),
  });

  if (schemes.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="Schemes" />
        <LoadingPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheme management"
        description="Eligibility rules are stored as data. Changing an income ceiling or a required document takes effect immediately, with a new version recorded."
      />
      <PrototypeBadge label="Rule versions, effective dates and the updating officer are recorded for every change" />

      {(schemes.data ?? []).map((s) => {
        const r = rulesOf(s as never);
        const isEditing = editing === s.id;
        const val = (k: string, fallback: string) => (isEditing ? (form[k] ?? fallback) : fallback);
        return (
          <Card key={s.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <CardDescription>
                    Version {s.version ?? 1} · effective {s.effective_date ?? "—"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.status === "open" ? "default" : "secondary"}>{s.status}</Badge>
                  {isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(s.id);
                        setForm({
                          name: s.name,
                          description: s.description,
                          target: s.target,
                          award_amount: String(s.award_amount ?? ""),
                          deadline: s.deadline ?? "",
                          status: s.status,
                          max_income: r.max_income ? String(r.max_income) : "",
                          min_score: String(r.min_score ?? 0),
                          levels: (r.levels ?? []).join(","),
                          required_documents: (s.required_documents ?? []).join(","),
                        });
                      }}
                    >
                      Edit rules
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing ? (
                <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <Row label="Target" value={s.target} />
                  <Row label="Award amount" value={s.award_amount ? `₹${Number(s.award_amount).toLocaleString("en-IN")}` : "—"} />
                  <Row label="Income ceiling" value={r.max_income ? `₹${r.max_income.toLocaleString("en-IN")}` : "Not applicable"} />
                  <Row label="Minimum score" value={`${r.min_score ?? 0}%`} />
                  <Row label="Levels" value={(r.levels ?? []).join(", ") || "Any"} />
                  <Row label="Deadline" value={s.deadline ?? "—"} />
                  <Row label="Required documents" value={(s.required_documents ?? []).join(", ")} />
                </dl>
              ) : (
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save.mutate({
                      id: s.id,
                      name: val("name", s.name),
                      description: val("description", s.description),
                      target: val("target", s.target),
                      award_amount: form["award_amount"] ? Number(form["award_amount"]) : null,
                      deadline: form["deadline"] || null,
                      status: (form["status"] ?? s.status) as "open" | "closed" | "draft",
                      max_income: form["max_income"] ? Number(form["max_income"]) : null,
                      min_score: Number(form["min_score"] ?? 0),
                      levels: (form["levels"] ?? "").split(",").map((x) => x.trim()).filter(Boolean),
                      required_documents: (form["required_documents"] ?? "").split(",").map((x) => x.trim()).filter(Boolean),
                    });
                  }}
                >
                  <Field id={`${s.id}-name`} label="Scheme name" value={form["name"] ?? ""} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                  <Field id={`${s.id}-target`} label="Target group" value={form["target"] ?? ""} onChange={(v) => setForm((f) => ({ ...f, target: v }))} />
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`${s.id}-desc`}>Description</Label>
                    <Textarea id={`${s.id}-desc`} rows={2} value={form["description"] ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                  <Field id={`${s.id}-award`} label="Award amount (₹)" type="number" value={form["award_amount"] ?? ""} onChange={(v) => setForm((f) => ({ ...f, award_amount: v }))} />
                  <Field id={`${s.id}-income`} label="Income ceiling (₹)" type="number" value={form["max_income"] ?? ""} onChange={(v) => setForm((f) => ({ ...f, max_income: v }))} />
                  <Field id={`${s.id}-score`} label="Minimum academic score (%)" type="number" value={form["min_score"] ?? ""} onChange={(v) => setForm((f) => ({ ...f, min_score: v }))} />
                  <Field id={`${s.id}-deadline`} label="Deadline" type="date" value={form["deadline"] ?? ""} onChange={(v) => setForm((f) => ({ ...f, deadline: v }))} />
                  <div className="space-y-1.5">
                    <Label htmlFor={`${s.id}-status`}>Status</Label>
                    <Select value={form["status"] ?? s.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                      <SelectTrigger id={`${s.id}-status`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Field
                    id={`${s.id}-levels`}
                    label={`Eligible levels (comma separated: ${DEGREE_LEVELS.map((d) => d.value).join(", ")})`}
                    value={form["levels"] ?? ""}
                    onChange={(v) => setForm((f) => ({ ...f, levels: v }))}
                  />
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`${s.id}-docs`}>Required documents (comma separated)</Label>
                    <Textarea id={`${s.id}-docs`} rows={2} value={form["required_documents"] ?? ""} onChange={(e) => setForm((f) => ({ ...f, required_documents: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={save.isPending}>
                      {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save rules
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        );
      })}
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

function Field({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
