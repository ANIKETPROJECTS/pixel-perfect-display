import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  Home,
  ListChecks,
  Printer,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { attKey, dateKey, taskKey, type DepartmentGroup, type TaskStatus } from "@/lib/tracker-data";
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
type ReportGroup = DepartmentGroup;
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

type DailyTaskStatus = "completed" | "missed" | "needs_redo" | "pending" | "upcoming";

type DailyReportRow = {
  emp: { id: string; name: string; code: string };
  deptId: string;
  dept: string;
  group: ReportGroup;
  assigned: number;
  done: number;
  missed: number;
  redo: number;
  compliance: number;
  attendance: string;
  statuses: { time: string; status: DailyTaskStatus }[];
};

type MonthlyReportRow = {
  emp: { id: string; name: string; code: string; hrmsEmployeeId: string };
  deptId: string;
  dept: string;
  group: ReportGroup;
  totalWorkingDays: number;
  daysWorked: number;
  absent: number;
  leave: number;
  assigned: number;
  done: number;
  compliance: number;
  attendance: number;
  score: number;
};

type DepartmentDailySummary = {
  id: string;
  name: string;
  zone: string;
  group: ReportGroup;
  employees: DailyReportRow[];
  assigned: number;
  done: number;
  missed: number;
  redo: number;
  compliance: number;
  attendance: number;
};

