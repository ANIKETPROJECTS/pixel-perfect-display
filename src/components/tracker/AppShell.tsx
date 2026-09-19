import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  TrainFront,
  UserRoundCog,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { useTracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  to?: "/" | "/reports" | "/admin";
};

const operations: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", to: "/" },
];

const reporting: NavItem[] = [
  { label: "Daily compliance", icon: FileBarChart, href: "/reports#daily", to: "/reports" },
  { label: "Monthly performance", icon: BarChart3, href: "/reports#monthly", to: "/reports" },
  { label: "HRMS export", icon: ClipboardList, href: "/reports#hrms-export", to: "/reports" },
  { label: "Flagged work log", icon: ShieldCheck, href: "/reports#flagged-work", to: "/reports" },
];

const administration: NavItem[] = [
  { label: "Employees", icon: Users, href: "/admin#employees", to: "/admin" },
  { label: "Departments", icon: Building2, href: "/admin#departments", to: "/admin" },
  { label: "Job types", icon: Wrench, href: "/admin#job-types", to: "/admin" },
  { label: "Shifts", icon: Clock3, href: "/admin#shifts", to: "/admin" },
  { label: "Supervisors", icon: UserRoundCog, href: "/admin#supervisors", to: "/admin" },
  { label: "Attendance", icon: CalendarDays, href: "/admin#attendance", to: "/admin" },
  { label: "Audit trail", icon: ClipboardList, href: "/admin#audit", to: "/admin" },
];

const supervisorTools: NavItem[] = [
  { label: "Employee registration", icon: Users, href: "/admin#employees", to: "/admin" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { role, supervisorId, setSupervisorId, state, authUser, logout } = useTracker();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleAdmin = role === "admin";
  const visibleReporting = visibleAdmin
    ? reporting
    : reporting.filter((item) => item.label !== "Flagged work log");

  const groups = [
    { label: "Operations", items: operations },
    { label: "Reporting", items: visibleReporting },
    ...(role === "supervisor" ? [{ label: "Supervisor", items: supervisorTools }] : []),
    ...(visibleAdmin ? [{ label: "Administration", items: administration }] : []),
  ];

  const isActive = (item: NavItem) => {
    if (item.href === "/") return location.pathname === "/";
    if (item.href.startsWith("/admin")) return location.pathname === "/admin";
    return location.pathname === "/reports";
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarGroups groups={groups} isActive={isActive} />
        </div>
        <p className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
          Railway station operations
        </p>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Brand compact />
              <button
                aria-label="Close navigation"
                className="inline-flex size-11 items-center justify-center rounded-md border border-input"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarGroups groups={groups} isActive={isActive} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur md:ml-64">
        <div className="flex min-h-[68px] items-center gap-3 px-4 py-3 md:px-6">
          <button
            aria-label="Open navigation"
            className="inline-flex size-11 items-center justify-center rounded-md border border-input md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
              Workforce operations
            </p>
            <h1 className="truncate text-base font-semibold leading-tight">
              {location.pathname === "/admin"
                ? role === "admin"
                  ? "Administration"
                  : "Supervisor workspace"
                : location.pathname === "/reports"
                  ? "Reports & exports"
                  : "Today's operations"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {role === "supervisor" && (
              <select
                aria-label="Acting supervisor"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="h-11 max-w-[140px] rounded-md border border-input bg-card px-2 text-sm"
              >
                {state.supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            <span className="hidden rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium sm:inline-flex">
              {role === "admin" ? "Admin" : "Supervisor"}
            </span>
            <span className="hidden max-w-[220px] truncate text-xs text-muted-foreground lg:inline">
              {authUser?.email}
            </span>
            <button
              onClick={logout}
              className="inline-flex min-h-11 items-center gap-1 rounded-md border border-input px-3 text-sm font-semibold"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-4 md:ml-64 md:px-8 md:py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card md:hidden">
        <div className="mx-auto flex max-w-5xl">
          <BottomLink href="/" to="/" icon={ClipboardCheck} label="Dashboard" active={location.pathname === "/"} />
          <BottomLink
            href="/reports#daily"
            to="/reports"
            icon={BarChart3}
            label="Reports"
            active={location.pathname === "/reports"}
          />
          {visibleAdmin && (
            <BottomLink
              href="/admin#employees"
              to="/admin"
              icon={Settings}
              label="Admin"
              active={location.pathname === "/admin"}
            />
          )}
        </div>
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 px-5 py-5", compact && "px-0 py-0")}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <TrainFront className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">Platform Workforce</p>
        <p className="truncate text-xs text-muted-foreground">Indian Railways</p>
      </div>
    </div>
  );
}

function SidebarGroups({
  groups,
  isActive,
  onNavigate,
}: {
  groups: { label: string; items: NavItem[] }[];
  isActive: (item: NavItem) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-6" aria-label="Module navigation">
      {groups.map((group) => (
        <section key={group.label} aria-labelledby={`nav-${group.label}`}>
          <p
            id={`nav-${group.label}`}
            className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const className = cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                isActive(item)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              );
              return item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  href={item.href}
                  className={className}
                  onClick={onNavigate}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              ) : (
                <a key={item.label} href={item.href} className={className} onClick={onNavigate}>
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function BottomLink({
  href,
  to,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  to: "/" | "/reports" | "/admin";
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      href={href}
      className={cn(
        "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </Link>
  );
}