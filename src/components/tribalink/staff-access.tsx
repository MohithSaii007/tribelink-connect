import { useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/**
 * The server rejects non-staff callers with "Forbidden: staff access only."
 * Surface that case as a clear, actionable message instead of a dead-end
 * loading error: the visitor is almost certainly signed in with the student
 * demo account and needs to switch to the Ministry account.
 */
export function isStaffForbidden(error: unknown): boolean {
  if (!error) return false;
  const text = typeof error === "string" ? error : ((error as { message?: string })?.message ?? String(error));
  return /staff access only|forbidden/i.test(text);
}

export function StaffAccessCard({
  error,
  onRetry,
  isFetching,
}: {
  error?: unknown;
  onRetry?: () => void;
  isFetching?: boolean;
}) {
  const [switching, setSwitching] = useState(false);

  if (isStaffForbidden(error)) {
    const switchAccount = async () => {
      setSwitching(true);
      try {
        await supabase.auth.signOut();
      } finally {
        window.location.href = "/auth";
      }
    };
    return (
      <div className="rounded-md border border-border bg-card p-5 text-sm">
        <p className="font-medium">Ministry account required</p>
        <p className="mt-2 text-muted-foreground">
          You are signed in with the student demo account. Sign out and sign in with the Ministry
          account (<span className="font-mono">admin@tribalink.demo</span>) to open this page.
        </p>
        <Button className="mt-4" size="sm" disabled={switching} onClick={() => void switchAccount()}>
          {switching ? "Switching account…" : "Switch to Ministry account"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-4 text-sm">
      <p>This page could not be loaded. Please try again.</p>
      {onRetry ? (
        <Button className="mt-3" size="sm" disabled={isFetching} onClick={onRetry}>
          {isFetching ? "Trying again…" : "Try again"}
        </Button>
      ) : null}
    </div>
  );
}
