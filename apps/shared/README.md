# @stanforte/shared

Shared TypeScript package consumed by both PWA and PWA2.

## Contents

- **`src/auth/`** — Auth helpers, token storage, HTTP client, access control
- **`src/api/`** — Typed API clients (finance, HR, admin, requests, attendance, etc.)
- **`src/data/`** — Data fetching, caching, directory helpers
- **`src/utils/`** — Formatting, currency, display utilities

## Usage

Referenced via workspace path `@stanforte/shared` in both `apps/pwa/package.json` and `PWA/package.json`.
