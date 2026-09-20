import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  FileCheck2,
  FolderLock,
  GraduationCap,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  MessageSquareHeart,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkle,
  Users,
} from "lucide-react";

import heroImage from "@/assets/hero-students.jpg";
import { PrototypeBadge } from "@/components/tribalink/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { INR, rulesOf } from "@/lib/intel";
import { listPublicSchemes } from "@/lib/tribalink.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRIBALINK — One Student. One Scholarship View. One Connected Platform." },
      {
        name: "description",
        content:
          "TRIBALINK is a unified digital platform that simplifies tribal scholarship discovery, application, verification, tracking and beneficiary intelligence for ST students across five national schemes.",
      },
      { property: "og:title", content: "TRIBALINK — Unified Tribal Scholarship Platform" },
      {
        property: "og:description",
        content:
          "Verify once, reuse everywhere. Unified scholarship discovery, AI eligibility, smart verification, DBT tracking and beneficiary-gap intelligence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Loaded on the server with the page itself, so the scheme cards are already
  // in the HTML instead of appearing after a second request.
  loader: () => listPublicSchemes(),
  component: Landing,
});

const PIPELINE = ["Profile", "Eligibility", "Documents", "Verification", "Application", "Sanction", "DBT"];

const PROBLEMS = [
  { icon: Building2, title: "Fragmented systems", body: "NSP, SFMP and the Overseas portal each hold a different slice of the same student." },
  { icon: FolderLock, title: "Repeated submissions", body: "The same ST certificate, income proof and marksheet are uploaded again and again." },
  { icon: ScanSearch, title: "Opaque tracking", body: "Students rarely know which desk their file is sitting on, or why." },
  { icon: FileCheck2, title: "Manual verification", body: "Officers re-key and re-check data that already exists in authoritative registries." },
  { icon: BarChart3, title: "No unified benefit view", body: "Nobody can see a student's complete scholarship picture in one place." },
  { icon: Radar, title: "Unreached beneficiaries", body: "Eligible enrolled ST students never apply, and no system flags them." },
];

const FEATURES = [
  { icon: LayoutDashboard, title: "Unified Scholarship Dashboard", body: "Every scheme, application, document and payment on one screen." },
  { icon: Sparkle, title: "AI Eligibility Engine", body: "Configurable rules evaluated field by field, with a reason for every outcome." },
  { icon: FolderLock, title: "Digital Document Wallet", body: "Upload once, reuse across all five schemes. Verify once, reuse everywhere." },
  { icon: ShieldCheck, title: "Smart Verification", body: "Identity, ST status, income, academics, institution and bank cross-checked together." },
  { icon: MessageSquareHeart, title: "JAGO AI Assistant", body: "Answers grounded in the student's own record, in English, Hindi and Telugu." },
  { icon: FileCheck2, title: "Application Tracking", body: "A real timeline from submission through sanction to credit." },
  { icon: IndianRupee, title: "DBT Monitoring", body: "Sanction amount, transaction reference and bank status in plain language." },
  { icon: Radar, title: "Beneficiary Intelligence", body: "Surface enrolled ST students who are potentially eligible but unreached." },
];

const STEPS = ["Create Profile", "Check Eligibility", "Upload Documents", "Verify Information", "Apply", "Track", "Receive Scholarship"];

