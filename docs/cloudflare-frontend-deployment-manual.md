# Cloudflare Frontend Deployment Manual

This manual documents how to deploy the frontend from this repository to Cloudflare.

## Scope

This guide covers only the frontend deployment for `apps/pwa`.

## Frontend App

- App path: `apps/pwa`
- Build output: `apps/pwa/dist`
- Shared dependency path: `apps/shared`

Because this is a monorepo and `apps/pwa` depends on `apps/shared`, the Cloudflare build must run from the repository root.

## Required Repo File

The repository must include `wrangler.jsonc` at the root with static asset configuration for the built frontend.

Current required shape:

```jsonc
{
  "name": "staff-portal",
  "compatibility_date": "2026-07-13",
  "assets": {
    "directory": "./apps/pwa/dist",
    "not_found_handling": "single-page-application"
  }
}
```

### Why this matters

- `assets.directory` tells Cloudflare where the built frontend files live.
- `not_found_handling: "single-page-application"` makes browser refreshes on client-side routes serve `index.html` instead of returning 404.

## Cloudflare Project Setup

When creating the Cloudflare app from GitHub:

1. Select the repository: `StanforteEdge/Portal`
2. Select the production branch: `main`
3. Set the build command:

```text
npm ci && npm run build:pwa2
```

4. Root directory:

```text
/
```

If the Cloudflare UI uses the newer Workers deployment flow instead of the older Pages output-directory flow, keep the build command and rely on `wrangler.jsonc` for static asset publishing.

## Environment Variables

Set these frontend variables in Cloudflare:

```text
VITE_API_BASE_URL=https://api.stanforteedge.com/v1
VITE_APP_BASE_PATH=/
```

### Notes

- `VITE_API_BASE_URL` should point to the public API base path used by the frontend.
- `VITE_APP_BASE_PATH` is the frontend path, not the full domain.
- If the app is served from the site root, use `/`.
- If the app is served from a subpath such as `/portal/`, use that full path with trailing slash.

## Build Watch Paths

Recommended include paths:

- `apps/pwa/**`
- `apps/shared/**`
- `package.json`
- `package-lock.json`
- `wrangler.jsonc`

Recommended exclude paths:

- `.continue/**`
- `.claude/**`

These prevent local tooling files from triggering frontend builds.

## Branch Flow

Recommended release flow:

1. Push work to `development`
2. Let `Development CI` run and confirm the frontend build passes
3. Promote changes to `main`
4. Cloudflare builds and deploys from `main`

## Manual Redeploy

If a new deployment is needed in Cloudflare:

1. Open the Cloudflare project
2. Open `Deployments`
3. Retry or redeploy the latest `main` commit

Do not manually redeploy an old commit unless you intentionally want an older frontend version.

## Troubleshooting

### Build succeeds but route refresh fails

Check `wrangler.jsonc` and confirm:

```jsonc
"not_found_handling": "single-page-application"
```

### Build succeeds but frontend calls localhost

Check Cloudflare environment variables and confirm:

```text
VITE_API_BASE_URL=https://api.stanforteedge.com/v1
```

### Build uses wrong code

Check the deployment branch and commit SHA in Cloudflare. Make sure it is building the latest `main` commit, not an older manually selected deployment.

### Build fails after monorepo changes

Confirm the build still runs from repo root:

```text
npm ci && npm run build:pwa2
```

Do not move the build into `apps/pwa` directly unless the monorepo dependency layout changes.

### Frontend calls the wrong API

Confirm the production variable is set to the public API base path, not localhost:

```text
VITE_API_BASE_URL=https://api.stanforteedge.com/v1
```

The frontend path variable is the served path, not the full domain:

```text
VITE_APP_BASE_PATH=/
```

## Quick Reference

- Repo: `StanforteEdge/Portal`
- Branch: `main`
- Root directory: `/`
- Build command: `npm ci && npm run build:pwa2`
- Static assets config: `wrangler.jsonc`
- Output directory in Wrangler: `./apps/pwa/dist`
- SPA fallback: `not_found_handling = single-page-application`
