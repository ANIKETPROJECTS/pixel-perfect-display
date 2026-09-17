import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { attKey, dateKey, type AttendanceStatus } from "@/lib/tracker-data";
import { useLookups, useTracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Platform Workforce Tracker" },
      {
        name: "description",
        content:
          "Manage departments, job schedules, shifts, employees and supervisors, edit attendance and review the audit trail.",
      },
      { property: "og:title", content: "Admin Panel — Platform Workforce Tracker" },
      {
        property: "og:description",
        content:
          "Manage departments, job schedules, shifts, employees and supervisors, edit attendance and review the audit trail.",
      },
    ],
  }),
  component: Admin,
});

const TABS = [
  "Employees",
  "Departments",
  "Job types",
  "Shifts",
  "Supervisors",
  "Attendance",
  "Audit",
] as const;

const ATT_CYCLE: AttendanceStatus[] = ["present", "absent", "half-day", "leave"];

function Admin() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Employees");
  const { reset } = useTracker();

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium",
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Employees" && <Employees />}
      {tab === "Departments" && <Departments />}
      {tab === "Job types" && <JobTypes />}
      {tab === "Shifts" && <Shifts />}
      {tab === "Supervisors" && <Supervisors />}
      {tab === "Attendance" && <AttendanceGrid />}
      {tab === "Audit" && <Audit />}

      <button
        onClick={() => reset()}
        className="min-h-11 w-full rounded-md border border-danger/40 bg-danger-soft px-3 text-sm font-medium text-danger"
      >
        Reset demo data
      </button>
    </div>
  );
}