type DepartmentMonthlySummary = {
  id: string;
  name: string;
  zone: string;
  group: ReportGroup;
  employees: MonthlyReportRow[];
  assigned: number;
  done: number;
  compliance: number;
  attendance: number;
  score: number;
};

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
  const navigate = useNavigate({ from: "/reports" });
  const [tab, setTab] = useState<ReportTab>("daily");
  const [reportDate, setReportDate] = useState(today);
  const [reportMonth, setReportMonth] = useState(today.slice(0, 7));
  const [dailyGroup, setDailyGroup] = useState<ReportGroup>("station");
  const [selectedDailyDeptId, setSelectedDailyDeptId] = useState<string | null>(null);
  const [monthlyGroup, setMonthlyGroup] = useState<ReportGroup>("station");
  const [selectedMonthlyDeptId, setSelectedMonthlyDeptId] = useState<string | null>(null);
  const [hrmsGroup, setHrmsGroup] = useState<ReportGroup>("station");
  const activeTab = role === "admin" || tab !== "flagged-work" ? tab : "daily";
  useEffect(() => {
    const hash = location.hash.replace(/^#/, "") as ReportTab;
    if (["daily", "monthly", "hrms-export", "flagged-work"].includes(hash)) setTab(hash);
  }, [location.hash]);

  const daily = useMemo<DailyReportRow[]>(
    () =>
      state.employees
        .filter((employee) => employee.status === "active")
        .map((employee) => {
          const times = lk.job(employee.jobTypeId)?.scheduledTimes ?? [];
          const attendance = state.attendance[attKey(employee.id, reportDate)];
          const tasksRequired = attendance?.status !== "absent" && attendance?.status !== "leave";
          const statuses = tasksRequired
            ? times.map((time) => ({
                time,
                status: effectiveTaskStatus(
                  state.taskLogs[taskKey(employee.id, reportDate, time)]?.status,
                  time,
                  reportDate === today,
                  now,
                ),
              }))
            : [];
          const department = lk.dept(employee.departmentId);
          const taskStatuses = statuses.map(({ status }) => status);
          const done = taskStatuses.filter((status) => status === "completed").length;
          const missed = taskStatuses.filter((status) => status === "missed").length;
          const redo = taskStatuses.filter((status) => status === "needs_redo").length;
          return {
            emp: employee,
            deptId: employee.departmentId,
            dept: department?.name ?? "",
            group: department?.group ?? "station",
            assigned: statuses.length,
            done,
            missed,
            redo,
            compliance: pct(done, statuses.length),
            attendance: attendance?.status ?? "—",
            statuses,
          };
        }),
    [lk, now, reportDate, state, today],
  );

  const dailyDepartments = useMemo<DepartmentDailySummary[]>(
    () =>
      state.departments
        .map((department) => {
          const employees = daily.filter((row) => row.deptId === department.id);
          const assigned = employees.reduce((total, row) => total + row.assigned, 0);
          const done = employees.reduce((total, row) => total + row.done, 0);
          const present = employees.filter((row) => row.attendance === "present").length;
          return {
            id: department.id,
            name: department.name,
            zone: department.zone,
            group: department.group,
            employees,
            assigned,
            done,
            missed: employees.reduce((total, row) => total + row.missed, 0),
            redo: employees.reduce((total, row) => total + row.redo, 0),
            compliance: pct(done, assigned),
            attendance: pct(present, employees.length),
          };
        })
        .filter((summary) => summary.employees.length > 0),
    [daily, state.departments],
  );

  const visibleDailyDepartments = dailyDepartments.filter((summary) => summary.group === dailyGroup);
  const selectedDailyDepartment = dailyDepartments.find((summary) => summary.id === selectedDailyDeptId);

  const monthly = useMemo<MonthlyReportRow[]>(() => {
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
        const department = lk.dept(employee.departmentId);
        return {
          emp: {
            id: employee.id,
            name: employee.name,
            code: employee.code,
            hrmsEmployeeId: employee.hrmsEmployeeId,
          },
          deptId: employee.departmentId,
          dept: department?.name ?? "",
          group: department?.group ?? "station",
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

  const monthlyDepartments = useMemo<DepartmentMonthlySummary[]>(
    () =>
      state.departments
        .map((department) => {
          const employees = monthly.filter((row) => row.deptId === department.id);
          const assigned = employees.reduce((total, row) => total + row.assigned, 0);
          const done = employees.reduce((total, row) => total + row.done, 0);
          const average = (key: "attendance" | "score") =>
            employees.length
              ? Math.round(
                  (employees.reduce((total, row) => total + row[key], 0) / employees.length) * 10,
                ) / 10
              : 0;
          return {
            id: department.id,
            name: department.name,
            zone: department.zone,
            group: department.group,
            employees,
            assigned,
            done,
            compliance: pct(done, assigned),
            attendance: average("attendance"),
            score: average("score"),
          };
        })
        .filter((summary) => summary.employees.length > 0),
    [monthly, state.departments],
  );

  const visibleMonthlyDepartments = monthlyDepartments.filter((summary) => summary.group === monthlyGroup);
  const selectedMonthlyDepartment = monthlyDepartments.find(
    (summary) => summary.id === selectedMonthlyDeptId,
  );

  const hrmsEmployees = monthly.filter((row) => row.group === hrmsGroup);
  const hrmsGroupSummary = {
    employees: hrmsEmployees.length,
    assigned: hrmsEmployees.reduce((total, row) => total + row.assigned, 0),
    done: hrmsEmployees.reduce((total, row) => total + row.done, 0),
    present: hrmsEmployees.reduce((total, row) => total + row.daysWorked, 0),
    absent: hrmsEmployees.reduce((total, row) => total + row.absent, 0),
  };

  const monthLabel = formatMonthLabel(reportMonth);

  const hrmsRows = useMemo(
    () =>
      hrmsEmployees.map((row) => [
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
    [hrmsEmployees, monthLabel],
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
    void navigate({
      hash: next,
      hashScrollIntoView: false,
      resetScroll: false,
    });
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
        <section className="space-y-4" id="daily">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Operations view</p>
              <h3 className="mt-1 text-lg font-bold">Daily task control · {formatDateLabel(reportDate)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a work area and open a department card to review its employee task list.
              </p>
            </div>
            <ReportDatePicker label="Report date" value={reportDate} max={today} onChange={setReportDate} />
          </div>

          <ReportGroupToggle
            group={dailyGroup}
            stationCount={dailyDepartments.filter((summary) => summary.group === "station").length}
            colonyCount={dailyDepartments.filter((summary) => summary.group === "colony").length}
            onChange={(group) => {
              setDailyGroup(group);
              setSelectedDailyDeptId(null);
            }}
          />

          <div className={cn(
            "rounded-2xl border p-4",
            dailyGroup === "colony" ? "border-orange-200 bg-orange-50/60" : "border-primary/20 bg-primary/5",
          )}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <GroupIcon group={dailyGroup} />
                <div>
                  <h4 className={cn("font-bold", dailyGroup === "colony" ? "text-orange-950" : "text-primary")}>
                    {groupLabel(dailyGroup)} departments
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">{groupDescription(dailyGroup)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-right">
                <MiniStat label="Departments" value={String(visibleDailyDepartments.length)} />
                <MiniStat label="Employees" value={String(visibleDailyDepartments.reduce((total, item) => total + item.employees.length, 0))} />
                <MiniStat label="Compliance" value={`${pct(
                  visibleDailyDepartments.reduce((total, item) => total + item.done, 0),
                  visibleDailyDepartments.reduce((total, item) => total + item.assigned, 0),
                )}%`} />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleDailyDepartments.map((summary) => (
                <DailyDepartmentCard
                  key={summary.id}
                  summary={summary}
                  selected={selectedDailyDeptId === summary.id}
                  onClick={() => setSelectedDailyDeptId(summary.id)}
                />
              ))}
            </div>
          </div>

          {selectedDailyDepartment && selectedDailyDepartment.group === dailyGroup ? (
            <DailyDepartmentDetails summary={selectedDailyDepartment} date={reportDate} />
          ) : (
            <SelectionHint icon={ListChecks} text="Select a department card to open its employee task list." />
          )}
        </section>
      )}

      {activeTab === "monthly" && (
        <section className="space-y-3" id="monthly">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Performance view</p>
              <h3 className="mt-1 text-lg font-bold">Monthly performance · {monthLabel}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Compare score, attendance, and task completion by Station and Colony department.
              </p>
            </div>
            <ReportMonthPicker
              label="Performance month"
              value={reportMonth}
              max={today.slice(0, 7)}
              onChange={setReportMonth}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {(["station", "colony"] as ReportGroup[]).map((group) => {
              const departments = monthlyDepartments.filter((summary) => summary.group === group);
              const employees = departments.flatMap((summary) => summary.employees);
              const assigned = employees.reduce((total, row) => total + row.assigned, 0);
              const done = employees.reduce((total, row) => total + row.done, 0);
              const attendance = employees.length
                ? Math.round((employees.reduce((total, row) => total + row.attendance, 0) / employees.length) * 10) / 10
                : 0;
              const score = employees.length
                ? Math.round((employees.reduce((total, row) => total + row.score, 0) / employees.length) * 10) / 10
                : 0;
              const active = monthlyGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => {
                    setMonthlyGroup(group);
                    setSelectedMonthlyDeptId(null);
                  }}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                    active
                      ? group === "colony"
                        ? "border-orange-300 bg-orange-50 shadow-sm"
                        : "border-violet-300 bg-violet-50 shadow-sm"
                      : "border-border bg-card",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <GroupIcon group={group} />
                      <div>
                        <p className="font-bold">{groupLabel(group)} performance</p>
                        <p className="mt-1 text-xs text-muted-foreground">{departments.length} departments · {employees.length} employees</p>
                      </div>
                    </div>
                    <ChevronRight className={cn("size-5", active ? "text-violet-700" : "text-muted-foreground")} aria-hidden />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <MiniStat label="Compliance" value={`${pct(done, assigned)}%`} />
                    <MiniStat label="Attendance" value={`${attendance}%`} />
                    <MiniStat label="Score" value={`${score}%`} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-bold">{groupLabel(monthlyGroup)} department leaderboard</h4>
                <p className="mt-1 text-xs text-muted-foreground">Click a row to see employee-level monthly results.</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-violet-800">
                {visibleMonthlyDepartments.length} departments
              </span>
            </div>
            <div className="space-y-2">
              {visibleMonthlyDepartments.map((summary) => (
                <MonthlyDepartmentRow
                  key={summary.id}
                  summary={summary}
                  selected={selectedMonthlyDeptId === summary.id}
                  onClick={() => setSelectedMonthlyDeptId(summary.id)}
                />
              ))}
            </div>
          </div>
          {selectedMonthlyDepartment && selectedMonthlyDepartment.group === monthlyGroup ? (
            <MonthlyDepartmentDetails summary={selectedMonthlyDepartment} monthLabel={monthLabel} />
          ) : (
            <SelectionHint icon={Users} text="Select a department row to open its monthly employee list." />
          )}
          <p className="text-xs text-muted-foreground">
            Performance score = average of compliance and attendance percentages.
          </p>
        </section>
      )}

      {activeTab === "hrms-export" && (
        <section className="space-y-4" id="hrms-export">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-700 p-2 text-white">
                  <FileSpreadsheet className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Export workspace</p>
                  <h3 className="mt-1 text-lg font-bold text-emerald-950">HRMS workforce file</h3>
                  <p className="mt-1 text-sm text-emerald-950/70">
                    Prepare a clean employee summary for one work area at a time.
                  </p>
                </div>
              </div>
              <ReportMonthPicker
                label="Export month"
                value={reportMonth}
                max={today.slice(0, 7)}
                onChange={setReportMonth}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {(["station", "colony"] as ReportGroup[]).map((group) => {
              const rows = monthly.filter((row) => row.group === group);
              const assigned = rows.reduce((total, row) => total + row.assigned, 0);
              const done = rows.reduce((total, row) => total + row.done, 0);
              const active = hrmsGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setHrmsGroup(group)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                    active
                      ? group === "colony"
                        ? "border-orange-300 bg-orange-50 shadow-sm"
                        : "border-emerald-300 bg-emerald-50 shadow-sm"
                      : "border-border bg-card",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <GroupIcon group={group} />
                      <div>
                        <p className="font-bold">{groupLabel(group)} HRMS rows</p>
                        <p className="mt-1 text-xs text-muted-foreground">Selected month · {rows.length} employees</p>
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <MiniStat label="Rows" value={String(rows.length)} />
                    <MiniStat label="Assigned" value={String(assigned)} />
                    <MiniStat label="Completed" value={String(done)} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Ready to export</p>
                <h3 className="mt-1 font-bold">{groupLabel(hrmsGroup)} · {monthLabel}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hrmsGroupSummary.employees} employee rows with attendance and task totals.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SmallBadge>{hrmsGroupSummary.present} present days</SmallBadge>
                <SmallBadge>{hrmsGroupSummary.absent} absent days</SmallBadge>
                <button
                  onClick={() =>
                    downloadCsv(
                      `hrms-${hrmsGroup}-${reportMonth}.csv`,
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
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  <Download className="size-4" aria-hidden /> Download {groupLabel(hrmsGroup)} CSV
                </button>
              </div>
            </div>
            <div className="mt-4">
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
                rows={hrmsEmployees.map((row) => [
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
            </div>
          </div>
        </section>
      )}

      {activeTab === "flagged-work" && role === "admin" && <FlaggedWorkLog rows={flagged} />}
    </div>
  );
}

function groupLabel(group: ReportGroup) {
  return group === "colony" ? "Colony" : "Station";
}

function groupDescription(group: ReportGroup) {
  return group === "colony"
    ? "Residential colony roads, waste, drains, and vector-control work."
    : "Passenger-facing station areas, platforms, tracks, and amenities.";
}

function GroupIcon({ group }: { group: ReportGroup }) {
  const Icon = group === "colony" ? Home : Building2;
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
        group === "colony" ? "bg-orange-200 text-orange-800" : "bg-primary/15 text-primary",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

function ReportGroupToggle({
  group,
  stationCount,
  colonyCount,
  onChange,
}: {
  group: ReportGroup;
  stationCount: number;
  colonyCount: number;
  onChange: (group: ReportGroup) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <div>
        <p className="text-sm font-semibold">Work area</p>
        <p className="text-xs text-muted-foreground">Station and Colony are tracked separately.</p>
      </div>
      <div className="inline-flex rounded-lg border border-border bg-muted p-1" role="tablist" aria-label="Report work area">
        {([
          ["station", "Station", stationCount, Building2],
          ["colony", "Colony", colonyCount, Home],
        ] as [ReportGroup, string, number, typeof Building2][]).map(([value, label, count, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={group === value}
            onClick={() => onChange(value)}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
              group === value
                ? value === "colony"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", group === value ? "bg-white/20" : "bg-card")}>
              {count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function DailyDepartmentCard({
  summary,
  selected,
  onClick,
}: {
  summary: DepartmentDailySummary;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group rounded-xl border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{summary.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{summary.zone}</p>
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
          aria-hidden
        />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tabular-nums">{summary.compliance}%</p>
          <p className="text-xs text-muted-foreground">task compliance</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums">{summary.done}/{summary.assigned}</p>
          <p className="text-xs text-muted-foreground">completed</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-soft">
        <div className="h-full bg-success transition-all" style={{ width: `${summary.compliance}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <SmallBadge><Users className="mr-1 inline size-3" aria-hidden />{summary.employees.length} staff</SmallBadge>
        <SmallBadge>{summary.missed} missed</SmallBadge>
        <SmallBadge>{summary.redo} redo</SmallBadge>
      </div>
      <p className="mt-3 text-xs font-semibold text-primary">Open employee list <span aria-hidden>→</span></p>
    </button>
  );
}

function DailyDepartmentDetails({ summary, date }: { summary: DepartmentDailySummary; date: string }) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-4" aria-labelledby="daily-department-details">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Department detail</p>
          <h4 id="daily-department-details" className="mt-1 text-lg font-bold">{summary.name}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{summary.zone} · {formatDateLabel(date)}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Compliance" value={`${summary.compliance}%`} />
          <MiniStat label="Attendance" value={`${summary.attendance}%`} />
          <MiniStat label="Employees" value={String(summary.employees.length)} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {summary.employees.map((row) => (
          <div key={row.emp.id} className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.emp.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{row.emp.code} · {row.attendance}</p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums">{row.compliance}%</p>
                <p className="text-xs text-muted-foreground">{row.done}/{row.assigned} tasks complete</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {row.statuses.length === 0 ? (
                <SmallBadge>No tasks assigned</SmallBadge>
              ) : (
                row.statuses.map(({ time, status }) => (
                  <span key={`${row.emp.id}-${time}`} className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", taskStatusClass(status))}>
                    {time} · {taskStatusLabel(status)}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function taskStatusLabel(status: DailyTaskStatus) {
  return status === "needs_redo"
    ? "Needs redo"
    : status === "upcoming"
      ? "Upcoming"
      : status.charAt(0).toUpperCase() + status.slice(1);
}

function taskStatusClass(status: DailyTaskStatus) {
  if (status === "completed") return "bg-emerald-100 text-emerald-800";
  if (status === "missed") return "bg-red-100 text-red-800";
  if (status === "needs_redo") return "bg-orange-100 text-orange-800";
  return "bg-muted text-muted-foreground";
}

function MonthlyDepartmentRow({
  summary,
  selected,
  onClick,
}: {
  summary: DepartmentMonthlySummary;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid w-full gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-violet-400 md:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(80px,1fr))_24px] md:items-center",
        selected ? "border-violet-500 ring-2 ring-violet-200" : "border-border",
      )}
    >
      <div>
        <p className="font-semibold">{summary.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{summary.employees.length} employees · {summary.zone}</p>
      </div>
      <MiniStat label="Score" value={`${summary.score}%`} />
      <MiniStat label="Compliance" value={`${summary.compliance}%`} />
      <MiniStat label="Attendance" value={`${summary.attendance}%`} />
      <MiniStat label="Tasks" value={`${summary.done}/${summary.assigned}`} />
      <ChevronRight className="hidden size-5 text-muted-foreground md:block" aria-hidden />
    </button>
  );
}

function MonthlyDepartmentDetails({
  summary,
  monthLabel,
}: {
  summary: DepartmentMonthlySummary;
  monthLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-violet-200 bg-card p-4" aria-labelledby="monthly-department-details">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Employee performance list</p>
          <h4 id="monthly-department-details" className="mt-1 text-lg font-bold">{summary.name}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{summary.zone} · {monthLabel}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Score" value={`${summary.score}%`} />
          <MiniStat label="Attendance" value={`${summary.attendance}%`} />
          <MiniStat label="Employees" value={String(summary.employees.length)} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {summary.employees.map((row) => (
          <div key={row.emp.id} className="grid gap-3 rounded-xl border border-border bg-violet-50/30 p-3 md:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(80px,1fr))] md:items-center">
            <div>
              <p className="font-semibold">{row.emp.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{row.emp.code} · HRMS {row.emp.hrmsEmployeeId}</p>
            </div>
            <MiniStat label="Score" value={`${row.score}%`} />
            <MiniStat label="Compliance" value={`${row.compliance}%`} />
            <MiniStat label="Attendance" value={`${row.attendance}%`} />
            <MiniStat label="Days present" value={`${row.daysWorked}/${row.totalWorkingDays}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SelectionHint({ icon: Icon, text }: { icon: typeof ListChecks; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
      <Icon className="size-5 shrink-0 text-primary" aria-hidden />
      {text}
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