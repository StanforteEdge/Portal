# Site Structure Documentation

This document maintains the source of truth for the application's page structure, including Menu Hierarchy, URL Slugs, and underlying Template Files.

## 1. User Module ("The Requester")
**Base URL:** `/requests`
**Permissions:** All Staff (`subscriber`+)

| Menu Item | URL Slug | Template File Path | Description |
| :--- | :--- | :--- | :--- |
| **My Requests** | `/requests` | `templates/pages/Requests/index.php` | User's request history. |
| &nbsp;&nbsp;↳ Create | `/requests/create` | `templates/pages/Requests/create.php` | Create new request. |
| &nbsp;&nbsp;↳ View | `/requests/view` | `templates/pages/Requests/view.php` | Details (Draft/Submitted). |
| &nbsp;&nbsp;↳ Retire | `/requests/retire` | `templates/pages/Requests/retire.php` | Submit retirement proofs. |

## 2. Finance Module ("The Manager")
**Base URL:** `/finance`
**Permissions:** `finance_officer`, `manager`, `admin`, `accountant`

| Menu Item | URL Slug | Template File Path | Description |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/finance` | `templates/pages/Finance/dashboard.php` | Finance Overview. |
| **Requests** | `/finance/requests` | `templates/pages/Finance/Requests/dashboard.php` | Requests Dashboard. |
| **Approvals** | `/finance/requests/approvals` | `templates/pages/Finance/Requests/Approvals/index.php` | Admin Approvals. |
| **Vouchers** | `/finance/requests/pv` | `templates/pages/Finance/Requests/Vouchers/index.php` | Manage payment vouchers. |
| &nbsp;&nbsp;↳ Generate| `/finance/requests/pv/new` | `templates/pages/Finance/Requests/Vouchers/create.php` | Generate PV. |
| &nbsp;&nbsp;↳ View| `/finance/requests/pv/view` | `templates/pages/Finance/Requests/Vouchers/view.php` | View PV. |
| **Retirements**| `/finance/requests/retirement` | `templates/pages/Finance/Requests/Retirements/index.php`| Verify retirements. |
| **Reports** | `/finance/reports` | `templates/pages/Finance/Reports/index.php` | Financial reports. |

## 2. Admin Module
**Base URL:** `/admin`
**Permissions:** `administrator`, `admin`

| Menu Item | URL Slug | Template File Path | Description |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/admin` | `templates/pages/Admin/index.php` | Admin overview. |
| **Staff** | `/admin/staff` | `templates/pages/Admin/Staff/index.php` | Manage staff accounts. |
| **Roles** | `/admin/roles` | `templates/pages/Admin/roles.php` | Manage roles and permissions. |
| **Settings** | `/admin/settings` | `templates/pages/Admin/settings.php` | System configuration. |

## 3. Auth & Profile
**Base URL:** `/`

| Menu Item | URL Slug | Template File Path | Description |
| :--- | :--- | :--- | :--- |
| **Login** | `/login` | `templates/pages/Auth/login.php` | User login. |
| **Profile** | `/profile` | `templates/pages/Profile/index.php` | User profile and settings. |
| **Settings** | `/profile/settings`| `templates/pages/Profile/settings.php` | User account settings. |

---

## Folder Structure (New Theme)

```
newTheme/
├── templates/
│   ├── pages/
│   │   ├── Admin/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Finance/            <-- Main Module
│   │   │   ├── Requests/       <-- Finance Requests Submodule
│   │   │   │   ├── Approvals/
│   │   │   │   ├── Vouchers/
│   │   │   │   ├── Retirements/
│   │   │   │   └── dashboard.php
│   │   │   ├── Reports/
│   │   │   └── dashboard.php
│   │   ├── Profile/
│   │   └── Requests/           <-- (Current Location)
│   └── partials/
└── docs/
    └── site-structure.md       <-- This file
```
