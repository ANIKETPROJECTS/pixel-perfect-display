---
name: Hash-linked SSR sections
description: Safe pattern for hash-addressable tabs in TanStack Start SSR routes.
---

Hash-linked section selection must happen in an effect after the first render,
not in the initial state initializer.

**Why:** Reading `window.location.hash` during the first render made server and
client tabs differ and caused hydration mismatch warnings in the preview.

**How to apply:** Render the deterministic default tab on server and client,
then read the hash in `useEffect` and update the selected section after mount.