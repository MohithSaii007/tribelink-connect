import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { ADMIN_NAV, AppShell } from "@/components/tribalink/app-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Ministry Console · TRIBALINK" },
      { name: "description", content: "Ministry and nodal officer console for tribal scholarship verification, analytics, scheme management and beneficiary-gap intelligence." },
      { property: "og:title", content: "Ministry Console · TRIBALINK" },
      { property: "og:description", content: "Verification, analytics and outreach for tribal scholarships." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = ADMIN_NAV.find((n) => pathname.startsWith(n.to));

  return (
    <AppShell nav={ADMIN_NAV} role="admin" title={active?.label ?? "Ministry Console"}>
      <Outlet />
    </AppShell>
  );
}
