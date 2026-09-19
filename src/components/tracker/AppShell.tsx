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
  LogOut,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  UserRoundCog,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { useTracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";
import { RailOpsMark } from "./RailOpsMark";

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
  const { role, state, authUser, logout } = useTracker();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const visibleAdmin = role === "admin";
  const visibleReporting = visibleAdmin
    ? reporting
    : reporting.filter((item) => item.label !== "Flagged work log");
  const supervisorName =
    state.supervisors.find((supervisor) => supervisor.id === authUser?.supervisorId)?.name ??
    (role === "supervisor" ? "R. Kulkarni" : "Administrator");
  const profileName = role === "supervisor" ? supervisorName : "Administrator";

  const groups = [
    { label: "Operations", items: operations },
    { label: "Reporting", items: visibleReporting },
    ...(role === "supervisor" ? [{ label: "Supervisor", items: supervisorTools }] : []),
    ...(visibleAdmin ? [{ label: "Administration", items: administration }] : []),
  ];

  const isActive = (item: NavItem) => {
    if (item.href === "/") return location.pathname === "/";
    if (item.href.startsWith("/admin")) return location.pathname === "/admin";
    if (item.href.startsWith("/reports")) {
      const targetHash = item.href.split("#")[1] ?? "daily";
      const currentHash = location.hash.replace(/^#/, "");
      return location.pathname === "/reports" && (currentHash ? currentHash === targetHash : targetHash === "daily");
    }
    return location.pathname === "/reports";
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
          sidebarCollapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className={cn("border-b border-border", sidebarCollapsed ? "px-2 py-3" : "px-4 py-4")}>
          <Brand collapsed={sidebarCollapsed} />
        </div>
        <button
          type="button"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          className="absolute right-0 top-7 z-40 inline-flex size-7 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="size-3.5" aria-hidden />
          ) : (
            <PanelLeftClose className="size-3.5" aria-hidden />
          )}
        </button>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarGroups groups={groups} isActive={isActive} collapsed={sidebarCollapsed} />
        </div>
        <SidebarAccount
          displayName={profileName}
          role={role}
          email={authUser?.email}
          collapsed={sidebarCollapsed}
          profileOpen={profileOpen}
          onToggleProfile={() => setProfileOpen((open) => !open)}
          onLogout={logout}
        />
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
              <Brand />
              <button
                aria-label="Close navigation"
                className="inline-flex size-11 items-center justify-center rounded-md border border-input"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarGroups
                groups={groups}
                isActive={isActive}
                onNavigate={() => setMobileOpen(false)}
                collapsed={false}
              />
            </div>
            <SidebarAccount
              displayName={profileName}
              role={role}
              email={authUser?.email}
              collapsed={false}
              profileOpen={profileOpen}
              onToggleProfile={() => setProfileOpen((open) => !open)}
              onLogout={() => {
                setMobileOpen(false);
                logout();
              }}
            />
          </aside>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur transition-[margin] duration-200",
          sidebarCollapsed ? "md:ml-[76px]" : "md:ml-64",
        )}
      >
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
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {profileName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="hidden text-left sm:block">
                <p className="max-w-[180px] truncate text-sm font-semibold">{profileName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {role === "admin" ? "Administrator" : "Supervisor"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto max-w-[1440px] px-4 py-4 transition-[margin] duration-200 md:px-8 md:py-6",
          sidebarCollapsed ? "md:ml-[76px]" : "md:ml-64",
        )}
      >
        {children}
      </main>

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

function SidebarAccount({
  displayName,
  role,
  email,
  collapsed,
  profileOpen,
  onToggleProfile,
  onLogout,
}: {
  displayName: string;
  role: "admin" | "supervisor";
  email: string | undefined;
  collapsed: boolean;
  profileOpen: boolean;
  onToggleProfile: () => void;
  onLogout: () => void;
}) {
  return (
    <div className={cn("border-t border-border", collapsed ? "p-2" : "p-3")}>
      {profileOpen && !collapsed && (
        <div className="mb-2 rounded-lg border border-border bg-muted/50 p-3 text-xs">
          <p className="font-semibold text-foreground">{displayName}</p>
          <p className="mt-1 text-muted-foreground">{role === "admin" ? "Administrator" : "Supervisor"}</p>
          {email && <p className="mt-1 truncate text-muted-foreground">{email}</p>}
        </div>
      )}
      <div className="space-y-1">
        <button
          type="button"
          onClick={onToggleProfile}
          aria-expanded={profileOpen}
          title={collapsed ? "Profile" : undefined}
          className={cn(
            "flex items-center rounded-md font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed
              ? "mx-auto size-12 justify-center"
              : "min-h-11 w-full gap-3 px-3 text-[15px]",
          )}
        >
          <UserRound className="size-5 shrink-0" aria-hidden />
          {!collapsed && <span>Profile</span>}
        </button>
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center rounded-md font-medium text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger",
            collapsed
              ? "mx-auto size-12 justify-center"
              : "min-h-11 w-full gap-3 px-3 text-[15px]",
          )}
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
      {!collapsed && (
        <p className="mt-3 px-3 text-xs text-muted-foreground">Railway station operations</p>
      )}
    </div>
  );
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", collapsed && "justify-center")}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <RailOpsMark className="size-6" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-base font-bold">RailsOps Workforce</p>
          <p className="truncate text-sm text-muted-foreground">Station Operations Hub</p>
        </div>
      )}
    </div>
  );
}

function SidebarGroups({
  groups,
  isActive,
  onNavigate,
  collapsed,
}: {
  groups: { label: string; items: NavItem[] }[];
  isActive: (item: NavItem) => boolean;
  onNavigate?: () => void;
  collapsed: boolean;
}) {
  return (
    <nav className={cn("space-y-6", collapsed && "space-y-5")} aria-label="Module navigation">
      {groups.map((group) => (
        <section key={group.label} aria-labelledby={`nav-${group.label}`}>
          <p
            id={`nav-${group.label}`}
            className={cn(
              "mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground",
              collapsed && "sr-only",
            )}
          >
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const className = cn(
                "font-medium transition-colors",
                collapsed
                  ? "mx-auto flex size-12 items-center justify-center rounded-lg"
                  : "flex min-h-12 items-center gap-3 rounded-md px-3 text-[15px]",
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
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("shrink-0", collapsed ? "size-6" : "size-5")} aria-hidden />
                  {!collapsed && item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className={className}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("shrink-0", collapsed ? "size-6" : "size-5")} aria-hidden />
                  {!collapsed && item.label}
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