import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { FileStack, Loader2, ShieldQuestion, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import {
  DemoDataBadge,
  EmptyState,
  LoadingPanel,
  PageHeader,
  PrototypeBadge,
  StatusPill,
  statusToState,
} from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { DOCUMENT_TYPES } from "@/lib/intel";
import { addDocument, deleteDocument, requestManualReview } from "@/lib/tribalink.functions";

export const Route = createFileRoute("/student/documents")({
  head: () => ({
    meta: [
      { title: "Document Wallet · TRIBALINK" },
      { name: "description", content: "Upload your certificates once and reuse them across every tribal scholarship scheme, with automatic field extraction and mismatch checks." },
      { property: "og:title", content: "Document Wallet · TRIBALINK" },
      { property: "og:description", content: "Verify once, reuse everywhere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Documents,
});

function Documents() {
  const { data, isPending } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>(DOCUMENT_TYPES[0]);
  const [lastOcr, setLastOcr] = useState<{ type: string; fields: Record<string, string>; mismatches: string[]; confidence: number } | null>(null);

  const addFn = useServerFn(addDocument);
  const delFn = useServerFn(deleteDocument);
  const reviewFn = useServerFn(requestManualReview);

  const upload = useMutation({
    mutationFn: (input: { doc_type: string; name: string; source: string; size?: number; mime?: string }) => addFn({ data: input }),
    onSuccess: (res) => {
      refresh();
      setLastOcr({ type: res.ocr.detectedType, fields: res.ocr.fields, mismatches: res.ocr.mismatches, confidence: res.ocr.confidence });
      if (res.ocr.mismatches.length) toast.warning("Document stored, but a mismatch was flagged for review.");
      else toast.success("Document stored and matched against your profile.");
    },
    onError: (e: Error) => toast.error(e.message || "We couldn't store that document. Please try again."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      refresh();
      toast.success("Document removed from your wallet.");
    },
    onError: () => toast.error("We couldn't remove that document."),
  });

  const manual = useMutation({
    mutationFn: (id: string) => reviewFn({ data: { documentId: id, note: "Student requested manual review of the flagged mismatch." } }),
    onSuccess: () => {
      refresh();
      toast.success("Sent for manual review by a nodal officer.");
    },
    onError: () => toast.error("We couldn't send this for review."),
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Please choose a file smaller than 5 MB.");
      return;
    }
    upload.mutate({ doc_type: docType, name: file.name, source: "upload", size: file.size, mime: file.type });
    e.target.value = "";
  }

  function importDigiLocker() {
    toast.success("DigiLocker connection successful — Prototype Mode");
    upload.mutate({ doc_type: docType, name: `${docType.replace(/[^a-z]/gi, "_")}_digilocker.pdf`, source: "digilocker", mime: "application/pdf" });
  }

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Documents" description="Opening your document wallet…" />
        <LoadingPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document wallet"
        description="Upload once, reuse across every scheme. Each upload is read, its fields extracted and compared with your unified profile."
      />
      <DemoDataBadge />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a document</CardTitle>
          <CardDescription>PDF, JPG, PNG or WEBP up to 5 MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="doc-type">Document type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UploadCloud className="size-4" aria-hidden />} Upload file
            </Button>
            <Button type="button" variant="outline" onClick={importDigiLocker} disabled={upload.isPending}>
              Import from DigiLocker
            </Button>
          </div>
          <input ref={fileRef} type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={onFile} aria-label="Choose a document to upload" />
          <PrototypeBadge label="DigiLocker import and document reading are simulated for this prototype" />

          {lastOcr ? (
            <div className="rounded-md border border-border bg-surface/60 p-4">
              <p className="text-sm font-semibold text-foreground">
                Extracted data — detected as {lastOcr.type} ({Math.round(lastOcr.confidence * 100)}% confidence)
              </p>
              <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {Object.entries(lastOcr.fields).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-border/60 py-1">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              {lastOcr.mismatches.length ? (
                <ul className="mt-3 space-y-1 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
                  {lastOcr.mismatches.map((m) => (
                    <li key={m}>⚠ {m}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-success">All extracted fields matched your unified profile.</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {data.documents.length === 0 ? (
        <EmptyState
          title="Your wallet is empty"
          description="Upload your ST certificate, income certificate and marksheet once — TRIBALINK will reuse them for every scheme you apply to."
          icon={FileStack}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.documents.map((d) => {
            const extracted = (d.extracted_data ?? {}) as Record<string, string>;
            return (
              <Card key={d.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{d.doc_type}</CardTitle>
                      <CardDescription className="truncate">{d.name}</CardDescription>
                    </div>
                    <StatusPill state={statusToState(d.verification_status)}>{d.verification_status.replace(/_/g, " ")}</StatusPill>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Source: {d.source === "digilocker" ? "DigiLocker (simulated)" : "Direct upload"} · Added{" "}
                    {new Date(d.created_at).toLocaleDateString("en-IN")}
                  </p>
                  <dl className="grid gap-x-6 gap-y-1">
                    {Object.entries(extracted)
                      .filter(([k]) => !k.startsWith("_"))
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 border-b border-border/60 py-1">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="font-medium text-foreground">{String(v)}</dd>
                        </div>
                      ))}
                  </dl>
                  {(d.mismatch_notes ?? []).length ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
                      {(d.mismatch_notes ?? []).map((m: string) => (
                        <p key={m}>⚠ {m}</p>
                      ))}
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => manual.mutate(d.id)} disabled={manual.isPending}>
                        <ShieldQuestion className="size-4" aria-hidden /> Send for manual review
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(d.id)} disabled={remove.isPending}>
                      <Trash2 className="size-4" aria-hidden /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
