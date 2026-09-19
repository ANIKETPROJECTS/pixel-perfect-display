import { createFileRoute, useLocation } from "@tanstack/react-router";
import { CalendarDays, Download, Filter, Printer, Search, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { attKey, dateKey, taskKey, type TaskStatus } from "@/lib/tracker-data";
import { effectiveTaskStatus, useLookups, useTracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Compliance Reports — RailsOps Workforce Tracker" },
      {
        name: "description",
        content:
          "Daily, monthly, HRMS, and flagged-work reports for workforce accountability.",
      },
      { property: "og:title", content: "Compliance Reports — RailsOps Workforce Tracker" },
    ],
  }),
  component: Reports,
});

type ReportTab = "daily" | "monthly" | "hrms-export" | "flagged-work";
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Reports() {
  const { state, today, now, role } = useTracker();
  const lk = useLookups();
  const location = useLocation();
  const [tab, setTab] = useState<ReportTab>("daily");
  const [reportDate, setReportDate] = useState(today);
  const [reportMonth, setReportMonth] = useState(today.slice(0, 7));
  const activeTab = role === "admin" || tab !== "flagged-work" ? tab : "daily";
  useEffect(() => {
    const hash = location.hash.slice(1) as ReportTab;
    if (["daily", "monthly", "hrms-export", "flagged-work"].includes(hash)) setTab(hash);
  }, [location.hash]);

  const daily = useMemo(
    () =>
      state.employees
        .filter((employee) => employee.status === "active")
        .map((employee) => {
          const times = lk.job(employee.jobTypeId)?.scheduledTimes ?? [];
          const attendance = state.attendance[attKey(employee.id, reportDate)];
          const tasksRequired = attendance?.status !== "absent" && attendance?.status !== "leave";
          const statuses = tasksRequired
            ? times.map((time) =>
                effectiveTaskStatus(
                  state.taskLogs[taskKey(employee.id, reportDate, time)]?.status,
                  time,
                  reportDate === today,
                  now,
                ),
              )
            : [];
          const done = statuses.filter((status) => status === "completed").length;
          const missed = statuses.filter((status) => status === "missed").length;
          const redo = statuses.filter((status) => status === "needs_redo").length;
          return {
            emp: employee,
            dept: lk.dept(employee.departmentId)?.name ?? "",
            assigned: statuses.length,
            done,
            missed,
            redo,
            compliance: pct(done, statuses.length),
            attendance: attendance?.status ?? "—",
          };
        }),
    [lk, now, reportDate, state, today],
  );

  const byDept = useMemo(() => {
    const map = new Map<string, { assigned: number; done: number; missed: number; redo: number }>();
    for (const row of daily) {
      const current = map.get(row.dept) ?? { assigned: 0, done: 0, missed: 0, redo: 0 };
      map.set(row.dept, {
        assigned: current.assigned + row.assigned,
        done: current.done + row.done,
        missed: current.missed + row.missed,
        redo: current.redo + row.redo,
      });
    }
    return [...map.entries()];
  }, [daily]);

  const monthly = useMemo(() => {
    const [year, month] = reportMonth.split("-").map(Number);
    const selectedYear = year || Number(today.slice(0, 4));
    const selectedMonth = month || Number(today.slice(5, 7));
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const isCurrentMonth = reportMonth === today.slice(0, 7);
    const dayCount = isCurrentMonth ? Number(today.slice(8, 10)) : daysInMonth;
    const days = Array.from({ length: dayCount }, (_, index) =>
      dateKey(new Date(selectedYear, selectedMonth - 1, index + 1)),
    );
    return state.employees
      .filter((employee) => employee.status === "active")
      .map((employee) => {
        const times = lk.job(employee.jobTypeId)?.scheduledTimes ?? [];
        let assigned = 0;
        let done = 0;
        let present = 0;
        let absent = 0;
        let leave = 0;
        for (const date of days) {
          const attendance = state.attendance[attKey(employee.id, date)]?.status;
          if (attendance === "present") present += 1;
          else if (attendance === "absent") absent += 1;
          else if (attendance === "leave" || attendance === "half-day") leave += 1;
            if (attendance === "absent" || attendance === "leave") continue;
            assigned += times.length;
            done += times.filter((time) => {
              const status = effectiveTaskStatus(
                state.taskLogs[taskKey(employee.id, date, time)]?.status,
                time,
                date === today,
                now,
              );
              return status === "completed";
            }).length;
        }
        const compliance = pct(done, assigned);
        const attendance = pct(present, days.length);
        return {
          emp: employee,
          dept: lk.dept(employee.departmentId)?.name ?? "",
          totalWorkingDays: days.length,
          daysWorked: present,
          absent,
          leave,
          assigned,
          done,
          compliance,
          attendance,
          score: Math.round(((compliance + attendance) / 2) * 10) / 10,
        };
      });
  }, [lk, now, reportMonth, state, today]);

  const monthLabel = formatMonthLabel(reportMonth);

  const hrmsRows = useMemo(
    () =>
      monthly.map((row) => [
        row.emp.code,
         row.emp.hrmsEmployeeId,
        row.emp.name,
        row.dept,
         monthLabel,
         row.totalWorkingDays,
         row.daysWorked,
         row.absent,
         `${row.attendance}%`,
         row.assigned,
         row.done,
         `${row.compliance}%`,
      ]),
    [monthly, monthLabel],
  );

  const reportCsv = activeTab === "monthly"
    ? {
        filename: `monthly-performance-${reportMonth}.csv`,
        rows: [
          ["Employee", "Code", "Department", "Days worked", "Tasks completed", "Tasks assigned", "Compliance %", "Attendance %", "Score %"],
          ...monthly.map((row) => [
            row.emp.name,
            row.emp.code,
            row.dept,
            row.daysWorked,
            row.done,
            row.assigned,
            `${row.compliance}%`,
            `${row.attendance}%`,
            `${row.score}%`,
          ]),
        ],
      }
    : {
        filename: `daily-compliance-${reportDate}.csv`,
        rows: [
          ["Code", "Name", "Department", "Assigned", "Completed", "Missed", "Needs Redo", "Compliance %", "Attendance"],
          ...daily.map((row) => [
            row.emp.code,
            row.emp.name,
            row.dept,
            row.assigned,
            row.done,
            row.missed,
            row.redo,
            row.compliance,
            row.attendance,
          ]),
        ],
      };

  const flagged = useMemo(
    () =>
      Object.entries(state.taskLogs)
        .filter(
          ([, log]) =>
            (log.status === "missed" || log.status === "needs_redo") && Boolean(log.remarks?.trim()),
        )
        .flatMap(([key, log]) => {
          const [employeeId, date = "", time = ""] = key.split("|");
          const employee = state.employees.find((item) => item.id === employeeId);
          if (!employee) return [];
          return {
            key,
            date,
            time,
            employee,
            department: employee ? lk.dept(employee.departmentId)?.name ?? "" : "",
            task: employee ? lk.job(employee.jobTypeId)?.title ?? "" : "",
            status: log.status as "missed" | "needs_redo",
            remarks: log.remarks ?? "",
            markedBy: log.markedBy ?? "—",
          };
        })
        .filter((row) => row.employee),
    [lk, state],
  );

  const changeTab = (next: ReportTab) => {
    setTab(next);
    if (typeof window !== "undefined") window.location.hash = next;
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Reporting</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Compliance & exports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily operations, monthly performance, HRMS exports, and internal accountability.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
        {([
          ["daily", "Daily compliance"],
          ["monthly", "Monthly performance"],
          ["hrms-export", "HRMS export"],
          ...(role === "admin" ? [["flagged-work", "Flagged work log"]] : []),
        ] as [ReportTab, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => changeTab(value)}
            className={cn(
              "min-h-11 rounded-md px-3 text-sm font-semibold",
              activeTab === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {(activeTab === "daily" || activeTab === "monthly") && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => downloadCsv(reportCsv.filename, reportCsv.rows)}
            className="inline-flex min-h-11 items-center gap-1 rounded-md border border-input bg-card px-3 text-sm font-medium"
          >
            <Download className="size-4" aria-hidden /> CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center gap-1 rounded-md border border-input bg-card px-3 text-sm font-medium"
          >
            <Printer className="size-4" aria-hidden /> PDF
          </button>
        </div>
      )}

      {activeTab === "daily" && (
        <>
          <section className="space-y-3" id="daily">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Daily compliance · {formatDateLabel(reportDate)}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose any past date to review recorded attendance and task outcomes.
                </p>
              </div>
              <ReportDatePicker
                label="Report date"
                value={reportDate}
                max={today}
                onChange={setReportDate}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {byDept.map(([name, value]) => (
                <div key={name} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold">{name}</p>
                    <p className="font-bold tabular-nums">{pct(value.done, value.assigned)}%</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-soft">
                    <div className="h-full bg-success" style={{ width: `${pct(value.done, value.assigned)}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <SmallBadge>{value.done} done</SmallBadge>
                    <SmallBadge>{value.missed} missed</SmallBadge>
                    <SmallBadge>{value.redo} redo</SmallBadge>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <Table
            head={["Employee", "Department", "Tasks", "Compliance", "Attendance"]}
            rows={daily.map((row) => [
              `${row.emp.name} (${row.emp.code})`,
              row.dept,
              `${row.done}/${row.assigned}`,
              `${row.compliance}%`,
              row.attendance,
            ])}
          />
        </>
      )}

      {activeTab === "monthly" && (
        <section className="space-y-3" id="monthly">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Monthly performance · {monthLabel}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Review attendance, task completion, and performance scores for the selected month.
              </p>
            </div>
            <ReportMonthPicker
              label="Performance month"
              value={reportMonth}
              max={today.slice(0, 7)}
              onChange={setReportMonth}
            />
          </div>
          <Table
            head={["Employee", "Department", "Days", "Tasks", "Compliance", "Attendance", "Score"]}
            rows={monthly.map((row) => [
              `${row.emp.name} (${row.emp.code})`,
              row.dept,
              String(row.daysWorked),
              `${row.done}/${row.assigned}`,
              `${row.compliance}%`,
              `${row.attendance}%`,
              `${row.score}%`,
            ])}
          />
          <p className="text-xs text-muted-foreground">
            Performance score = average of compliance and attendance percentages.
          </p>
        </section>
      )}

      {activeTab === "hrms-export" && (
        <section className="space-y-4" id="hrms-export">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-semibold">HRMS export</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Export the selected month’s workforce summary in the HRMS-ready column structure.
                </p>
              </div>
              <ReportMonthPicker
                label="Export month"
                value={reportMonth}
                max={today.slice(0, 7)}
                onChange={setReportMonth}
              />
            </div>
            <button
              onClick={() =>
                downloadCsv(
                  `hrms-workforce-${reportMonth}.csv`,
                  [
                    [
                      "employee_code",
                      "hrms_employee_id",
                      "employee_name",
                      "department",
                      "month",
                      "total_working_days",
                      "days_present",
                      "days_absent",
                      "attendance_pct",
                      "tasks_assigned",
                      "tasks_completed",
                      "task_compliance_pct",
                    ],
                    ...hrmsRows,
                  ],
                )
              }
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
            >
              <Download className="size-4" aria-hidden /> Download HRMS CSV
            </button>
          </div>
          <Table
            head={[
              "Employee code",
              "HRMS ID",
              "Employee",
              "Department",
              "Month",
              "Working days",
              "Present",
              "Absent",
              "Attendance",
              "Assigned",
              "Completed",
              "Task compliance",
            ]}
            rows={monthly.map((row) => [
              row.emp.code,
              row.emp.hrmsEmployeeId,
              row.emp.name,
              row.dept,
              monthLabel,
              String(row.totalWorkingDays),
              String(row.daysWorked),
              String(row.absent),
              `${row.attendance}%`,
              String(row.assigned),
              String(row.done),
              `${row.compliance}%`,
            ])}
          />
        </section>
      )}

      {activeTab === "flagged-work" && role === "admin" && <FlaggedWorkLog rows={flagged} />}
    </div>
  );
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year || 0, (month || 1) - 1, 1);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function ReportDatePicker({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: string;
  max: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-input bg-card px-3">
      <CalendarDays className="size-4 text-primary" aria-hidden />
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        type="date"
        aria-label={label}
        value={value}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-sm font-semibold outline-none"
      />
    </label>
  );
}

function ReportMonthPicker({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: string;
  max: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-input bg-card px-3">
      <CalendarDays className="size-4 text-primary" aria-hidden />
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        type="month"
        aria-label={label}
        value={value}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-sm font-semibold outline-none"
      />
    </label>
  );
}

type FlaggedRow = {
  key: string;
  date: string;
  time: string;
  employee?: { id: string; name: string; code: string };
  department: string;
  task: string;
  status: "missed" | "needs_redo";
  remarks: string;
  markedBy: string;
};

function FlaggedWorkLog({ rows }: { rows: FlaggedRow[] }) {
  const { state } = useTracker();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [employee, setEmployee] = useState("all");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const filtered = rows.filter((row) => {
    const text = `${row.employee?.name} ${row.employee?.code} ${row.task} ${row.remarks}`.toLowerCase();
    return (
      (query.trim() === "" || text.includes(query.toLowerCase())) &&
      (department === "all" || row.department === department) &&
      (employee === "all" || row.employee?.id === employee) &&
      (status === "all" || row.status === status) &&
      (fromDate === "" || row.date >= fromDate) &&
      (toDate === "" || row.date <= toDate)
    );
  });
  const departments = [...new Set(rows.map((row) => row.department))];
  const employees = [...new Map(rows.map((row) => [row.employee?.id, row.employee])).values()].filter(Boolean);

  return (
    <section className="space-y-4" id="flagged-work">
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-orange-700" aria-hidden />
          <div>
            <h3 className="font-semibold text-orange-950">Flagged work log</h3>
            <p className="mt-1 text-sm text-orange-900/80">
              Admin accountability record for missed work and quality issues that require a redo.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-2 rounded-xl border border-border bg-card p-3 md:grid-cols-4">
        <label className="relative md:col-span-2">
          <span className="sr-only">Search flagged work</span>
          <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employee, task, or remark"
            className="min-h-11 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm"
          />
        </label>
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="min-h-11 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="all">All departments</option>
          {departments.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "all" | TaskStatus)}
          className="min-h-11 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="all">Missed + Needs redo</option>
          <option value="missed">Missed</option>
          <option value="needs_redo">Needs redo</option>
        </select>
        <label>
          <span className="mb-1 block text-xs font-medium text-muted-foreground">From date</span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-muted-foreground">To date</span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
          />
        </label>
        <select
          value={employee}
          onChange={(event) => setEmployee(event.target.value)}
          className="min-h-11 rounded-md border border-input bg-card px-3 text-sm md:col-span-2"
        >
          <option value="all">All employees</option>
          {employees.map((item) => item && <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
        </select>
        <button
          onClick={() =>
            downloadCsv(
              "flagged-work-log.csv",
              [
                ["Date", "Department", "Employee", "Task", "Scheduled time", "Status", "Remark", "Marked by"],
                ...filtered.map((row) => [
                  row.date,
                  row.department,
                  `${row.employee?.name} (${row.employee?.code})`,
                  row.task,
                  row.time,
                  row.status === "needs_redo" ? "Needs Redo" : "Missed",
                  row.remarks,
                  row.markedBy,
                ]),
              ],
            )
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
        >
          <Download className="size-4" aria-hidden /> Export filtered CSV
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Filter className="size-4" aria-hidden /> Showing {filtered.length} of {rows.length} flagged entries.
      </div>
      <Table
        head={["Date", "Department", "Employee", "Task", "Time", "Status", "Remark", "Marked by"]}
        rows={filtered.map((row) => [
          row.date,
          row.department,
          `${row.employee?.name} (${row.employee?.code})`,
          row.task,
          row.time,
          row.status === "needs_redo" ? "Needs Redo" : "Missed",
          row.remarks,
          row.markedBy,
        ])}
      />
      {state.audit.length === 0 && rows.length === 0 && (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No flagged work with remarks has been recorded yet.
        </p>
      )}
    </section>
  );
}

function SmallBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-neutral-soft px-2 py-1 text-[11px] font-medium text-muted-foreground">{children}</span>;
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left">
            {head.map((heading) => (
              <th key={heading} className="whitespace-nowrap px-3 py-3 font-semibold">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-3 py-8 text-center text-sm text-muted-foreground">
                No rows match the current filters.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border last:border-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="max-w-[280px] whitespace-nowrap px-3 py-3 align-top tabular-nums">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}