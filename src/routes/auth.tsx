import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PrototypeBadge } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { seedDemoData } from "@/lib/seed.functions";
import { getStudentWorkspace, updateStudentProfile } from "@/lib/tribalink.functions";

function SeedButton() {
  const seed = useServerFn(seedDemoData);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="mt-3 w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await seed({});
          toast.success(res.message);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Demo data could not be loaded.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Load demo accounts and synthetic data
    </Button>
  );
}

const SearchSchema = z.object({
  mode: z.enum(["login", "register", "forgot", "reset"]).optional(),
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: SearchSchema,
  head: () => ({
    meta: [
      { title: "Sign in · TRIBALINK Scholarship Platform" },
      {
        name: "description",
        content:
          "Sign in or register on TRIBALINK to check scholarship eligibility, upload documents once, apply and track your tribal scholarship and DBT payment.",
      },
      { property: "og:title", content: "Sign in · TRIBALINK" },
      { property: "og:description", content: "Student and officer access to the unified tribal scholarship platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const STATES = [
  "Andhra Pradesh", "Assam", "Chhattisgarh", "Gujarat", "Jharkhand", "Karnataka", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Rajasthan", "Telangana",
  "Tripura", "West Bengal",
];

function AuthPage() {
  const { mode = "login", next } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && mode !== "reset") void routeAfterLogin(navigate, next);
    });
  }, [mode, navigate, next]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="gov-stripe h-1.5 w-full" />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:py-16">
        <div className="lg:flex-1">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">TRIBALINK</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One student. One scholarship view.
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Sign in to check your eligibility across all five tribal scholarship schemes, reuse your verified documents, and follow
            your payment right up to the bank credit.
          </p>
          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden /> Demo credentials
            </p>
            <div className="mt-2 grid gap-1 font-mono text-sm">
              <span>student@tribalink.demo · TribaLink#2026s</span>
              <span>admin@tribalink.demo · TribaLink#2026a</span>
            </div>
            <SeedButton />
          </div>
          <div className="mt-6">
            <PrototypeBadge />
          </div>
        </div>

        <div className="w-full lg:max-w-md">
          {mode === "register" ? (
            <RegisterCard next={next} />
          ) : mode === "forgot" ? (
            <ForgotCard />
          ) : mode === "reset" ? (
            <ResetCard />
          ) : (
            <LoginCard next={next} />
          )}
        </div>
      </div>
    </div>
  );
}

async function routeAfterLogin(navigate: ReturnType<typeof useNavigate>, next?: string) {
  if (next && next.startsWith("/")) {
    window.location.href = next;
    return;
  }
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  const { data: roles } = userId
    ? await supabase.from("user_roles").select("role").eq("user_id", userId)
    : { data: null };
  const staff = (roles ?? []).some(({ role }) => role === "admin" || role === "officer");
  window.location.href = staff ? "/admin/dashboard" : "/student/dashboard";
  void navigate;
}

function LoginCard({ next }: { next?: string | undefined }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("invalid")
          ? "That email and password combination didn't match. Please try again."
          : error.message,
      );
      return;
    }
    toast.success("Signed in. Loading your scholarship view…");
    await routeAfterLogin(navigate, next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your registered email address and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email address</Label>
            <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Sign in
          </Button>
          <div className="flex items-center justify-between text-sm">
            <Link to="/auth" search={{ mode: "forgot" }} className="text-primary hover:underline">
              Forgot password?
            </Link>
            <Link to="/auth" search={{ mode: "register" }} className="text-primary hover:underline">
              New student? Register
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("student@tribalink.demo");
                setPassword("TribaLink#2026s");
              }}
            >
              Fill student demo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("admin@tribalink.demo");
                setPassword("TribaLink#2026a");
              }}
            >
              Fill admin demo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function RegisterCard({ next }: { next?: string | undefined }) {
  const navigate = useNavigate();
  const loadWorkspace = useServerFn(getStudentWorkspace);
  const saveProfile = useServerFn(updateStudentProfile);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    state: "",
    district: "",
    st_status: true,
    pvtg_status: false,
    password: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Please choose a password of at least 6 characters.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { full_name: form.full_name, phone: form.phone },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "An account with this email already exists. Please sign in instead."
          : error.message,
      );
      return;
    }
    if (!data.session) {
      setBusy(false);
      toast.success("Account created. Please check your email to confirm, then sign in.");
      void navigate({ to: "/auth", search: { mode: "login" } });
      return;
    }
    try {
      await loadWorkspace({});
      await saveProfile({
        data: {
          full_name: form.full_name,
          phone: form.phone,
          email: form.email.trim(),
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          state: form.state || undefined,
          district: form.district || undefined,
          st_status: form.st_status,
          pvtg_status: form.pvtg_status,
        },
      });
    } catch {
      /* profile details can also be completed later from My Profile */
    }
    setBusy(false);
    toast.success("Welcome to TRIBALINK. Let's complete your profile.");
    await routeAfterLogin(navigate, next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student registration</CardTitle>
        <CardDescription>This creates your unified profile — you will only enter these details once.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="r-name">Full name</Label>
            <Input id="r-name" required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="r-phone">Mobile number</Label>
              <Input id="r-phone" inputMode="numeric" required value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-dob">Date of birth</Label>
              <Input id="r-dob" type="date" required value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-email">Email address</Label>
            <Input id="r-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="r-gender">Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger id="r-gender">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-state">State</Label>
              <Select value={form.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger id="r-state">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-district">District</Label>
            <Input id="r-district" value={form.district} onChange={(e) => set("district", e.target.value)} />
          </div>
          <div className="space-y-2 rounded-md border border-border p-3">
            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox checked={form.st_status} onCheckedChange={(v) => set("st_status", v === true)} />
              <span>I belong to a Scheduled Tribe (ST) community</span>
            </label>
            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox checked={form.pvtg_status} onCheckedChange={(v) => set("pvtg_status", v === true)} />
              <span>I belong to a Particularly Vulnerable Tribal Group (PVTG)</span>
            </label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-password">Password</Label>
            <Input
              id="r-password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">At least 8 characters. Stored only as a secure hash.</p>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Create my profile
          </Button>
          <p className="text-center text-sm">
            Already registered?{" "}
            <Link to="/auth" search={{ mode: "login" }} className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function ForgotCard() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We will email you a secure link to set a new password.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong className="text-foreground">{email}</strong>, a reset link is on its way. The link
              opens the password reset screen.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth" search={{ mode: "login" }}>
                Back to sign in
              </Link>
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="f-email">Email address</Label>
              <Input id="f-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Send reset link
            </Button>
            <p className="text-center text-sm">
              <Link to="/auth" search={{ mode: "login" }} className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function ResetCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Please choose a password of at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. Signing you in…");
    window.location.href = "/student/dashboard";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Open this page from the reset link in your email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="n-password">New password</Label>
            <Input id="n-password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-password">Confirm new password</Label>
            <Input id="c-password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
