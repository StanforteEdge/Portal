## Goal

Move `apps/pwa` deployment from the current GitHub Actions server upload flow to Cloudflare Pages Git integration, while keeping API deployment on the existing server workflow. Also update the repository remote to `https://github.com/StanforteEdge/Portal`.

## Current State

- Git remote `origin` points to `git@github.com:edgdmedia/stanforteedge.git`.
- API deploys from `.github/workflows/deploy-api.yml` on `push` to `main`.
- `apps/pwa` currently deploys from `.github/workflows/deploy-pwa2.yml` on `push` to `main` by building in GitHub Actions and uploading `apps/pwa/dist` to a server over SCP.
- `apps/oldPWA` has a separate legacy workflow in `.github/workflows/deploy-pwa.yml` and is not part of this change.
- `apps/pwa` depends on `apps/shared` through `"@stanforte/shared": "file:../shared"`, so a successful production build needs repo-root workspace installation, not an isolated `apps/pwa` install.

## Desired Outcome

- `origin` uses `https://github.com/StanforteEdge/Portal`.
- `apps/pwa` deploys via Cloudflare Pages when commits land on `main`.
- GitHub Actions no longer deploys `apps/pwa` to the server.
- API continues deploying from GitHub Actions to the server on `push` to `main`.
- `apps/oldPWA` remains unchanged unless explicitly retired later.

## Deployment Ownership

### API

- Keep `.github/workflows/deploy-api.yml` active.
- API remains deployed from GitHub Actions to the existing server.
- No behavioral changes are required beyond making sure frontend workflow changes do not interfere with API deployment.

### PWA (`apps/pwa`)

- Cloudflare Pages becomes the single production deployment mechanism.
- GitHub Actions should stop handling `apps/pwa` deployment to avoid double deploys and drift between server-hosted and Cloudflare-hosted assets.
- The existing `.github/workflows/deploy-pwa2.yml` should be removed or converted into a non-deploy validation workflow if build verification is still desired in GitHub.

## Cloudflare Pages Configuration

Cloudflare Pages should be configured to build from the repository root so workspace dependencies resolve correctly.

### Required Settings

- Production branch: `main`
- Root directory: `/`
- Build command: `npm ci && npm run build:pwa2`
- Build output directory: `apps/pwa/dist`

### Why Root Build Is Required

- `apps/pwa` imports code from `apps/shared` via a local file dependency.
- Building from `apps/pwa` alone would not reliably install or link `apps/shared` in the same way the local workspace build does.
- Running the build from the repo root preserves the current workspace behavior and is the lowest-risk production setup.

## Environment Variables

The current PWA build expects these values during deployment:

- `VITE_API_BASE_URL`
- `VITE_APP_BASE_PATH`
- `VITE_APP_VERSION`
- `VITE_APP_COMMIT_SHA`

Cloudflare Pages must provide equivalent values.

### Required Variables

- `VITE_API_BASE_URL`: production API base URL used by the PWA.
- `VITE_APP_BASE_PATH`: deployment base path for the PWA in Cloudflare.

### Version Metadata Strategy

The current GitHub Actions workflow computes version metadata dynamically before building. That logic will no longer run once Cloudflare owns deployment, so the PWA needs one of these approaches:

1. Read version metadata from Cloudflare-provided environment variables where available.
2. Fall back to `apps/pwa/package.json` for app version and use a commit SHA env var when present.
3. If no commit SHA env var is available, use a stable fallback such as `"dev"` or `"unknown"` to keep builds deterministic.

The implementation should prefer a small app-side fallback strategy over trying to recreate the full GitHub Actions metadata script inside Cloudflare.

## Repository Changes

### Remote

- Update `origin` from `git@github.com:edgdmedia/stanforteedge.git` to `https://github.com/StanforteEdge/Portal`.

### GitHub Workflows

- Keep `.github/workflows/deploy-api.yml`.
- Disable the server deploy behavior for `apps/pwa` by removing or repurposing `.github/workflows/deploy-pwa2.yml`.
- Leave `.github/workflows/deploy-pwa.yml` unchanged because it targets `apps/oldPWA`, which is out of scope for this change.

## Recommended Workflow Outcome

After implementation:

- Work continues on `development`.
- When changes are merged or pushed into `main`:
  - GitHub Actions deploys the API.
  - Cloudflare Pages builds and deploys `apps/pwa`.
- `apps/shared` changes are automatically included because Cloudflare builds from repo root.

## Error Handling And Risk Notes

- If Cloudflare is configured with `apps/pwa` as the root directory instead of repo root, builds may fail because `apps/shared` is not installed the same way as the current workspace layout.
- If Cloudflare environment variables are incomplete, the PWA may build with broken API routing or missing version metadata.
- If `.github/workflows/deploy-pwa2.yml` is left active while Cloudflare deploys production, both systems may publish different frontend artifacts, creating confusion over what is live.

## Testing And Verification

### Before Cutover

- Confirm Cloudflare Pages project is connected to the correct GitHub repository.
- Confirm Pages production branch is `main`.
- Confirm root directory is `/`.
- Confirm build command and output directory match the workspace build.
- Confirm required `VITE_*` environment variables are present in Cloudflare.

### After Repo Changes

- Run `npm run build:pwa2` locally from repo root.
- Push a harmless change through `development` into `main`.
- Verify:
  - GitHub Actions API workflow still runs successfully.
  - Cloudflare Pages builds successfully from `main`.
  - The deployed PWA loads and talks to the production API.
  - Shared package changes are reflected in the built PWA.

## Files Expected To Change In Implementation

- `.github/workflows/deploy-pwa2.yml`
- Potentially `apps/pwa` build/version handling files if fallback metadata support is needed
- Optional docs describing the new production deployment path

## Out Of Scope

- Retiring `apps/oldPWA`
- Changing API hosting away from the existing server
- Reworking the monorepo structure or replacing `apps/shared` local dependency wiring
