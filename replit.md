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
- Use the navigation to open `/admin` and `/reports`; each route should render
  without a server error.
- The app currently uses its local tracker data and does not require an
  external service or secret to start.