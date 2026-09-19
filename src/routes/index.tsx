import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Flag,
  Home,
  NotepadText,
  RotateCcw,
  X,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  attKey,
  minutesOf,
  taskKey,
  type AttendanceStatus,
  type Department,
  type DepartmentGroup,
  type Employee,
  type TaskStatus,
} from "@/lib/tracker-data";
import { effectiveTaskStatus, useLookups, useTracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today's Round — RailsOps Workforce Tracker" },
      {
        name: "description",
        content:
          "Department-first daily workforce operations with task, attendance, and quality marking.",
      },
      { property: "og:title", content: "Today's Round — RailsOps Workforce Tracker" },
    ],
  }),
  component: Dashboard,
});

type Filter =
  | { kind: "all" }
  | { kind: "shift"; id: string }
  | { kind: "missed" }
  | { kind: "flagged" };

type DepartmentSummary = {
  dept: Department;
  employees: Employee[];
  total: number;
  completed: number;
  pending: number;
  missed: number;
  flagged: number;
  completion: number;
  attendance: number;
};

const attendanceLabel: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  "half-day": "Half day",
  leave: "Leave",
};

function Dashboard() {
  const { state, role, supervisorId, today, now } = useTracker();
  const lk = useLookups();
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [departmentGroup, setDepartmentGroup] = useState<DepartmentGroup>("station");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleDeptIds = useMemo(
    () =>
      role === "admin"
        ? state.departments.map((d) => d.id)
        : (lk.supervisor(supervisorId)?.departmentIds ?? []),
    [lk, role, state.departments, supervisorId],
  );

  const selectedDept = state.departments.find((d) => d.id === selectedDeptId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Workforce operations</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {selectedDept ? selectedDept.name : "Department overview"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedDept
              ? "Review attendance and mark every scheduled task for this department."
              : role === "admin"
                ? "Choose a department to begin today’s marking round."
                : "Your assigned departments, today’s completion, and quality flags."}
          </p>
        </div>
        <div className="flex items-stretch gap-2">
          <div className="min-w-[148px] rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Clock3 className="size-3.5" aria-hidden />
              Current time
            </div>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {currentTime
                ? currentTime.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })
                : "--:--:--"}
            </p>
          </div>
          <div className="min-w-[148px] rounded-lg border border-border bg-card px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              Today
            </div>
            <p className="mt-1 text-sm font-bold">{formatDashboardDate(today)}</p>
            <p className="text-xs text-muted-foreground">{visibleDeptIds.length} active departments</p>
          </div>
        </div>
      </div>

      {selectedDept ? (
        <DepartmentTaskView
          departmentId={selectedDept.id}
          onBack={() => setSelectedDeptId(null)}
          visibleDeptIds={visibleDeptIds}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <div>
              <p className="text-sm font-semibold">Choose workstream</p>
              <p className="text-xs text-muted-foreground">Switch between station and colony departments.</p>
            </div>
            <div
              className="inline-flex rounded-lg border border-border bg-muted p-1"
              role="tablist"
              aria-label="Department workstream"
            >
              <DepartmentToggle
                active={departmentGroup === "station"}
                label="Station"
                count={state.departments.filter((department) => department.group === "station").length}
                icon={Building2}
                onClick={() => setDepartmentGroup("station")}
              />
              <DepartmentToggle
                active={departmentGroup === "colony"}
                label="Colony"
                count={state.departments.filter((department) => department.group === "colony").length}
                icon={Home}
                onClick={() => setDepartmentGroup("colony")}
              />
            </div>
          </div>
          <DepartmentOverview
            departmentIds={visibleDeptIds}
            group={departmentGroup}
            onSelect={setSelectedDeptId}
            today={today}
            now={now}
          />
        </>
      )}
    </div>
  );
}

function formatDashboardDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DepartmentToggle({
  active,
  label,
  count,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: typeof Building2;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-primary-foreground/15" : "bg-card")}>
        {count}
      </span>
    </button>
  );
}

