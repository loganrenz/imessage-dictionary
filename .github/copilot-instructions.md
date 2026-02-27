# GitHub Copilot Instructions

Read `AGENTS.md` at the project root for full project rules and conventions.

Key reminders:

- This is a **Nuxt 4 + Nuxt UI 4** app on **Cloudflare Workers** — no Node.js modules allowed.
- All frontend code goes in `app/` (Nuxt 4 structure). Use `USeparator` not `UDivider`.
- Every page must call `useSeo()` and a `useSchemaOrg()` helper.
- Use `useAsyncData`/`useFetch` for data fetching, never raw `$fetch` in setup.
- **CRITICAL**: If building a new app from this template, change package.json `name` and remove `origin` remote to prevent accidental pushes to the template repo.
