import { Link } from "@tanstack/react-router";
import { ClipboardCheck, BarChart3, Settings, TrainFront } from "lucide-react";
import { useTracker } from "@/lib/tracker-store";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { role, setRole, supervisorId, setSupervisorId, state } = useTracker();

  const tabs = [
    { to: "/", label: "Dashboard", icon: ClipboardCheck },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    ...(role === "admin" ? [{ to: "/admin", label: "Admin", icon: Settings }] : []),
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <TrainFront className="size-6 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">
              Platform Workforce Tracker
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Housekeeping compliance · Indian Railways
            </p>
          </div>
          <div className="flex items-center gap-2">
            {role === "supervisor" && (
              <select
                aria-label="Acting supervisor"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="h-11 rounded-md border border-input bg-card px-2 text-sm"
              >
                {state.supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "supervisor")}
              className="h-11 rounded-md border border-input bg-card px-2 text-sm font-medium"
            >
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
        <div className="mx-auto flex max-w-5xl">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium"
            >
              <t.icon className="size-5" aria-hidden />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
