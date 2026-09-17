import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { attKey, dateKey, taskKey } from "@/lib/tracker-data";
import { useLookups, useTracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Compliance Reports — Platform Workforce Tracker" },
      {
        name: "description",
        content:
          "Daily and monthly task compliance, attendance percentage and performance scores for every housekeeping worker.",
      },
      { property: "og:title", content: "Compliance Reports — Platform Workforce Tracker" },
      {
        property: "og:description",
        content:
          "Daily and monthly task compliance, attendance percentage and performance scores for every housekeeping worker.",
      },
    ],
  }),
  component: Reports,
});

const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Reports() {
  const { state, today } = useTracker();
  const lk = useLookups();
  const [tab, setTab] = useState<"daily" | "monthly">("daily");

  const daily = useMemo(() => {
    return state.employees
      .filter((e) => e.status === "active")
      .map((e) => {
        const times = lk.job(e.jobTypeId)?.scheduledTimes ?? [];
        const done = times.filter(
          (t) => state.taskLogs[taskKey(e.id, today, t)]?.status === "completed",
        ).length;
        return {
          emp: e,
          dept: lk.dept(e.departmentId)?.name ?? "",
          assigned: times.length,
          done,
          compliance: pct(done, times.length),
          attendance: state.attendance[attKey(e.id, today)]?.status ?? "—",
        };
      });
  }, [state, lk, today]);

  const byDept = useMemo(() => {
    const map = new Map<string, { assigned: number; done: number }>();
    for (const r of daily) {
      const cur = map.get(r.dept) ?? { assigned: 0, done: 0 };
      map.set(r.dept, { assigned: cur.assigned + r.assigned, done: cur.done + r.done });
    }
    return [...map.entries()];
  }, [daily]);

  const monthly = useMemo(() => {
    const now = new Date();
    const days: string[] = [];
    for (let d = 1; d <= now.getDate(); d++)
      days.push(dateKey(new Date(now.getFullYear(), now.getMonth(), d)));

    return state.employees
      .filter((e) => e.status === "active")
      .map((e) => {
        const times = lk.job(e.jobTypeId)?.scheduledTimes ?? [];
        let assigned = 0;
        let done = 0;
        let present = 0;
        let absent = 0;
        let leave = 0;
        for (const date of days) {
          const att = state.attendance[attKey(e.id, date)]?.status;
          if (att === "present") present += 1;
          else if (att === "absent") absent += 1;
          else if (att === "leave" || att === "half-day") leave += 1;
          if (att !== "present") continue;
          assigned += times.length;
          done += times.filter(
            (t) => state.taskLogs[taskKey(e.id, date, t)]?.status === "completed",
          ).length;
        }
        const compliance = pct(done, assigned);
        const attendance = pct(present, days.length);
        return {
          emp: e,
          dept: lk.dept(e.departmentId)?.name ?? "",
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
  }, [state, lk]);

  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-md border border-border bg-card p-1">
          {(["daily", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "min-h-10 flex-1 rounded text-sm font-medium capitalize",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            tab === "daily"
              ? downloadCsv(`daily-compliance-${today}.csv`, [
                  ["Code", "Name", "Department", "Assigned", "Completed", "Compliance %", "Attendance"],
                  ...daily.map((r) => [
                    r.emp.code,
                    r.emp.name,
                    r.dept,
                    r.assigned,
                    r.done,
                    r.compliance,
                    r.attendance,
                  ]),
                ])
              : downloadCsv(`monthly-report-${monthLabel}.csv`, [
                  [
                    "Code",
                    "Name",
                    "Department",
                    "Days worked",
                    "Tasks assigned",
                    "Tasks completed",
                    "Compliance %",
                    "Attendance %",
                    "Performance score",
                  ],
                  ...monthly.map((r) => [
                    r.emp.code,
                    r.emp.name,
                    r.dept,
                    r.daysWorked,
                    r.assigned,
                    r.done,
                    r.compliance,
                    r.attendance,
                    r.score,
                  ]),
                ])
          }
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

      {tab === "daily" ? (
        <>
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Department-wise · {today}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {byDept.map(([name, v]) => (
                <div key={name} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-sm font-semibold tabular-nums">{pct(v.done, v.assigned)}%</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-soft">
                    <div
                      className="h-full bg-success"
                      style={{ width: `${pct(v.done, v.assigned)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {v.done} of {v.assigned} tasks completed
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Table
            head={["Employee", "Dept", "Tasks", "Compliance", "Attendance"]}
            rows={daily.map((r) => [
              `${r.emp.name} (${r.emp.code})`,
              r.dept,
              `${r.done}/${r.assigned}`,
              `${r.compliance}%`,
              r.attendance,
            ])}
          />
        </>
      ) : (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Monthly report · {monthLabel}
          </h2>
          <Table
            head={["Employee", "Days", "Tasks", "Compliance", "Attendance", "Score"]}
            rows={monthly.map((r) => [
              `${r.emp.name} (${r.emp.code})`,
              String(r.daysWorked),
              `${r.done}/${r.assigned}`,
              `${r.compliance}%`,
              `${r.attendance}%`,
              `${r.score}%`,
            ])}
          />
          <p className="text-xs text-muted-foreground">
            Performance score = average of compliance % and attendance %.
          </p>
        </>
      )}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {r.map((c, j) => (
                <td key={j} className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
