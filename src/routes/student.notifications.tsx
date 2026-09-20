import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, LoadingPanel, PageHeader, StatusPill, statusToState } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { markNotifications } from "@/lib/tribalink.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · TRIBALINK" },
      { name: "description", content: "Application, verification, deficiency, sanction and DBT updates for your tribal scholarship." },
      { property: "og:title", content: "Notifications · TRIBALINK" },
      { property: "og:description", content: "Every scholarship update in one feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { data, isPending } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const fn = useServerFn(markNotifications);

  const mark = useMutation({
    mutationFn: (input: { id?: string; all?: boolean }) => fn({ data: input }),
    onSuccess: () => refresh(),
    onError: () => toast.error("We couldn't update your notifications just now."),
  });

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" />
        <LoadingPanel />
      </div>
    );
  }

  const unread = data.notifications.filter((n) => !n.read_status).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread update${unread > 1 ? "s" : ""}.` : "No unread updates."}
        actions={
          <Button variant="outline" onClick={() => mark.mutate({ all: true })} disabled={!unread || mark.isPending}>
            <CheckCheck className="size-4" aria-hidden /> Mark all as read
          </Button>
        }
      />

      {data.notifications.length === 0 ? (
        <EmptyState title="You're all caught up" description="Updates about your applications, documents, verification and payments will appear here." icon={BellRing} />
      ) : (
        <ul className="space-y-3">
          {data.notifications.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-lg border p-4",
                n.read_status ? "border-border bg-card" : "border-primary/30 bg-primary/5",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{n.title}</p>
                <div className="flex items-center gap-2">
                  <StatusPill state={statusToState(n.type)}>{n.type.replace(/_/g, " ")}</StatusPill>
                  {!n.read_status ? (
                    <Button size="sm" variant="ghost" onClick={() => mark.mutate({ id: n.id })}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-IN")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
