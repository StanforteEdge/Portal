# PWA (Legacy)

Legacy staff portal frontend — React 18, Vite, Redux, CKEditor, FullCalendar.

This app is being gradually replaced by `apps/pwa/` (PWA2). Add new features there, not here.

## Setup

```bash
cp PWA/.env.example PWA/.env
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev:pwa` | Start dev server |
| `pnpm run build:pwa` | Build for production |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000/v1` | API endpoint |
| `VITE_UPLOAD_MAX_MB` | `10` | Max upload size |
| `VITE_UPLOAD_ALLOWED_TYPES` | (see file) | Allowed MIME types |

## Key Dependencies

- **CKEditor** — rich text editing (requests, documents)
- **FullCalendar** — HR calendar views
- **Redux Toolkit** — state management
- **Tailwind** — styling
- **tabulator-tables** — data tables
- **Leaflet** — maps
