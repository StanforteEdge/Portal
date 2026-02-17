# Technical Specification: StanforteEdge Staff Portal (Node.js/Express, Sequelize, MySQL)

## 1. Architecture
- **Backend:** Node.js with Express.js
- **DB:** MySQL, accessed via Sequelize ORM
- **API:** RESTful JSON APIs
- **Modularity:** Each core feature as an Express router/module
- **Security:** JWT auth, RBAC middleware, input validation, audit logging

## 2. Core Services
### a. User Management
- CRUD for users, teams, roles
- Staff number (unique, auto-increment)

### b. Authentication & Authorization
- JWT login/logout, refresh tokens
- RBAC enforcement

### c. Dynamic Forms Engine
- Configurable forms for requests, onboarding, etc.
- Schema-driven design

### d. Workflow Engine
- Multi-step approvals, status tracking
- Integration with notifications and audit trail

### e. Notification System
- Email (Nodemailer), SMS (Twilio), in-app
- User preferences, templates

### f. Audit Logging
- Log all critical actions, immutable
- Accessible for compliance

### g. Document Management
- File uploads (multer), versioning, metadata
- Document library for policies/templates

## 3. Integration
- All modules use shared auth, notifications, audit, file/document services
- Business modules (HR, Finance, Projects, CRM) extend core functionality

## 4. Testing & Quality
- Jest & Supertest for unit/integration tests
- Linting, pre-commit hooks, CI pipeline

## 5. Deployment
- Environment configs via `.env`
- GitHub Actions for CI/CD
- Docker-ready (optional)

---

_This technical spec is the single source of truth for backend implementation going forward._
