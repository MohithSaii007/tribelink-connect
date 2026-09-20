import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PrototypeBadge } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut, useTribalinkSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Console Settings · TRIBALINK" },
      { name: "description", content: "Manage your Ministry console account, change your password and review notification templates." },
      { property: "og:title", content: "Console Settings · TRIBALINK" },
      { property: "og:description", content: "Officer account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminSettings,
});

const TEMPLATES = [
  { name: "Application submitted", body: "Your {{scheme}} application {{reference}} has been submitted and sent for institution verification." },
  { name: "Document deficiency", body: "A mismatch was found in your {{document}}. Please upload a corrected copy or request manual review." },
  { name: "Sanction", body: "Your {{scheme}} scholarship of {{amount}} has been sanctioned. DBT processing will begin shortly." },
  { name: "DBT credited", body: "{{amount}} has been credited to your DBT-seeded account ending {{account}}." },
  { name: "Outreach", body: "You may be eligible for a Ministry of Tribal Affairs scholarship. Visit TRIBALINK to check and apply." },
];

function AdminSettings() {
  const session = useTribalinkSession();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Please choose a password of at least 8 characters.");
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
    toast.success("Password updated.");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Console settings" description="Your officer account and the notification templates used across the platform." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Signed in to the Ministry console.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="text-muted-foreground">Email</p>
          <p className="font-semibold text-foreground">{session.data?.profile?.email ?? "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification templates</CardTitle>
          <CardDescription>Used for in-app, SMS and email messages. Placeholders are filled per student.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {TEMPLATES.map((t) => (
            <div key={t.name} className="rounded-md border border-border p-3">
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{t.body}</p>
            </div>
          ))}
          <PrototypeBadge label="SMS and email delivery are simulated in this prototype" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex max-w-md flex-col gap-3" onSubmit={change}>
            <div className="space-y-1.5">
              <Label htmlFor="a-pass">New password</Label>
              <Input id="a-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-fit">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />} Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => void signOut()}>
        <LogOut className="size-4" aria-hidden /> Log out
      </Button>
    </div>
  );
}
