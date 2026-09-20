import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { AppShell, STUDENT_NAV } from "@/components/tribalink/app-shell";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Portal · TRIBALINK" },
      { name: "description", content: "Your unified tribal scholarship workspace: eligibility, documents, applications, verification and DBT." },
      { property: "og:title", content: "Student Portal · TRIBALINK" },
      { property: "og:description", content: "Unified tribal scholarship workspace for ST students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentLayout,
});

function StudentLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useWorkspace();
  const unread = (data?.notifications ?? []).filter((n) => !n.read_status).length;
  const active = STUDENT_NAV.find((n) => pathname.startsWith(n.to));

  return (
    <AppShell nav={STUDENT_NAV} role="student" title={active?.label ?? "Student Portal"} unread={unread}>
      <Outlet />
    </AppShell>
  );
}
