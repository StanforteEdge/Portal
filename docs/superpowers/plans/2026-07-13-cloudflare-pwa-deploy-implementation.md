# Cloudflare PWA Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `apps/pwa` production deployment from the server-based GitHub Actions workflow to Cloudflare Pages Git integration on `main`, while keeping API deployment on the current server workflow and updating `origin` to `https://github.com/StanforteEdge/Portal`.

**Architecture:** Keep deployment ownership split by runtime. GitHub Actions continues owning API deploys through `.github/workflows/deploy-api.yml`, while Cloudflare Pages owns `apps/pwa` production builds from the repo root so the `apps/shared` workspace dependency continues to resolve correctly. Remove the duplicate server deploy path for `apps/pwa` and verify the existing Vite build metadata is sufficient for Cloudflare.

**Tech Stack:** GitHub Actions, Cloudflare Pages, Vite, npm workspaces, React, TypeScript

---

## File Map

- Modify: `.github/workflows/deploy-pwa2.yml` - remove or repurpose the server deploy workflow for `apps/pwa`.
- Verify only: `.github/workflows/deploy-api.yml` - remains the API deploy workflow.
- Verify only: `apps/pwa/vite.config.ts` - confirm build/version metadata remains valid under Cloudflare.
- Verify only: `apps/pwa/package.json` - keep root workspace build command `npm run build:pwa2`.
- No repo file: Git remote config - update local `origin` URL.
- No repo file: Cloudflare Pages project settings - confirm root build configuration and env vars.

### Task 1: Prove The PWA Build Works Without GitHub Deploy Metadata

**Files:**
- Verify: `apps/pwa/vite.config.ts:49-116`
- Verify: `apps/pwa/src/lib/VersionService.ts:16-125`
- Verify: `apps/pwa/src/pages/account/SettingsPage.tsx:9-203`

- [ ] **Step 1: Confirm the existing Vite config already supplies version metadata at build time**

Review this block in `apps/pwa/vite.config.ts` and keep it unchanged if it already exists exactly like this:

```ts
const buildDate = new Date().toISOString().slice(0, 10);
const builtAt = new Date().toISOString();

const BASE_COMMIT = 332; // set on 2026-04-27 — do not change
let commitCount = BASE_COMMIT;
try {
  commitCount = Number(execSync("git rev-list --count HEAD").toString().trim());
} catch {
  // not in a git repo (e.g. CI sandbox) — fall back to base
}
const buildPatch = Math.max(0, commitCount - BASE_COMMIT);
const buildVersion = `1.0.${buildPatch}`;

define: {
  "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
  "import.meta.env.VITE_APP_BUILD_DATE": JSON.stringify(buildDate),
  "import.meta.env.VITE_BUILD_VERSION": JSON.stringify(buildVersion),
  "import.meta.env.VITE_APP_BUILT_AT": JSON.stringify(builtAt),
}
```

Expected outcome: no code change is needed because Cloudflare builds from a Git checkout and this config already derives `VITE_APP_VERSION`, `VITE_BUILD_VERSION`, and `VITE_APP_BUILT_AT` locally.

- [ ] **Step 2: Run the PWA build from repo root to verify the Cloudflare command works locally**

Run: `npm run build:pwa2`

Expected output should include a successful Vite build ending with lines similar to:

```text
vite v5.x building for production...
... transformed ...
... built in ...
```

- [ ] **Step 3: Commit only if code changes were required in this task**

If no files changed, skip this commit step. If a minimal fallback fix was required, use:

```bash
git add apps/pwa/vite.config.ts apps/pwa/src/lib/VersionService.ts apps/pwa/src/pages/account/SettingsPage.tsx
git commit -m "fix(pwa): keep build metadata portable"
```

### Task 2: Remove The Duplicate `apps/pwa` Server Deploy Workflow

**Files:**
- Modify: `.github/workflows/deploy-pwa2.yml`

- [ ] **Step 1: Replace the existing deploy workflow with a disabled documentation stub**

Update `.github/workflows/deploy-pwa2.yml` to this exact content so GitHub no longer deploys `apps/pwa`, while preserving a clear explanation in-repo of the new ownership:

```yaml
name: Deploy PWA2 (Moved to Cloudflare)

on:
  workflow_dispatch:

jobs:
  info:
    runs-on: ubuntu-latest
    steps:
      - name: PWA2 deploy moved to Cloudflare Pages
        run: |
          echo "apps/pwa production deploys now run in Cloudflare Pages."
          echo "Production branch: main"
          echo "Build root: repository root"
          echo "Build command: npm ci && npm run build:pwa2"
          echo "Build output: apps/pwa/dist"
```