const inputCls = "min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm";
const cardCls = "rounded-lg border border-border bg-card p-3 space-y-2";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-2 sm:grid-cols-2">{children}</div>;
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Delete"
      className="inline-flex size-11 items-center justify-center rounded-md border border-input text-danger"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function Employees() {
  const { state, upsert, remove } = useTracker();
  const lk = useLookups();

  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          upsert("employees", {
            id: newId("e"),
            code: `EMP-${100 + state.employees.length + 1}`,
            name: "New Worker",
            departmentId: state.departments[0]?.id ?? "",
            jobTypeId: state.jobTypes[0]?.id ?? "",
            shiftId: state.shifts[0]?.id ?? "",
            phone: "",
            zone: "",
            joiningDate: dateKey(new Date()),
            status: "active",
          })
        }
        className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add employee
      </button>

      {state.employees.map((e) => (
        <div key={e.id} className={cardCls}>
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={e.name}
              onChange={(ev) => upsert("employees", { ...e, name: ev.target.value })}
            />
            <DeleteBtn onClick={() => remove("employees", e.id)} />
          </div>
          <Row>
            <input
              className={inputCls}
              value={e.code}
              onChange={(ev) => upsert("employees", { ...e, code: ev.target.value })}
            />
            <input
              className={inputCls}
              value={e.phone}
              placeholder="Phone"
              onChange={(ev) => upsert("employees", { ...e, phone: ev.target.value })}
            />
            <select
              className={inputCls}
              value={e.departmentId}
              onChange={(ev) => upsert("employees", { ...e, departmentId: ev.target.value })}
            >
              {state.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              className={inputCls}
              value={e.jobTypeId}
              onChange={(ev) => upsert("employees", { ...e, jobTypeId: ev.target.value })}
            >
              {state.jobTypes.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            <select
              className={inputCls}
              value={e.shiftId}
              onChange={(ev) => upsert("employees", { ...e, shiftId: ev.target.value })}
            >
              {state.shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.start}–{s.end}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              value={e.zone}
              placeholder="Platform / zone"
              onChange={(ev) => upsert("employees", { ...e, zone: ev.target.value })}
            />
            <input
              type="date"
              className={inputCls}
              value={e.joiningDate}
              onChange={(ev) => upsert("employees", { ...e, joiningDate: ev.target.value })}
            />
            <select
              className={inputCls}
              value={e.status}
              onChange={(ev) =>
                upsert("employees", { ...e, status: ev.target.value as "active" | "inactive" })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Row>
          <p className="text-xs text-muted-foreground">
            {lk.job(e.jobTypeId)?.scheduledTimes.join(", ") || "No schedule"}
          </p>
        </div>
      ))}
    </div>
  );
}

function Departments() {
  const { state, upsert, remove } = useTracker();
  return (
    <div className="space-y-2">
      <button
        onClick={() => upsert("departments", { id: newId("d"), name: "New Department", zone: "" })}
        className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add department
      </button>
      {state.departments.map((d) => (
        <div key={d.id} className={cardCls}>
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={d.name}
              onChange={(e) => upsert("departments", { ...d, name: e.target.value })}
            />
            <DeleteBtn onClick={() => remove("departments", d.id)} />
          </div>
          <input
            className={inputCls}
            value={d.zone}
            placeholder="Platform / zone"
            onChange={(e) => upsert("departments", { ...d, zone: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

function JobTypes() {
  const { state, upsert, remove } = useTracker();
  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          upsert("jobTypes", {
            id: newId("j"),
            departmentId: state.departments[0]?.id ?? "",
            title: "New Job Type",
            scheduledTimes: ["09:00"],
          })
        }
        className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add job type
      </button>
      {state.jobTypes.map((j) => (
        <div key={j.id} className={cardCls}>
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={j.title}
              onChange={(e) => upsert("jobTypes", { ...j, title: e.target.value })}
            />
            <DeleteBtn onClick={() => remove("jobTypes", j.id)} />
          </div>
          <select
            className={inputCls}
            value={j.departmentId}
            onChange={(e) => upsert("jobTypes", { ...j, departmentId: e.target.value })}
          >
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap items-center gap-2">
            {j.scheduledTimes.map((t, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="time"
                  className="min-h-11 rounded-md border border-input bg-card px-2 text-sm"
                  value={t}
                  onChange={(e) => {
                    const times = [...j.scheduledTimes];
                    times[i] = e.target.value;
                    upsert("jobTypes", { ...j, scheduledTimes: times });
                  }}
                />
                <button
                  aria-label="Remove time"
                  className="text-danger"
                  onClick={() =>
                    upsert("jobTypes", {
                      ...j,
                      scheduledTimes: j.scheduledTimes.filter((_, k) => k !== i),
                    })
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                upsert("jobTypes", { ...j, scheduledTimes: [...j.scheduledTimes, "12:00"] })
              }
              className="min-h-11 rounded-md border border-input px-3 text-sm"
            >
              + time
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Frequency: {j.scheduledTimes.length}/day
          </p>
        </div>
      ))}
    </div>
  );
}

function Shifts() {
  const { state, upsert, remove } = useTracker();
  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          upsert("shifts", { id: newId("s"), name: "New Shift", start: "09:00", end: "17:00" })
        }
        className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add shift
      </button>
      {state.shifts.map((s) => (
        <div key={s.id} className={cardCls}>
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={s.name}
              onChange={(e) => upsert("shifts", { ...s, name: e.target.value })}
            />
            <DeleteBtn onClick={() => remove("shifts", s.id)} />
          </div>
          <Row>
            <input
              type="time"
              className={inputCls}
              value={s.start}
              onChange={(e) => upsert("shifts", { ...s, start: e.target.value })}
            />
            <input
              type="time"
              className={inputCls}
              value={s.end}
              onChange={(e) => upsert("shifts", { ...s, end: e.target.value })}
            />
          </Row>
        </div>
      ))}
    </div>
  );
}

function Supervisors() {
  const { state, upsert, remove } = useTracker();
  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          upsert("supervisors", {
            id: newId("sup"),
            name: "New Supervisor",
            phone: "",
            departmentIds: [],
          })
        }
        className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add supervisor
      </button>
      {state.supervisors.map((s) => (
        <div key={s.id} className={cardCls}>
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={s.name}
              onChange={(e) => upsert("supervisors", { ...s, name: e.target.value })}
            />
            <DeleteBtn onClick={() => remove("supervisors", s.id)} />
          </div>
          <input
            className={inputCls}
            value={s.phone}
            placeholder="Phone"
            onChange={(e) => upsert("supervisors", { ...s, phone: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            {state.departments.map((d) => {
              const on = s.departmentIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() =>
                    upsert("supervisors", {
                      ...s,
                      departmentIds: on
                        ? s.departmentIds.filter((x) => x !== d.id)
                        : [...s.departmentIds, d.id],
                    })
                  }
                  className={cn(
                    "min-h-11 rounded-full border px-3 text-xs font-medium",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceGrid() {
  const { state, setAttendance } = useTracker();
  const [empId, setEmpId] = useState(state.employees[0]?.id ?? "");
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    dateKey(new Date(now.getFullYear(), now.getMonth(), i + 1)),
  );
  const present = days.filter(
    (d) => state.attendance[attKey(empId, d)]?.status === "present",
  ).length;
  const elapsed = now.getDate();

  return (
    <div className={cardCls}>
      <select className={inputCls} value={empId} onChange={(e) => setEmpId(e.target.value)}>
        {state.employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name} ({e.code})
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} · attendance{" "}
        {elapsed ? Math.round((present / elapsed) * 1000) / 10 : 0}% · tap a day to change it
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const st = state.attendance[attKey(empId, d)]?.status;
          const future = i + 1 > elapsed;
          return (
            <button
              key={d}
              disabled={future}
              onClick={() => {
                const next = ATT_CYCLE[(ATT_CYCLE.indexOf(st ?? "leave") + 1) % ATT_CYCLE.length];
                setAttendance(empId, d, next);
              }}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center rounded text-xs font-medium disabled:opacity-30",
                st === "present" && "bg-success text-success-foreground",
                st === "absent" && "bg-danger text-danger-foreground",
                st === "half-day" && "bg-warning text-warning-foreground",
                st === "leave" && "bg-accent text-accent-foreground",
                !st && "bg-neutral-soft text-muted-foreground",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Green = present</span>
        <span>Red = absent</span>
        <span>Amber = half-day</span>
        <span>Blue = leave</span>
      </div>
    </div>
  );
}

function Audit() {
  const { state } = useTracker();
  if (state.audit.length === 0)
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No changes recorded yet. Marking tasks or editing records will show up here.
      </p>
    );
  return (
    <ul className="space-y-1">
      {state.audit.map((a) => (
        <li key={a.id} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          <span className="font-medium">{a.who}</span> — {a.what}
          <span className="block text-xs text-muted-foreground">
            {new Date(a.at).toLocaleString("en-IN")}
          </span>
        </li>
      ))}
    </ul>
  );
}
