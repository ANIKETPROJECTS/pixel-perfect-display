# Railway Platform Workforce & Task Compliance Tracker — v4 Update
### Full Department & Task Master (mapped to the vendor's actual tender scope) + Updated Dummy Data

---

## WHAT'S CHANGING FROM v3 (context only — don't paste this section)

- The 7-department placeholder list used since v1 is **replaced** with a full set mapped directly to the client's real Railway tender document (Annexure-3 — Guntakal Station schedule of cleaning), covering **every Station activity (17 items) and every Colony activity (6 items)**.
- Colony is kept as its own department group — it's a separate work-stream (residential colony, not platform), per your call to include it.
- App structure (sidebar, department drill-down, remarks/needs_redo, HRMS export) from v2/v3 is unchanged — this update is data/seed-scope only.

---

## PART 1 — REPLIT UPDATE PROMPT ADDENDUM (paste into the existing Repl's Agent chat)

```
This is a SEED DATA update to the existing "Platform Workforce Tracker" app.
No schema or feature changes — the app already supports Departments, Job
Types (with frequency_per_day and scheduled_times), department drill-down
navigation, and Remarks/needs_redo from prior updates.

REPLACE the current placeholder Department + JobType seed data with the
official set in Part 2.1 below. This set is mapped directly from the
client's actual Railway housekeeping tender (Annexure-3), covering all
Station activities and all Colony activities — so department navigation,
task marking, and reports reflect the real contract scope instead of a
placeholder example.

Group Colony departments visually/separately from Station departments in
the Department Overview (Level 1 drill-down screen) — e.g. a toggle or
section header "Station" vs "Colony" — since they're different physical
zones with likely different supervisors.

Re-run the seed script with this data. Existing TaskLog/Attendance history
tied to the old placeholder departments can be discarded since this is
still pre-production demo data, not live client data.
```

---

## PART 2 — FULL DUMMY DATA (mapped to actual tender scope)

### 2.1 Department & Job Type Master — STATION (11 departments, 17 tender line items)

| # | Department | Job Type(s) | Frequency | Source Basis (Tender Item) |
|---|---|---|---|---|
| 1 | Platforms | Platform Sweeping/Mopping/Scrubbing | 5x/day | Item 1 — Platforms (1-7) |
| | | Tap Booths & Pedestal Washing | 1x/day | Item 4 — Tap Booths & Seats |
| | | Columns with Dadoos Cleaning | 1x/day | Item 5 — Columns with Dadoos |
| 2 | Tracks | Track Sweeping & Apron Washing | 3x/day | Item 2 — Tracks (1-7) |
| 3 | Foot Over Bridges (FOB) | FOB Sweeping, Dusting, Staircases | 2x/day | Item 3 — FOB (4 Nos.) |
| 4 | Waiting Halls & Retiring Rooms | Sweeping, Mopping, Spot Washing | 5x/day | Item 6 — Waiting Halls/Retiring Rooms |
| 5 | Concourse & Offices | Concourse Area Cleaning | 2x/day | Item 7 — Concourse (New building + Old booking office) |
| | | Office Sweeping/Mopping/Sanitary | 2x/day | Item 8 — All Offices incl. wall-cladding |
| | | Wall Cladding Cleaning (up to 10ft granite) | 1x/day | Item 9 — Wall Cladding |
| 6 | Circulating Area | Sweeping & Garbage Collection | 2x/day | Item 10 — Circulating Area |
| 7 | Cobweb & Dusting | Cobweb Removal (roofs, FOBs, electricals) | Weekly | Item 11 — Cobweb removal |
| 8 | Sanitary Amenities & Drains | Sanitary Amenities Cleaning | 6x/day | Item 12 — Sanitary Amenities |
| | | Drains Cleaning (5 open drains) | 1x/day | Item 13 — Drains |
| | | Dustbin Cleaning + Biodegradable Covers | 3x/day | Item 14 — Dust Bins |
| 9 | Garbage & Waste Management | Garbage Collection & Disposal | 3x/day (trips) | Item 14 — Garbage collection activity |
| 10 | Pest & Rodent Control | Pest Control Activity | 2x/day | Item 15 — Pest control |
| | | Rodent Control Activity | Fortnightly | Item 15 — Rodent control |
| 11 | Periodic & Specialized | Glass Cleaning | Once/4 months | Item 16 — Glass Cleaning |
| | | SS Dustbin Stand Provision | As-needed (asset, not recurring task) | Item 17 — Dustbin stand provision |

### 2.2 Department & Job Type Master — COLONY (1 department group, 6 tender line items)

| # | Department | Job Type(s) | Frequency | Source Basis (Tender Item) |
|---|---|---|---|---|
| 12 | Colony Housekeeping | Road Sweeping (North & South colony) | 1x/day | Colony Item 1 — Roads |
| | | Open Area Sweeping | 1x/day | Colony Item 2 — Open areas |
| | | Colony Garbage Collection & Disposal | Daily | Colony Item 3 — Garbage collection |
| | | Colony Drains Cleaning | 1x/day + weekly desilting | Colony Item 4 — Drains area |
| | | Vector Control (Anti-larval/mosquito) | Weekly | Colony Item 5 — Vector control |
| | | Fogging Activities | Weekly/Fortnightly | Colony Item 6 — Fogging |

*(Recommend flagging Colony as a visually distinct section in the app — different physical zone, likely a different supervisor team than Station.)*

### 2.3 Shift Timings (unchanged)

| Shift | Start | End |
|---|---|---|
| Morning | 06:00 | 14:00 |
| Evening | 14:00 | 22:00 |
| Night | 22:00 | 06:00 |

### 2.4 Manpower Target Reference (from client's own reference system, Tirupati station — useful benchmark for staffing ratios)