This keeps the workflow filename stable, avoids accidental server deploys, and records the Cloudflare handoff in the repo.

- [ ] **Step 2: Run a focused workflow sanity check by reading the file back**

Run: `git diff -- .github/workflows/deploy-pwa2.yml`

Expected diff shape:

```diff
-on:
-  push:
-    branches: [main]
-jobs:
-  deploy:
+on:
+  workflow_dispatch:
+jobs:
+  info:
```

- [ ] **Step 3: Commit the workflow change**

```bash
git add .github/workflows/deploy-pwa2.yml
git commit -m "chore(ci): hand pwa deploys to cloudflare"
```

### Task 3: Update The Repository Remote

**Files:**
- No repo files changed.

- [ ] **Step 1: Inspect the current remote before changing it**

Run: `git remote -v`

Expected current output should include:

```text
origin  git@github.com:edgdmedia/stanforteedge.git (fetch)
origin  git@github.com:edgdmedia/stanforteedge.git (push)
```

- [ ] **Step 2: Set the new HTTPS remote**

Run: `git remote set-url origin https://github.com/StanforteEdge/Portal`

Expected: no output.

- [ ] **Step 3: Verify the new remote**

Run: `git remote -v`

Expected output should include:

```text
origin  https://github.com/StanforteEdge/Portal (fetch)
origin  https://github.com/StanforteEdge/Portal (push)
```

### Task 4: Verify Cloudflare Pages Production Settings

**Files:**
- No repo files changed.

- [ ] **Step 1: Check the Pages production branch is `main`**

In Cloudflare Pages UI, verify the production branch value is:

```text
main
```

- [ ] **Step 2: Check the build runs from repo root so `apps/shared` remains available**

In Cloudflare Pages UI, verify these exact settings:

```text
Root directory: /
Build command: npm ci && npm run build:pwa2
Build output directory: apps/pwa/dist
```

- [ ] **Step 3: Confirm required environment variables exist in Cloudflare**

In Cloudflare Pages UI, verify at least these values are defined for production:

```text
VITE_API_BASE_URL=<production api url>
VITE_APP_BASE_PATH=/
```

If your deployed app is hosted below a subpath instead of domain root, replace `/` with that subpath, for example:

```text
VITE_APP_BASE_PATH=/portal/
```

- [ ] **Step 4: Save a short operator note in the implementation PR or handoff comment**

Use this exact note text somewhere visible to the next operator:

```text
apps/pwa production deploys are now owned by Cloudflare Pages, built from repo root so apps/shared resolves correctly. GitHub Actions still deploys only the API.
```

### Task 5: End-To-End Verification On `main`

**Files:**
- Verify only: `.github/workflows/deploy-api.yml`
- Verify only: Cloudflare Pages deployment logs

- [ ] **Step 1: Confirm the worktree is clean except for intended changes**

Run: `git status --short`

Expected output: only the intended workflow change should appear before pushing, plus any pre-existing unrelated files that must be intentionally left alone.

- [ ] **Step 2: Push the branch and land it on `main` using the repo’s normal promotion path**

Run the project’s normal branch promotion flow from `development` to `main`.

Expected result:

```text
Code lands on main
```

- [ ] **Step 3: Verify GitHub Actions still deploys the API**

Check the `Deploy API` workflow run for the `main` commit.

Expected result:

```text
Workflow status: success
```

- [ ] **Step 4: Verify Cloudflare Pages deploys the PWA from the same `main` commit**

Check the Cloudflare Pages deployment log for the `main` commit.

Expected log shape:

```text
npm ci
npm run build:pwa2
... vite build success ...
Deployment successful
```

- [ ] **Step 5: Smoke-test the live PWA**

Verify these behaviors in the deployed app:

```text
Login page loads
Static assets load without 404s
API calls point to the production API base URL
Routes work under the configured base path
Settings page shows version/build information
```

- [ ] **Step 6: Commit only if verification required a repo change**

If you had to make a follow-up repo fix after verification, use:

```bash
git add <exact files>
git commit -m "fix(pwa): align cloudflare production build"
```

## Self-Review Checklist

- Spec coverage check: remote update, Cloudflare ownership, root build for `apps/shared`, workflow disablement, environment requirements, and production verification are all covered by Tasks 1-5.
- Placeholder scan: no `TODO`, `TBD`, or implied steps remain.
- Type consistency: all file paths, workflow names, and env vars match the current repo state and approved design.
