import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, PrototypeBadge } from "@/components/tribalink/primitives";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/student/help")({
  head: () => ({
    meta: [
      { title: "Help & Guidance · TRIBALINK" },
      { name: "description", content: "Answers to common questions about tribal scholarship eligibility, documents, verification, deficiencies and DBT payments." },
      { property: "og:title", content: "Help & Guidance · TRIBALINK" },
      { property: "og:description", content: "Common scholarship questions answered." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Help,
});

const FAQ = [
  {
    q: "Why does TRIBALINK ask for my details only once?",
    a: "Your unified profile is reused by every scheme. When you apply, the form is pre-filled and only scheme-specific answers remain.",
  },
  {
    q: "What does 'Potentially eligible' mean?",
    a: "It means a rule could not be confirmed automatically — usually a missing document or an unverified figure. It is never a rejection; a nodal officer reviews it.",
  },
  {
    q: "A document was flagged with a mismatch. What now?",
    a: "Open Documents, read the explanation, and either replace the document with a corrected copy or use 'Send for manual review' so an officer can decide.",
  },
  {
    q: "Can I hold more than one scholarship at a time?",
    a: "The configured rule is one scholarship at a time. TRIBALINK detects an existing active benefit and asks for verification instead of rejecting you.",
  },
  {
    q: "When will the money reach my bank?",
    a: "After sanction, payment moves through initiation, bank processing and credit. You can follow every step on the Payments page.",
  },
  {
    q: "Is my data shared with government systems?",
    a: "No. This is a prototype. All registry integrations, OCR results and payments are simulated and clearly labelled.",
  },
];

function Help() {
  return (
    <div className="space-y-6">
      <PageHeader title="Help & guidance" description="Short, practical answers. For anything specific to your file, ask JAGO." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frequently asked questions</CardTitle>
          <CardDescription>Based on the configured scheme knowledge base.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Still stuck?</CardTitle>
          <CardDescription>JAGO reads your own record before answering.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/student/jago">Ask JAGO</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/student/verification">Check my verification</Link>
          </Button>
        </CardContent>
      </Card>

      <PrototypeBadge />
    </div>
  );
}
