import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PrototypeBadge } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "@/hooks/use-session";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/student/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings · TRIBALINK" },
      { name: "description", content: "Change your TRIBALINK password, review your account details and sign out securely." },
      { property: "og:title", content: "Account Settings · TRIBALINK" },
      { property: "og:description", content: "Manage your scholarship account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { data } = useWorkspace();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Please choose a password of at least 8 characters.");
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
    setPassword("");
    setConfirm("");
    toast.success("Password updated.");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your account and security preferences." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Signed in as a student.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-semibold text-foreground">{data?.student?.full_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-semibold text-foreground">{data?.profile?.email ?? data?.student?.email ?? "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/student/profile">Edit profile details</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
          <CardDescription>Passwords are stored only as secure hashes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid max-w-md gap-4" onSubmit={changePassword}>
            <div className="space-y-1.5">
              <Label htmlFor="s-pass">New password</Label>
              <Input id="s-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-confirm">Confirm new password</Label>
              <Input id="s-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-fit">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />} Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void signOut()}>
            <LogOut className="size-4" aria-hidden /> Log out
          </Button>
        </CardContent>
      </Card>

      <PrototypeBadge />
    </div>
  );
}
