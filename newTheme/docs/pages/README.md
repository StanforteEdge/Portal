# Frontend Pages Documentation

This directory documents frontend pages, mirroring `templates/pages/` structure. Each page has a dedicated spec file with PRD/FRD details: purpose, URL, template file, inputs, validation, API usage, and states.

Structure:
```
docs/pages/
├── auth/
│   ├── login.md
│   ├── forgot-password.md
│   └── reset-password.md
└── dashboard/
    └── index.md
```

Conventions:
- One markdown file per page
- Sections: About, Layout Outline, Sections, PRD, FRD, UX, API, States, Permissions,
- Keep aligned with plugin APIs (`/plugin/Core/*`), JWT auth, and custom RBAC