function Landing() {
  const schemes = Route.useLoaderData();
  const isPending = false;


  return (
    <div className="min-h-screen bg-background">
      <div className="gov-stripe h-1.5 w-full" />

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6" aria-label="Main">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-bold tracking-tight text-foreground">TRIBALINK</span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Ministry of Tribal Affairs · SIH 2026</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="#schemes">Schemes</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Student Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "register" }}>
                Register
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="border-b border-border bg-surface">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div>
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Landmark className="size-3.5" aria-hidden /> Problem Statement SIH26238 · Smart Automation
              </Badge>
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                TRIBALINK
              </h1>
              <p className="mt-3 font-display text-xl font-semibold text-primary sm:text-2xl">
                One Student. One Scholarship View. One Connected Platform.
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                A unified digital platform that simplifies tribal scholarship discovery, application, verification, tracking and
                beneficiary intelligence — built on one principle: <strong className="text-foreground">verify once, reuse everywhere.</strong>
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">
                    Student Login <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth" search={{ mode: "register" }}>
                    Register
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <a href="#schemes">Explore Scholarships</a>
                </Button>
              </div>
              <div className="mt-7 rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo credentials</p>
                <div className="mt-2 grid gap-1 font-mono text-sm text-foreground sm:grid-cols-2">
                  <span>student@tribalink.demo · TribaLink#2026s</span>
                  <span>admin@tribalink.demo · TribaLink#2026a</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Tribal students studying together with notebooks and a tablet"
                className="aspect-[16/11] w-full rounded-xl border border-border object-cover shadow-panel"
                loading="eager"
              />
              <div className="absolute -bottom-5 left-5 right-5 rounded-lg border border-border bg-card/95 p-3 backdrop-blur sm:left-8 sm:right-auto">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unified across</p>
                <p className="text-sm font-semibold text-foreground">NSP · SFMP · National Overseas Scholarship Portal</p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-foreground">Why tribal scholarships get lost in the gaps</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The benefit exists. The student exists. The systems that should connect them do not talk to each other.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((p) => (
              <Card key={p.title}>
                <CardHeader className="gap-2">
                  <p.icon className="size-5 text-accent" aria-hidden />
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <CardDescription>{p.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Solution pipeline */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <h2 className="font-display text-3xl font-bold text-foreground">One connected journey</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              A single unified profile flows through every stage. The student never re-enters what TRIBALINK already knows.
            </p>
            <ol className="mt-8 flex flex-wrap items-center gap-2">
              {PIPELINE.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="rounded-md border border-primary/25 bg-primary/8 px-3 py-2 text-sm font-semibold text-primary">
                    {s}
                  </span>
                  {i < PIPELINE.length - 1 ? <ArrowRight className="size-4 text-muted-foreground" aria-hidden /> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Schemes */}
        <section id="schemes" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-foreground">Five schemes, one platform</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Rules, income ceilings and required documents are configured in the platform, not hard-coded — so policy changes do not
            need a new release.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isPending
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)
              : (schemes ?? []).map((s) => {
                  const r = rulesOf(s);
                  return (
                    <Card key={s.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{s.short_name}</CardTitle>
                          <Badge variant={s.status === "open" ? "default" : "secondary"}>
                            {s.status === "open" ? "Open" : "Closed"}
                          </Badge>
                        </div>
                        <CardDescription>{s.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Target:</span> {s.target}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Income ceiling:</span>{" "}
                          {r.max_income ? INR(r.max_income) : "Not applicable"}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Indicative award:</span> {INR(Number(s.award_amount))}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Documents:</span> {s.required_documents.length} required
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <h2 className="font-display text-3xl font-bold text-foreground">What TRIBALINK does</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <Card key={f.title}>
                  <CardHeader className="gap-2">
                    <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
                      <f.icon className="size-4.5" aria-hidden />
                    </span>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                    <CardDescription>{f.body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-foreground">How it works</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s} className="rounded-lg border border-border bg-card p-4">
                <span className="font-display text-2xl font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-1 font-semibold text-foreground">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-5">
            <BadgeCheck className="size-6 text-success" aria-hidden />
            <p className="flex-1 text-sm text-muted-foreground">
              TRIBALINK never auto-rejects a student. Its intelligence layer detects, explains, flags and recommends — an authorised
              human officer makes every final verification decision.
            </p>
            <Button asChild>
              <Link to="/auth" search={{ mode: "register" }}>
                <Users className="size-4" aria-hidden /> Create your profile
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div>
            <p className="font-display text-lg font-bold">TRIBALINK</p>
            <p className="mt-2 text-sm opacity-80">
              A unified scholarship, verification and beneficiary intelligence platform built for the Ministry of Tribal Affairs
              problem statement SIH26238.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Schemes</p>
            <ul className="mt-2 space-y-1 text-sm opacity-80">
              <li>Pre-Matric Scholarship</li>
              <li>Post-Matric Scholarship</li>
              <li>Top Class Education</li>
              <li>National Fellowship (NFST)</li>
              <li>National Overseas Scholarship</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Platform</p>
            <ul className="mt-2 space-y-1 text-sm opacity-80">
              <li>
                <Link to="/auth" className="hover:underline">
                  Student login
                </Link>
              </li>
              <li>
                <Link to="/auth" search={{ mode: "register" }} className="hover:underline">
                  Register
                </Link>
              </li>
              <li>
                <a href="/api/integrations/digilocker" className="hover:underline">
                  Integration layer (mock)
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Contact &amp; help</p>
            <ul className="mt-2 space-y-1 text-sm opacity-80">
              <li>support@tribalink.demo</li>
              <li>Prototype helpdesk — SIH 2026</li>
              <li>Privacy: no real identity or bank data is stored.</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sidebar-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs opacity-85 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <PrototypeBadge />
            <p className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" aria-hidden /> All integrations, payments and datasets shown are simulated prototype data.
              TRIBALINK has no live access to DigiLocker, UIDAI, UDISE+, APAAR, AISHE, NSP, SFMP or DBT systems.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
