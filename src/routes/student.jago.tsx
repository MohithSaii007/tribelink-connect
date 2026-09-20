import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Eraser, Loader2, Send, Sparkle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PrototypeBadge } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { clearChatHistory, getChatHistory, jagoChat } from "@/lib/tribalink.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/jago")({
  head: () => ({
    meta: [
      { title: "JAGO — Your AI Scholarship Assistant · TRIBALINK" },
      { name: "description", content: "Ask JAGO about your scholarship status, pending documents, eligibility and DBT payment. Answers come from your own record, in English, Hindi or Telugu." },
      { property: "og:title", content: "JAGO — Your AI Scholarship Assistant" },
      { property: "og:description", content: "Grounded answers from your own scholarship record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jago,
});

const SUGGESTIONS = [
  "What is the status of my scholarship?",
  "Which documents are still pending?",
  "Am I eligible for the Post-Matric scholarship?",
  "When will my money be credited?",
];

const LANGS = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "te", label: "తెలుగు" },
] as const;

function Jago() {
  const historyFn = useServerFn(getChatHistory);
  const chatFn = useServerFn(jagoChat);
  const clearFn = useServerFn(clearChatHistory);
  const [lang, setLang] = useState<"en" | "hi" | "te">("en");
  const [input, setInput] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const history = useQuery({ queryKey: ["jago-history"], queryFn: () => historyFn({}) });

  const ask = useMutation({
    mutationFn: (question: string) => chatFn({ data: { question, lang } }),
    onSuccess: () => {
      setPendingQuestion(null);
      void history.refetch();
    },
    onError: () => {
      setPendingQuestion(null);
      toast.error("JAGO is unavailable for a moment. Please try again — your data is safe.");
    },
  });

  const clear = useMutation({
    mutationFn: () => clearFn({}),
    onSuccess: () => void history.refetch(),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.data, pendingQuestion]);

  function send(question: string) {
    const q = question.trim();
    if (!q || ask.isPending) return;
    setInput("");
    setPendingQuestion(q);
    ask.mutate(q);
  }

  const messages = history.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="JAGO — Your AI Scholarship Assistant"
        description="JAGO answers from your own TRIBALINK record and the configured scheme knowledge base. It never invents government rules."
        actions={
          <>
            <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
              <SelectTrigger className="w-36" aria-label="Answer language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => clear.mutate()} disabled={clear.isPending || messages.length === 0}>
              <Eraser className="size-4" aria-hidden /> Clear chat
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex h-[58vh] flex-col gap-4 pt-6">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1" role="log" aria-live="polite">
            {messages.length === 0 && !pendingQuestion ? (
              <div className="rounded-lg border border-border bg-surface/60 p-5">
                <p className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                  <Sparkle className="size-5 text-accent" aria-hidden /> Namaste! I am JAGO.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask me anything about your scholarship — I read your actual profile, documents, applications and payment record
                  before answering.
                </p>
              </div>
            ) : null}

            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-surface/60 text-foreground",
                  )}
                >
                  {m.message}
                </div>
              </div>
            ))}

            {pendingQuestion ? (
              <>
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground">{pendingQuestion}</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> JAGO is checking your record…
                </div>
              </>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button key={s} size="sm" variant="outline" onClick={() => send(s)} disabled={ask.isPending}>
                {s}
              </Button>
            ))}
          </div>

          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your status, documents, eligibility or payment…"
              rows={2}
              className="resize-none"
              aria-label="Your question for JAGO"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={ask.isPending || !input.trim()} aria-label="Send question">
              {ask.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            </Button>
          </form>
          <PrototypeBadge label="Answers are grounded in your TRIBALINK record. Scheme facts come from the configured knowledge base." />
        </CardContent>
      </Card>
    </div>
  );
}
