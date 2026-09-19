---
name: Bun import setup
description: Environment-specific behavior seen when installing imported Bun projects in Replit.
---

For an imported Bun project, a successful dependency install can temporarily leave
the local executable links unavailable to package scripts. Re-running the same
lockfile install command before changing dependency versions restores the links.

**Why:** The first build reported `vite: command not found` even though the install
reported all packages present; a second unchanged install produced `node_modules/.bin/vite`
and the build passed.

**How to apply:** If a freshly imported Bun project reports a missing local CLI
after install, rerun the existing lockfile install once before editing manifests
or replacing the package manager.