---
description:
  Sync template infrastructure and layer code to fleet apps (all or single)
---

# Sync Fleet

Pushes template infrastructure files and layer code from `narduk-nuxt-template`
to fleet apps in `~/new-code/template-apps/`.

> [!IMPORTANT] All commands run from the **template repo root**:
> `~/new-code/narduk-nuxt-template`

---

## 0. Pre-flight — ask the user

Ask: **"Sync all fleet apps, or a specific app? (e.g. `tide-check`)"**

- If the user names one or more apps → use the **Single / Filtered** path (Step
  2a).
- If the user says "all" → use the **Full Fleet** path (Step 2b).

---

## 1. Ensure template is clean

// turbo

```bash
cd ~/new-code/narduk-nuxt-template && git status --porcelain
```

If output is non-empty, stop and tell the user:

> Template has uncommitted changes. Commit or stash before syncing.

---

## 2a. Single / Filtered App Sync

For a single app (e.g. `tide-check`), run both phases manually:

### Phase 1 — Sync template config files

// turbo

```bash
cd ~/new-code/narduk-nuxt-template && npx tsx tools/sync-template.ts ~/new-code/template-apps/<app-name>
```

### Phase 2 — Update layer code

// turbo

```bash
cd ~/new-code/template-apps/<app-name> && npx tsx tools/update-layer.ts --from ~/new-code/narduk-nuxt-template --skip-quality
```

### Phase 3 — Quality check

// turbo

```bash
cd ~/new-code/template-apps/<app-name> && pnpm quality
```

### Phase 4 — Review & commit

// turbo

```bash
cd ~/new-code/template-apps/<app-name> && git diff --stat && git add -A && git commit -m "chore: sync with template $(cd ~/new-code/narduk-nuxt-template && git rev-parse --short HEAD)"
```

> [!TIP] To sync multiple specific apps, repeat steps 2a for each, or use the
> `--apps` flag in step 2b.

---

## 2b. Full Fleet Sync (all apps, parallel)

// turbo

```bash
cd ~/new-code/narduk-nuxt-template && bash scripts/sync-fleet-local.sh --auto-commit
```

### Available flags

| Flag                 | Description                               |
| -------------------- | ----------------------------------------- |
| `--dry-run`          | Preview changes without writing           |
| `--skip-quality`     | Skip `pnpm quality` per app               |
| `--auto-commit`      | Auto-commit each app after sync           |
| `--apps "app1,app2"` | Sync only specific apps (comma-separated) |
| `--jobs N`           | Number of parallel workers (default: 4)   |
| `--sequential`       | Disable parallelism (same as `--jobs 1`)  |

### Examples

```bash
# Dry-run all apps
bash scripts/sync-fleet-local.sh --dry-run

# Sync two specific apps with auto-commit
bash scripts/sync-fleet-local.sh --apps "tide-check,flashcard-pro" --auto-commit

# Full fleet, skip quality, 8 workers
bash scripts/sync-fleet-local.sh --skip-quality --auto-commit --jobs 8
```

---

## 3. (Optional) Sync workflows to fleet

If agent workflow files (`.agents/workflows/`) were updated:

// turbo

```bash
cd ~/new-code/narduk-nuxt-template && npx tsx tools/sync-workflows-to-fleet.ts --apply --prune
```

---

## 4. (Optional) Sync Doppler canonical secrets

If secrets in `0_global-canonical-tokens` changed:

// turbo

```bash
cd ~/new-code/narduk-nuxt-template && npx tsx tools/sync-canonical-to-fleet.ts --apply
```

---

## 5. Post-sync health check (single app)

// turbo

```bash
cd ~/new-code/template-apps/<app-name> && npx tsx tools/check-sync-health.ts
```
