import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Loader2, Radar, Send } from "lucide-react";
import { toast } from "sonner";

import { DemoDataBadge, EmptyState, KpiCard, LoadingPanel, PageHeader, PrototypeBadge, StatusPill, statusToState } from "@/components/tribalink/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useGaps, useRefreshAdmin } from "@/hooks/use-admin";
import { sendOutreach } from "@/lib/tribalink.functions";

export const Route = createFileRoute("/admin/beneficiary-gaps")({
  head: () => ({
    meta: [
      { title: "Beneficiary Gap Intelligence · TRIBALINK" },
      { name: "description", content: "Identify enrolled ST students who are potentially eligible for a tribal scholarship but have no active application, and run simulated outreach." },
      { property: "og:title", content: "Beneficiary Gap Intelligence · TRIBALINK" },
      { property: "og:description", content: "Find the students the system never reached." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gaps,
});

function Gaps() {
  const { data, isPending, isError } = useGaps();
  const refresh = useRefreshAdmin();
  const fn = useServerFn(sendOutreach);
  const [selected, setSelected] = useState<string[]>([]);
  const [state, setState] = useState("all");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<"sms" | "email" | "in_app">("sms");
  const [message, setMessage] = useState(
    "You may be eligible for a Ministry of Tribal Affairs scholarship. Visit TRIBALINK to check your eligibility and apply.",
  );

  const rows = data ?? [];
  const states = useMemo(() => [...new Set(rows.map((r) => r.state))].sort(), [rows]);
  const filtered = rows.filter(
    (r) =>
      (state === "all" || r.state === state) &&
      (search === "" ||
        [r.name, r.institution, r.district].filter(Boolean).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))),
  );

  const outreach = useMutation({
    mutationFn: () => fn({ data: { ids: selected, channel, message } }),
    onSuccess: (res) => {
      refresh();
      setSelected([]);
      toast.success(`Outreach queued to ${res.delivered} potential beneficiaries via ${res.channel.toUpperCase()} — simulated delivery.`);
    },
    onError: (e: Error) => toast.error(e.message || "Outreach could not be queued."),
  });

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Beneficiary gaps" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">Staff access is required for this page.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="Beneficiary gaps" />
        <LoadingPanel />
      </div>
    );
  }

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beneficiary gap intelligence"
        description="Enrolled ST students detected in the simulated UDISE+/APAAR datasets who appear potentially eligible but have no active application."
      />
      <DemoDataBadge />
      <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
        These are <strong>potential beneficiaries</strong>, not confirmed eligible students. Eligibility is confirmed only after the
        student registers and their documents are verified.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Potential beneficiaries" value={rows.length} icon={Radar} tone="accent" />
        <KpiCard label="Outreach sent" value={rows.filter((r) => r.status === "outreach_sent").length} icon={Send} />
        <KpiCard label="Converted to registration" value={rows.filter((r) => r.status === "enrolled").length} tone="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Narrow the list before starting outreach.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gap-search">Search student, institution or district</Label>
            <Input id="gap-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. Kandhamal" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gap-state">State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger id="gap-state">
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
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No potential gaps in this view" description="Adjust the filters, or the synthetic dataset has no unreached students matching this scope." icon={Radar} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{filtered.length} potential beneficiaries</CardTitle>
            <CardDescription>Select rows to start simulated outreach.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Student</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>District / State</TableHead>
                  <TableHead>Why flagged</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggle(r.id)} aria-label={`Select ${r.name}`} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                    <TableCell>{r.institution}</TableCell>
                    <TableCell>
                      {r.district} · {r.state}
                    </TableCell>
                    <TableCell className="max-w-sm text-sm text-muted-foreground">{(r.reasons ?? []).join("; ")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{Math.round(Number(r.confidence) * 100)}%</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusPill state={statusToState(r.status)}>{r.status.replace(/_/g, " ")}</StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Start outreach</CardTitle>
          <CardDescription>{selected.length} selected.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="channel">Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                <SelectTrigger id="channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="in_app">In-app notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg">Message</Label>
              <Textarea id="msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => outreach.mutate()} disabled={selected.length === 0 || outreach.isPending}>
              {outreach.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />} Send outreach
            </Button>
            <PrototypeBadge label="Outreach delivery is simulated — no real SMS or email is sent" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