function DepartmentOverview({
  departmentIds,
  group,
  onSelect,
  today,
  now,
}: {
  departmentIds: string[];
  group: DepartmentGroup;
  onSelect: (id: string) => void;
  today: string;
  now: number;
}) {
  const { state } = useTracker();
  const lk = useLookups();

  const summaries: DepartmentSummary[] = departmentIds
    .map((id) => {
      const dept = lk.dept(id);
      const employees = state.employees.filter((e) => e.status === "active" && e.departmentId === id);
      let total = 0;
      let completed = 0;
      let pending = 0;
      let missed = 0;
      let flagged = 0;
      for (const emp of employees) {
        const times = lk.job(emp.jobTypeId)?.scheduledTimes ?? [];
        for (const time of times) {
          total += 1;
          const log = state.taskLogs[taskKey(emp.id, today, time)];
          const status = effectiveTaskStatus(log?.status, time, true, now);
          if (status === "completed") completed += 1;
          if (status === "pending" || status === "upcoming") pending += 1;
          if (status === "missed") missed += 1;
          if (status === "needs_redo") flagged += 1;
        }
      }
      const present = employees.filter(
        (e) => state.attendance[attKey(e.id, today)]?.status === "present",
      ).length;
      return {
        dept,
        employees,
        total,
        completed,
        pending,
        missed,
        flagged,
        completion: total ? Math.round((completed / total) * 1000) / 10 : 0,
        attendance: employees.length ? Math.round((present / employees.length) * 1000) / 10 : 0,
      };
    })
    .filter((summary): summary is DepartmentSummary => Boolean(summary.dept));

  const groupSummaries = summaries.filter((summary) => summary.dept.group === group);
  const isColony = group === "colony";

  return (
    <section aria-labelledby="department-overview" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 id="department-overview" className="text-sm font-semibold">
          Today by department
        </h3>
        <span className="text-xs text-muted-foreground">{groupSummaries.length} departments</span>
      </div>
      <div
        className={cn(
          "rounded-2xl border p-3",
          isColony ? "border-orange-200 bg-orange-50/60" : "border-primary/20 bg-primary/5",
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h4 className={cn("font-semibold", isColony ? "text-orange-950" : "text-primary")}>
              {isColony ? "Colony" : "Station"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isColony ? "Residential colony work-stream" : "Railway station work-stream"}
            </p>
          </div>
          <span className="rounded-full bg-card px-2 py-1 text-xs font-medium text-muted-foreground">
            {groupSummaries.length} departments
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groupSummaries.map((summary) => (
            <button
              key={summary.dept.id}
              onClick={() => onSelect(summary.dept.id)}
              className="group rounded-xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{summary.dept.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{summary.dept.zone}</p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Completion" value={`${summary.completion}%`} />
                <Metric label="Attendance" value={`${summary.attendance}%`} />
                <Metric label="Employees" value={String(summary.employees.length)} icon={Users} />
                <Metric label="Tasks" value={`${summary.completed}/${summary.total}`} />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone="warning">{summary.pending} pending</Badge>
                <Badge tone="danger">{summary.missed} missed</Badge>
                <Badge tone="orange">{summary.flagged} flagged</Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function DepartmentTaskView({
  departmentId,
  onBack,
  visibleDeptIds,
}: {
  departmentId: string;
  onBack: () => void;
  visibleDeptIds: string[];
}) {
  const { state, today, now, setTask, setAttendance } = useTracker();
  const lk = useLookups();
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [noteTask, setNoteTask] = useState<string | null>(null);
  const dept = lk.dept(departmentId);
  const employees = state.employees.filter((emp) => {
    if (emp.status !== "active" || emp.departmentId !== departmentId) return false;
    if (filter.kind === "shift") return emp.shiftId === filter.id;
    const job = lk.job(emp.jobTypeId);
    const statuses = (job?.scheduledTimes ?? []).map((time) =>
      effectiveTaskStatus(state.taskLogs[taskKey(emp.id, today, time)]?.status, time, true, now),
    );
    if (filter.kind === "missed") return statuses.includes("missed");
    if (filter.kind === "flagged") return statuses.includes("needs_redo");
    return true;
  });
  const shifts = state.shifts.filter((shift) =>
    state.employees.some((emp) => emp.departmentId === departmentId && emp.shiftId === shift.id),
  );

  return (
    <section className="space-y-3" aria-labelledby="department-task-view">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Department marking
            </p>
            <h3 id="department-task-view" className="text-lg font-bold">
              {dept?.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {dept?.zone} · {employees.length} workers in this view
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-success" /> Done
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-orange-500" /> Needs redo
              </span>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs font-semibold text-foreground shadow-sm hover:bg-accent"
            >
              <ArrowLeft className="size-3.5" aria-hidden /> Departments
            </button>
          </div>
        </div>
        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          <Chip active={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })}>
            All workers
          </Chip>
          {shifts.map((shift) => (
            <Chip
              key={shift.id}
              active={filter.kind === "shift" && filter.id === shift.id}
              onClick={() => setFilter({ kind: "shift", id: shift.id })}
            >
              {shift.name}
            </Chip>
          ))}
          <Chip active={filter.kind === "missed"} onClick={() => setFilter({ kind: "missed" })}>
            Missed only
          </Chip>
          <Chip active={filter.kind === "flagged"} onClick={() => setFilter({ kind: "flagged" })}>
            Flagged only
          </Chip>
        </div>
      </div>

      {employees.length === 0 && (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No workers match this filter.
        </p>
      )}
      <div className="space-y-3">
        {employees.map((emp) => {
          const job = lk.job(emp.jobTypeId);
          const shift = lk.shift(emp.shiftId);
          const attendance = state.attendance[attKey(emp.id, today)];
          const attendanceStatus: AttendanceStatus = attendance?.status ?? "present";
          const times = job?.scheduledTimes ?? [];
          const done = times.filter(
            (time) => state.taskLogs[taskKey(emp.id, today, time)]?.status === "completed",
          ).length;
          return (
            <article key={emp.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-[220px] flex-1 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                  {emp.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {emp.code} · {job?.title} · {shift?.name} {shift?.start}–{shift?.end}
                  </p>
                </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Attendance
                  </span>
                  <div className="flex flex-wrap justify-end gap-1 rounded-lg bg-muted p-1">
                    {(["present", "absent", "half-day", "leave"] as const).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        type="button"
                        onClick={() =>
                          setAttendance(emp.id, today, nextStatus, attendance?.remarks)
                        }
                        className={cn(
                          "min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors",
                          attendanceStatus === nextStatus
                            ? nextStatus === "present"
                              ? "bg-success text-success-foreground"
                              : "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-card hover:text-foreground",
                        )}
                      >
                        {attendanceLabel[nextStatus]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {attendanceStatus !== "present" && (
                <input
                  aria-label={`Optional attendance reason for ${emp.name}`}
                  className="mt-3 min-h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  value={attendance?.remarks ?? ""}
                  placeholder="Optional attendance note"
                  onChange={(event) =>
                    setAttendance(emp.id, today, attendanceStatus, event.target.value)
                  }
                />
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Shift checklist
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {times.length} scheduled rounds · {done} completed
                  </p>
                </div>
                <button
                  type="button"
                  disabled={attendanceStatus === "absent" || times.length === 0}
                  onClick={() => {
                    for (const time of times) setTask(emp.id, today, time, "completed");
                  }}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2.5 text-xs font-semibold text-green-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCheck className="size-3.5" aria-hidden />
                  Mark all done
                </button>
              </div>

              {attendanceStatus === "absent" ? (
                <div className="mt-3 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
                  Absent today — shift tasks are not required.
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                {times.map((time) => {
                  const key = taskKey(emp.id, today, time);
                  const log = state.taskLogs[key];
                  const status = effectiveTaskStatus(log?.status, time, true, now);
                  const notDue = now > 0 && minutesOf(time) > now;
                  return (
                    <div key={time} className="relative flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const next = status === "completed" ? "pending" : "completed";
                          setTask(emp.id, today, time, next, log?.remarks);
                        }}
                        className={cn(
                          "flex min-h-11 min-w-[74px] items-center justify-center gap-1 rounded-md border px-2 text-sm font-semibold disabled:opacity-40",
                          status === "completed" && "border-success bg-success text-success-foreground",
                          status === "missed" && "border-danger bg-danger-soft text-danger",
                          status === "needs_redo" &&
                            "border-orange-500 bg-orange-100 text-orange-800",
                          status === "pending" &&
                            !notDue &&
                            "border-warning bg-warning-soft text-warning-foreground",
                          status === "pending" &&
                            notDue &&
                            "border-border bg-neutral-soft text-muted-foreground",
                        )}
                      >
                        {status === "completed" && <Check className="size-4" aria-hidden />}
                        {status === "needs_redo" && <Flag className="size-4" aria-hidden />}
                        {time}
                      </button>
                      <button
                        type="button"
                        title={`Mark ${time} done`}
                        aria-label={`Mark ${time} done for ${emp.name}`}
                        onClick={() => setTask(emp.id, today, time, "completed", log?.remarks)}
                        className={cn(
                          "inline-flex min-h-11 min-w-8 items-center justify-center rounded-md border",
                          log?.status === "completed"
                            ? "border-success bg-success text-success-foreground"
                            : "border-success/30 bg-success-soft text-green-700 hover:bg-green-100",
                        )}
                      >
                        <Check className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        title={`Mark ${time} missed`}
                        aria-label={`Mark ${time} missed for ${emp.name}`}
                        onClick={() => setTask(emp.id, today, time, "missed", log?.remarks)}
                        className={cn(
                          "inline-flex min-h-11 min-w-8 items-center justify-center rounded-md border",
                          log?.status === "missed"
                            ? "border-danger bg-danger text-danger-foreground"
                            : "border-danger/30 bg-danger-soft text-danger hover:bg-red-100",
                        )}
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        title={`Mark ${time} needs redo`}
                        aria-label={`Mark ${time} needs redo for ${emp.name}`}
                        onClick={() => setTask(emp.id, today, time, "needs_redo", log?.remarks)}
                        className={cn(
                          "inline-flex min-h-11 min-w-8 items-center justify-center rounded-md border",
                          log?.status === "needs_redo"
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
                        )}
                      >
                        <RotateCcw className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        title={`Add a note to ${time}`}
                        aria-label={`Add a note to ${time} for ${emp.name}`}
                        onClick={() => setNoteTask(noteTask === key ? null : key)}
                        className={cn(
                          "inline-flex min-h-11 min-w-8 items-center justify-center rounded-md border",
                          noteTask === key || log?.remarks
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input text-muted-foreground hover:bg-accent",
                        )}
                      >
                        <NotepadText className="size-4" aria-hidden />
                      </button>
                      {noteTask === key && (
                        <TaskNoteEditor
                          employeeName={emp.name}
                          time={time}
                          currentStatus={log?.status ?? (status === "completed" ? "completed" : "pending")}
                          currentRemarks={log?.remarks}
                          onSave={(nextStatus, remarks) => {
                            setTask(emp.id, today, time, nextStatus, remarks);
                            setNoteTask(null);
                          }}
                          onCancel={() => setNoteTask(null)}
                        />
                      )}
                    </div>
                  );
                })}
                </div>
              )}
              {times.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{ width: `${(done / times.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {done}/{times.length} done
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Use the visible task buttons to mark Done, Missed, Needs redo, or add a note.
      </p>
    </section>
  );
}

function TaskStatusMenu({
  employeeName,
  time,
  currentStatus,
  currentRemarks,
  onSave,
}: {
  employeeName: string;
  time: string;
  currentStatus: TaskStatus;
  currentRemarks: string | undefined;
  onSave: (status: TaskStatus, remarks: string) => void;
}) {
  const [status, setStatus] = useState<TaskStatus>(currentStatus);
  const [remarks, setRemarks] = useState(currentRemarks ?? "");

  return (
    <div
      role="menu"
      aria-label={`Status options for ${employeeName} at ${time}`}
      className="absolute left-0 top-full z-20 mt-1 w-[230px] rounded-lg border border-border bg-card p-2 shadow-lg"
    >
      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Update {time} status
      </p>
      {(["completed", "missed", "needs_redo"] as const).map((nextStatus) => (
        <button
          key={nextStatus}
          type="button"
          role="menuitem"
          onClick={() => setStatus(nextStatus)}
          className={cn(
            "flex min-h-9 w-full items-center rounded-md px-2 text-left text-xs font-semibold hover:bg-accent",
            status === nextStatus && "bg-muted",
            nextStatus === "completed" && "text-green-700",
            nextStatus === "missed" && "text-danger",
            nextStatus === "needs_redo" && "text-orange-700",
          )}
        >
          {taskStatusLabel[nextStatus]}
        </button>
      ))}
      <textarea
        aria-label={`Remark for ${employeeName} at ${time}`}
        value={remarks}
        onChange={(event) => setRemarks(event.target.value)}
        placeholder="Optional note or remark"
        rows={2}
        className="mt-2 w-full resize-none rounded-md border border-input bg-card px-2.5 py-2 text-xs"
      />
      <button
        type="button"
        onClick={() => onSave(status, remarks)}
        className="mt-2 min-h-9 w-full rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground"
      >
        Save status
      </button>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Users;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-lg font-bold tabular-nums">
        {Icon && <Icon className="size-4 text-primary" aria-hidden />}
        {value}
      </p>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "warning" | "danger" | "orange" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-[11px] font-semibold",
        tone === "warning" && "bg-warning-soft text-warning-foreground",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "orange" && "bg-orange-100 text-orange-800",
      )}
    >
      {children}
    </span>
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