# Replit setup

## Run the app

The project uses Bun and Vite/TanStack Start.

```sh
bun install
bun run dev -- --host 0.0.0.0 --port 5000
```

The Replit workflow is configured as **Start application** with the same
command and serves the web preview on port 5000.

## Verification

- Open the Replit Preview and confirm the Workforce Tracker dashboard loads at
  `/`.
- The left sidebar is organized by Operations, Reporting, and (for Admins)
  Administration. Its links open Dashboard, Daily compliance, Monthly
  performance, HRMS export, Flagged work log, and each Admin section.
- On the Dashboard, select a department card to open its task view, then use
  the Back to departments control to return to the overview.
- Switch the role selector to **Admin** to reveal the Admin sidebar modules and
  the Reports → Flagged work log module.
- Use the navigation to open `/admin` and `/reports`; each route and its
  hash-linked sections should render without a server error.
- In the Admin panel, verify Employees, Departments, Job types, Shifts,
  Supervisors, Attendance, and Audit are selectable. Attendance supports an
  optional reason; task editing supports Missed/Needs redo remarks.
- The app currently uses its local tracker data and does not require an
  external service or secret to start.