# Railway Platform Workforce & Task Compliance Tracker — v3 Update
### Replit Update Prompt (Department Drill-Down + Remarks/Quality Flag) + Updated Dummy Data

---

## WHAT'S CHANGING FROM v2 (context only — don't paste this section)

- Dashboard becomes **department-first**: pick a department → see only that department's employees → mark work. Not a flat all-employees list anymore.
- New **Remarks** field on task marking, for when work is done badly (not just missed).
- New task status: `needs_redo` — separate from `missed`, because "not done" and "done poorly" are different problems for the client.
- New Admin report: **Flagged Work Log** — every remark, searchable, for accountability/audits.
- Everything from v1/v2 (sidebar, task/attendance marking, HRMS export, roles) **stays as-is**.

---

## PART 1 — REPLIT UPDATE PROMPT (paste into the existing Repl's Agent chat)

```
This is an UPDATE to the existing "Platform Workforce Tracker" app (React +
TypeScript + Tailwind, Node.js + Express, PostgreSQL). The app already has
sidebar navigation, task/attendance marking, and Reports (Daily/Monthly/HRMS
Export) working. DO NOT rebuild from scratch. Add the following on top of
what exists, without breaking current functionality.

1. DEPARTMENT-WISE DRILL-DOWN NAVIGATION (replaces flat Dashboard list)

   Dashboard becomes two-level, both within the SAME screen (view-state
   change, not a route navigation/page reload):

   Level 1 — Department Overview (default view on Dashboard):
   - A grid/list of department cards. Supervisor sees only their assigned
     department(s); Admin sees all.
   - Each card shows: department name, employee count, today's task
     completion % , today's attendance %, count of pending/missed/
     flagged items (small colored badges).
   - Tapping a card opens Level 2 for that department.

   Level 2 — Department Task View:
   - Filtered to employees in the selected department only.
   - Same marking UI as before: employee rows, attendance toggle, task tap
     targets per scheduled time.
   - A "← Back to Departments" control at the top returns to Level 1
     instantly (in-app state change, no reload).
   - Filter chips within this view: Shift / Missed Only / Flagged Only.

   This drill-down applies to the Dashboard (marking flow) only. The
   existing sidebar CRUD links (Departments, Employees, etc.) are unchanged.

2. REMARKS / QUALITY FLAG ON TASK MARKING

   Extend TaskLog.status from (pending/completed/missed) to:
   (pending / completed / missed / needs_redo)

   - `needs_redo` = the worker attempted the task but it wasn't done
     properly (distinct from `missed`, where nothing happened at all).

   Add TaskLog.remarks (text, nullable):
   - REQUIRED when status is set to `missed` or `needs_redo`.
   - Optional when status is `completed` (supervisor can still leave a
     note if they want).

   UI: tapping a task cycles/opens a small inline control (not a full-
   screen modal) directly under that employee's row — a compact status
   picker (Done / Missed / Needs Redo) plus, if Missed or Needs Redo is
   picked, a short text input appears inline for the remark before it
   saves. Keep this lightweight — it should not break the "no multi-step
   wizard" rule for the common case (marking something Done stays a
   single tap with no extra UI appearing).

   Also add Attendance.remarks (text, nullable) — optional free-text
   reason field for Half-day/Leave/Absent entries (e.g. "informed sick",
   "left early — family emergency"). Optional, not required.

3. NEW ADMIN REPORT — FLAGGED WORK LOG

   Add to the Reports section (Admin only): a searchable log of every
   TaskLog entry where status is `missed` or `needs_redo` and has a
   remark. Columns: date, department, employee, task, scheduled time,
   status, remark, marked_by. Filterable by department, employee, date
   range, status. This becomes the vendor's internal accountability
   record — export as CSV alongside the existing HRMS export.

4. DATA MODEL CHANGES
   - TaskLog.status: extend enum to include `needs_redo`
   - TaskLog.remarks: text, nullable (conditionally required per above)
   - Attendance.remarks: text, nullable, optional

5. KEEP UNCHANGED
   - Sidebar navigation and item sets (Admin vs Supervisor) from v2.
   - HRMS Export screen and its column structure.
   - Color coding: green = completed, red = missed, amber = pending,
     add a distinct color (e.g. orange) for `needs_redo` so it's visually
     different from a plain miss.
   - Mobile-first, 44px tap targets, no confirmation modals for the
     routine "mark as done" action.

6. MIGRATION NOTE
   Additive only: new enum value, two new nullable text columns. Do not
   touch existing TaskLog/Attendance history. Backfill remarks as NULL
   for all past entries.
```

---

## PART 2 — UPDATED DUMMY DATA

### 2.1 Departments & Job Types (unchanged from v2)

