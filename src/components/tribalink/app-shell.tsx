import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardCheck,
  FileStack,
  FileText,
  GraduationCap,
  HelpCircle,
  IndianRupee,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquareHeart,
  Radar,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkle,
  User,
  Users,
  X,
} from "lucide-react";

import { PrototypeBadge } from "@/components/tribalink/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-session";
import { signOut } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; mobile?: boolean };

export const STUDENT_NAV: NavItem[] = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { to: "/student/profile", label: "My Profile", icon: User },
  { to: "/student/scholarships", label: "Scholarships", icon: GraduationCap, mobile: true },
  { to: "/student/applications", label: "My Applications", icon: FileText, mobile: true },
  { to: "/student/documents", label: "Documents", icon: FileStack },
  { to: "/student/verification", label: "Verification", icon: ShieldCheck },
  { to: "/student/payments", label: "Payments", icon: IndianRupee },
  { to: "/student/notifications", label: "Notifications", icon: Bell },
  { to: "/student/jago", label: "JAGO Assistant", icon: MessageSquareHeart, mobile: true },
  { to: "/student/help", label: "Help", icon: HelpCircle },
  { to: "/student/settings", label: "Settings", icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/applications", label: "Applications", icon: FileText, mobile: true },
  { to: "/admin/verification", label: "Verification", icon: ShieldCheck },
  { to: "/admin/review", label: "Manual Review", icon: ClipboardCheck, mobile: true },
  { to: "/admin/beneficiary-gaps", label: "Beneficiary Gaps", icon: Radar, mobile: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/schemes", label: "Schemes", icon: ListChecks },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  nav,
  role,
  title,
  children,
  unread = 0,
}: {
  nav: NavItem[];
  role: "student" | "admin";
  title: string;
  children: ReactNode;
  unread?: number;
}) {
  const userId = useAuthUser();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (userId === null) {
      void navigate({ to: "/auth", search: { mode: "login", next: pathname } });
    }
  }, [userId, navigate, pathname]);

  useEffect(() => setOpen(false), [pathname]);

  if (userId === undefined || userId === null) {
    return (
      <div className="min-h-screen bg-surface p-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  const mobileItems = nav.filter((n) => n.mobile).slice(0, 4);

  return (
    <div className="min-h-screen bg-surface">
      <div className="gov-stripe h-1 w-full" />
      <div className="mx-auto flex w-full max-w-[1600px]">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Section navigation"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <GraduationCap className="size-5" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-base font-bold">TRIBALINK</span>
                <span className="block text-[10px] uppercase tracking-wider opacity-75">
                  {role === "admin" ? "Ministry Console" : "Student Portal"}
                </span>
              </span>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="size-5" aria-hidden />
            </Button>
          </div>
          <nav className="space-y-1 px-3 pb-6">
            {nav.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="size-4.5 shrink-0" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {item.to.endsWith("/notifications") && unread > 0 ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">{unread}</span>
                  ) : null}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4.5" aria-hidden /> Logout
            </button>
          </nav>
          <div className="px-4 pb-6">
            <PrototypeBadge />
          </div>
        </aside>

        {open ? (
          <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
        ) : null}

        {/* Main */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="size-5" aria-hidden />
            </Button>
            <p className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-foreground">{title}</p>
            <Button asChild variant="ghost" size="icon" aria-label="Notifications">
              <Link to={role === "admin" ? "/admin/dashboard" : "/student/notifications"} className="relative">
                <Bell className="size-5" aria-hidden />
                {unread > 0 ? (
                  <span className="absolute right-1 top-1 size-2 rounded-full bg-accent" aria-hidden />
                ) : null}
              </Link>
            </Button>
            {role === "student" ? (
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/student/jago">
                  <Sparkle className="size-4" aria-hidden /> Ask JAGO
                </Link>
              </Button>
            ) : null}
          </header>
          <main id="main" className="px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background lg:hidden"
        aria-label="Quick navigation"
      >
        {mobileItems.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export { BookOpen };
