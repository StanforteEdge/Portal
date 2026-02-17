# Project Overview: StanforteEdge Staff Portal (Node.js/Express)

## Purpose
A modular staff portal for StanforteEdge, supporting core operations (HR, Finance, Projects, CRM, Documents) with robust workflow, security, and integration.

## Technology Stack
- **Backend:** Node.js (Express.js)
- **ORM:** Sequelize
- **Database:** MySQL
- **Authentication:** JWT, RBAC
- **Notifications:** Nodemailer (email), Twilio (SMS, optional)
- **File Storage:** Local or S3-compatible (via multer, aws-sdk)
- **Audit Trail:** MySQL logging
- **Testing:** Jest, Supertest
- **Frontend:** React (future phase)
- **CI/CD:** GitHub Actions (suggested)

## Core Modules
1. **Core Platform**
   - User Management
   - Authentication & Authorization
   - Dynamic Forms Engine
   - Workflow Engine
   - Notification System
   - Audit Logging
   - Document Management
2. **Human Resources Management (HR)**
3. **Project Management**
4. **Financial Management**
5. **CRM (Constituent Relationship Management)**

## Key Features
- Modular microservice-ready architecture
- Secure, role-based access control
- Dynamic workflows and forms
- Notification and reminder engine
- Comprehensive audit trail
- File/document management
- Extensible for future modules

---

_This overview supersedes all previous backend tech stack decisions._