| Department | Job Role | Frequency/Day | Scheduled Times |
|---|---|---|---|
| Platform Sweeping | Platform Sweeper | 4 | 06:00, 10:00, 14:00, 18:00 |
| Washroom Cleaning | Washroom/Toilet Cleaner | 6 | 05:30, 08:00, 11:00, 14:00, 17:00, 20:00 |
| Garbage Collection | Garbage Collector | 3 | 07:00, 13:00, 19:00 |
| Water Booth Maintenance | Water Point Attendant | 2 | 09:00, 16:00 |
| Waiting Room Upkeep | Waiting Room Cleaner | 3 | 07:30, 12:30, 17:30 |
| Foot Overbridge (FOB) Cleaning | FOB Cleaner | 2 | 08:30, 15:30 |
| Pest Control & Sanitization | Sanitization Worker | 1 | 06:30 |

### 2.2 Department Overview — Level 1 dummy summary (15-Sep-2026)

| Department | Employees | Completion % Today | Attendance % Today | Pending | Missed | Flagged (Needs Redo) |
|---|---|---|---|---|---|---|
| Platform Sweeping | 2 | 62.5% | 100% | 1 | 1 | 0 |
| Washroom Cleaning | 2 | 88.9% | 100% | 1 | 0 | 1 |
| Garbage Collection | 2 | 66.7% | 50% | 0 | 1 | 0 |
| Water Booth Maintenance | 1 | 100% | 100% | 0 | 0 | 0 |
| Waiting Room Upkeep | 2 | 0% | 100% | 6 | 0 | 0 |
| FOB Cleaning | 2 | 50% | 100% | 1 | 0 | 0 |
| Pest Control | 1 | 100% | 100% | 0 | 0 | 0 |

### 2.3 Sample Task Completion Log with Remarks — 15-Sep-2026 (extends v2 log)

| Emp Code | Job Type | Scheduled Time | Status | Remarks | Marked By | Marked At |
|---|---|---|---|---|---|---|
| EMP-101 | Sweeping | 06:00 | Completed | — | Supervisor: R. Kulkarni | 06:05 |
| EMP-101 | Sweeping | 10:00 | Completed | — | Supervisor: R. Kulkarni | 10:12 |
| EMP-101 | Sweeping | 14:00 | Missed | "Worker not on platform at check time" | Supervisor: R. Kulkarni | 14:20 |
| EMP-101 | Sweeping | 18:00 | Pending | — | — | — |
| EMP-103 | Washroom Cleaning | 05:30 | Completed | — | Supervisor: S. Deshmukh | 05:33 |
| EMP-103 | Washroom Cleaning | 08:00 | Needs Redo | "Floor still wet/dirty near urinals, sent back to redo" | Supervisor: S. Deshmukh | 08:10 |
| EMP-103 | Washroom Cleaning | 11:00 | Completed | — | Supervisor: S. Deshmukh | 11:07 |
| EMP-105 | Garbage Collection | 07:00 | Completed | — | Supervisor: R. Kulkarni | 07:15 |
| EMP-105 | Garbage Collection | 13:00 | Missed | "Bin not emptied, no worker response" | Supervisor: R. Kulkarni | 13:25 |
| EMP-107 | Water Booth | 09:00 | Completed | — | Supervisor: S. Deshmukh | 09:02 |
| EMP-110 | FOB Cleaning | 08:30 | Completed | — | Supervisor: R. Kulkarni | 08:40 |

### 2.4 Sample Flagged Work Log (Admin report — pulls Missed + Needs Redo rows only)

| Date | Department | Employee | Task | Scheduled Time | Status | Remark | Marked By |
|---|---|---|---|---|---|---|---|
| 15-Sep-2026 | Platform Sweeping | Ramesh Yadav (EMP-101) | Sweeping | 14:00 | Missed | Worker not on platform at check time | R. Kulkarni |
| 15-Sep-2026 | Washroom Cleaning | Anita More (EMP-103) | Washroom Cleaning | 08:00 | Needs Redo | Floor still wet/dirty near urinals, sent back to redo | S. Deshmukh |
| 15-Sep-2026 | Garbage Collection | Santosh Gaikwad (EMP-105) | Garbage Collection | 13:00 | Missed | Bin not emptied, no worker response | R. Kulkarni |

### 2.5 Sample Attendance with Remarks (extends v2 attendance data)

| Emp Code | Date | Status | Remarks |
|---|---|---|---|
| EMP-106 | 15-Sep-2026 | Absent | "Informed sick via phone" |
| EMP-109 | 10-Sep-2026 | Half-day | "Left early — family emergency" |

---

**Handoff note:** paste Part 1 into the existing Repl's Agent chat as an additive update. Part 2's Flagged Work Log and department-summary rows are for seeding/demoing the new views once the migration runs — the existing v2 employee/task/HRMS dummy data doesn't need to be re-entered.
