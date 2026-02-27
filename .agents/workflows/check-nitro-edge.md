---
description: Audit Nitro endpoints for edge compatibility and best practices
---

This workflow ensures server architecture is properly structured for Cloudflare Workers (V8 isolates).

1. **Check for Node.js built-ins**
   - Cloudflare Workers using the ES Module format do not support legacy Node.js APIs (`fs`, `path`, `crypto`, `child_process`).
     // turbo
     `npx grep -rnE "import .* from 'fs'|import .* from 'path'|import .* from 'crypto'" server/ || echo "No Node.js core modules found (pass)"`
   - _Note:_ Web Crypto (`crypto.subtle`) is a global browser API and is perfectly safe. Avoid `import crypto from 'node:crypto'`.

2. **Check for D1 Bindings and Middleware injection**
   - Verify that D1 database instances are initialized safely using the Singleton pattern to prevent cold-start thrashing.
   - Check `server/middleware/d1.ts` to ensure the binding is injected into the context correctly.

3. **Verify API route structure and naming**
   - Nitro endpoint files should follow the `[name].[method].ts` pattern (e.g., `todos.get.ts`).
     // turbo
     `find server/api -type f -not -name "*.*.ts" | grep -v "\.gitkeep" || echo "All API routes follow method naming (pass)"`
   - Review methods to ensure `GET` routes do not execute mutations (use `POST`/`PATCH`/`DELETE`).

4. **Verify Error Handling**
   - Ensure Nitro endpoints throw properly structured errors using `createError()` from `h3` and not native throw/Error which may leak server internals to the edge.
