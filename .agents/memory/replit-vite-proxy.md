---
name: Replit Vite proxy
description: Host validation needed for Vite development servers shown through Replit preview.
---

Vite apps served through Replit's preview proxy need `server.allowedHosts` enabled
so generated `.replit.dev` hostnames are accepted.

**Why:** Binding the workflow to `0.0.0.0` and port 5000 alone still produced a
blocked-host page in the proxied browser.

**How to apply:** For imported Vite apps, keep the workflow on port 5000 and
explicitly allow the proxy hosts in the Vite server config before diagnosing
the issue as an application or routing failure.