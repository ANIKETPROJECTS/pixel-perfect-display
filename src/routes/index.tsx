import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { attKey, minutesOf, taskKey, type Employee } from "@/lib/tracker-data";
import { effectiveTaskStatus, useLookups, useTracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today's Round — Platform Workforce Tracker" },
      {
        name: "description",
        content:
          "One-screen daily marking: tap to confirm each scheduled cleaning task and mark attendance for every worker on the platform.",
      },
      { property: "og:title", content: "Today's Round — Platform Workforce Tracker" },
      {
        property: "og:description",
        content:
          "One-screen daily marking: tap to confirm each scheduled cleaning task and mark attendance for every worker on the platform.",
      },
    ],
  }),
  component: Dashboard,
});

type Filter = { kind: "all" } | { kind: "dept"; id: string } | { kind: "shift"; id: string } | { kind: "missed" };

function Dashboard() {
  const { state, role, supervisorId, today, now, toggleTask, setAttendance } = useTracker();
  const lk = useLookups();
  const [filter, setFilter] = useState<Filter>({ kind: "all" });

  const visibleDeptIds = useMemo(() => {
    if (role === "admin") return state.departments.map((d) => d.id);
    return lk.supervisor(supervisorId)?.departmentIds ?? [];
  }, [role, state.departments, lk, supervisorId]);

  const isMissedFor = (emp: Employee) => {
    const job = lk.job(emp.jobTypeId);
    return (job?.scheduledTimes ?? []).some(
      (t) =>
        effectiveTaskStatus(state.taskLogs[taskKey(emp.id, today, t)]?.status, t, true, now) ===
        "missed",
    );
  };

  const employees = state.employees.filter((e) => {
    if (e.status !== "active") return false;
    if (!visibleDeptIds.includes(e.departmentId)) return false;
    if (filter.kind === "dept") return e.departmentId === filter.id;
    if (filter.kind === "shift") return e.shiftId === filter.id;
    if (filter.kind === "missed") return isMissedFor(e);
    return true;
  });

  const grouped = visibleDeptIds
    .map((id) => ({ dept: lk.dept(id)!, list: employees.filter((e) => e.departmentId === id) }))
    .filter((g) => g.dept && g.list.length > 0);

  const overdueCount = state.employees
    .filter((e) => visibleDeptIds.includes(e.departmentId) && e.status === "active")
    .filter(isMissedFor).length;

  return (
    <div className="space-y-4">
      {overdueCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <span>
            <strong>{overdueCount}</strong> worker{overdueCount > 1 ? "s have" : " has"} an overdue
            task from today's schedule.
          </span>
        </div>
      )}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })}>
          All
        </Chip>
        <Chip active={filter.kind === "missed"} onClick={() => setFilter({ kind: "missed" })}>
          Missed only
        </Chip>
        {state.shifts.map((s) => (
          <Chip
            key={s.id}
            active={filter.kind === "shift" && filter.id === s.id}
            onClick={() => setFilter({ kind: "shift", id: s.id })}
          >
            {s.name}
          </Chip>
        ))}
        {visibleDeptIds.map((id) => (
          <Chip
            key={id}
            active={filter.kind === "dept" && filter.id === id}
            onClick={() => setFilter({ kind: "dept", id })}
          >
            {lk.dept(id)?.name}
          </Chip>
        ))}
      </div>

      {grouped.length === 0 && (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No workers match this filter.
        </p>
      )}

      {grouped.map(({ dept, list }) => (
        <section key={dept.id} className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {dept.name} · {dept.zone}
          </h2>
          <div className="space-y-2">
            {list.map((emp) => {
              const job = lk.job(emp.jobTypeId);
              const shift = lk.shift(emp.shiftId);
              const att = state.attendance[attKey(emp.id, today)]?.status ?? "present";
              const times = job?.scheduledTimes ?? [];
              const done = times.filter(
                (t) => state.taskLogs[taskKey(emp.id, today, t)]?.status === "completed",
              ).length;

              return (
                <article key={emp.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                      {emp.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{emp.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {emp.code} · {shift?.name} {shift?.start}–{shift?.end}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setAttendance(emp.id, today, "present")}
                        aria-pressed={att === "present"}
                        className={cn(
                          "min-h-11 rounded-md px-3 text-sm font-semibold",
                          att === "present"
                            ? "bg-success text-success-foreground"
                            : "bg-neutral-soft text-muted-foreground",
                        )}
                      >
                        P
                      </button>
                      <button
                        onClick={() => setAttendance(emp.id, today, "absent")}
                        aria-pressed={att === "absent"}
                        className={cn(
                          "min-h-11 rounded-md px-3 text-sm font-semibold",
                          att === "absent"
                            ? "bg-danger text-danger-foreground"
                            : "bg-neutral-soft text-muted-foreground",
                        )}
                      >
                        A
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {times.map((t) => {
                      const st = effectiveTaskStatus(
                        state.taskLogs[taskKey(emp.id, today, t)]?.status,
                        t,
                        true,
                        now,
                      );
                      const notDue = now > 0 && minutesOf(t) > now;
                      return (
                        <button
                          key={t}
                          onClick={() => toggleTask(emp.id, today, t)}
                          disabled={att === "absent"}
                          className={cn(
                            "flex min-h-11 min-w-[72px] items-center justify-center gap-1 rounded-md border px-2 text-sm font-medium disabled:opacity-40",
                            st === "completed" &&
                              "border-success bg-success text-success-foreground",
                            st === "missed" && "border-danger bg-danger-soft text-danger",
                            st === "pending" &&
                              !notDue &&
                              "border-warning bg-warning-soft text-warning-foreground",
                            st === "pending" &&
                              notDue &&
                              "border-border bg-neutral-soft text-muted-foreground",
                          )}
                        >
                          {st === "completed" && <Check className="size-4" aria-hidden />}
                          {t}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                      <div
                        className="h-full rounded-full bg-success transition-all"
                        style={{ width: `${times.length ? (done / times.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {done}/{times.length}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