| Role | Shift 1 | Shift 2 | Shift 3 |
|---|---|---|---|
| Housekeeper | 56 | 34 | 15 |
| Machine Operator | 6 | 3 | 0 |
| Pest Control | 1 | 1 | 0 |
| Supervisor | 3 | 3 | 1 |
| Driver (General) | 1 | — | — |
| Project Manager (General) | 1 | — | — |

*(Included for context on realistic staffing scale — the app's dummy employee list below is a small representative sample, not a full 100+ roster.)*

### 2.5 Sample Employees (mapped across the full department set)

| Emp Code | HRMS ID | Name | Department | Job Type | Shift |
|---|---|---|---|---|---|
| EMP-101 | HR-8801 | Ramesh Yadav | Platforms | Platform Sweeping | Morning |
| EMP-102 | HR-8802 | Suresh Pawar | Platforms | Tap Booths & Pedestal Washing | Evening |
| EMP-103 | HR-8803 | Anita More | Sanitary Amenities & Drains | Sanitary Amenities Cleaning | Morning |
| EMP-104 | HR-8804 | Kavita Jadhav | Sanitary Amenities & Drains | Drains Cleaning | Evening |
| EMP-105 | HR-8805 | Santosh Gaikwad | Garbage & Waste Management | Garbage Collection & Disposal | Morning |
| EMP-106 | HR-8806 | Vijay Shinde | Garbage & Waste Management | Garbage Collection & Disposal | Night |
| EMP-107 | HR-8807 | Meena Kamble | Tracks | Track Sweeping & Apron Washing | Morning |
| EMP-108 | HR-8808 | Prakash Salve | Waiting Halls & Retiring Rooms | Sweeping, Mopping | Morning |
| EMP-109 | HR-8809 | Deepak Rane | Waiting Halls & Retiring Rooms | Sweeping, Mopping | Evening |
| EMP-110 | HR-8810 | Sunita Bhosale | Foot Over Bridges | FOB Sweeping & Dusting | Morning |
| EMP-111 | HR-8811 | Ganesh Naik | Concourse & Offices | Office Sweeping/Mopping | Evening |
| EMP-112 | HR-8812 | Rekha Chavan | Pest & Rodent Control | Pest Control Activity | Morning |
| EMP-113 | HR-8813 | Manoj Thorat | Circulating Area | Sweeping & Garbage Collection | Morning |
| EMP-114 | HR-8814 | Sneha Karpe | Cobweb & Dusting | Cobweb Removal | Morning |
| EMP-115 | HR-8815 | Ajay Pandit | Colony Housekeeping | Road Sweeping | Morning |
| EMP-116 | HR-8816 | Poonam Khedkar | Colony Housekeeping | Colony Garbage Collection | Morning |

### 2.6 Sample Task Completion Log with Remarks — 15-Sep-2026 (spans Station + Colony)

| Emp Code | Job Type | Scheduled Time | Status | Remarks | Marked By |
|---|---|---|---|---|---|
| EMP-101 | Platform Sweeping | 06:00 | Completed | — | R. Kulkarni |
| EMP-103 | Sanitary Amenities Cleaning | 08:00 | Needs Redo | "Floor still wet near urinals, sent back" | S. Deshmukh |
| EMP-105 | Garbage Collection & Disposal | 13:00 | Missed | "Bin not emptied, no worker response" | R. Kulkarni |
| EMP-107 | Track Sweeping & Apron Washing | 10:00 | Completed | — | R. Kulkarni |
| EMP-112 | Pest Control Activity | 06:30 | Completed | — | R. Kulkarni |
| EMP-114 | Cobweb Removal | — (weekly) | Completed | "Done for this week's cycle" | S. Deshmukh |
| EMP-115 | Road Sweeping (Colony) | 07:00 | Completed | — | A. Bhosale (Colony Supervisor) |
| EMP-116 | Colony Garbage Collection | 09:00 | Missed | "Truck delayed, collection pending" | A. Bhosale (Colony Supervisor) |

### 2.7 Sample Monthly Report — September 2026, as of 15th

| Emp Code | Name | Department | Tasks Assigned | Tasks Completed | Compliance % | Attendance % | Performance Score |
|---|---|---|---|---|---|---|---|
| EMP-101 | Ramesh Yadav | Platforms | 75 | 68 | 90.7% | 93.3% | 92.0% |
| EMP-103 | Anita More | Sanitary Amenities & Drains | 90 | 82 | 91.1% | 93.3% | 92.2% |
| EMP-105 | Santosh Gaikwad | Garbage & Waste Mgmt | 45 | 36 | 80.0% | 80.0% | 80.0% |
| EMP-115 | Ajay Pandit | Colony Housekeeping | 15 | 15 | 100% | 100% | 100% |

### 2.8 Sample HRMS Export (unchanged column structure, now spanning full department set)

| employee_code | hrms_employee_id | employee_name | department | month | total_working_days | days_present | days_absent | attendance_pct | tasks_assigned | tasks_completed | task_compliance_pct |
|---|---|---|---|---|---|---|---|---|---|---|---|
| EMP-101 | HR-8801 | Ramesh Yadav | Platforms | Sep-2026 | 15 | 14 | 1 | 93.3% | 75 | 68 | 90.7% |
| EMP-115 | HR-8815 | Ajay Pandit | Colony Housekeeping | Sep-2026 | 15 | 15 | 0 | 100% | 15 | 15 | 100% |

---

**Handoff note:** Part 2.1 + 2.2 together are the full official department/task master — this is the table to hand to your developer (or paste into Replit) as the authoritative seed data. Everything else in this file (employees, logs, reports) is illustrative sample data built on top of that real structure, not from the tender doc itself.
