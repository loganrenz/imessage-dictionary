---
description:
  Build and deploy locally via wrangler — refuses to deploy a dirty repo
---

// turbo-all

## Steps

1. **Guard: Refuse to deploy a dirty repo.** The working tree must be clean (all
   changes committed).

```bash
git status --porcelain
```

- If the output is **empty** → working tree is clean. Continue to step 2.
- If the output is **non-empty** → there are uncommitted changes. **Stop here.**
  Stage and commit all changes first:
  ```bash
  git add -A && git commit -m "<conventional commit message>"
  ```
  Then re-run this workflow from the top.

2. Run D1 migrations against the **remote** database (if applicable):

```bash
cd apps/web && CMD=$(node -p "require('./package.json').scripts['db:migrate']?.replaceAll('--local', '--remote') || ''") && [ -n "$CMD" ] && eval "$CMD" || echo "No db:migrate script — skipping."
```

3. Build and deploy to Cloudflare Workers:

```bash
pnpm run ship
```

4. Push the committed code to the remote (good practice, separate from deploy):

```bash
git push
```

5. Report success to the user — include the deployed URL from wrangler output.
