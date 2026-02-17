# Request System (Core Feature)

## Overview
The Request System is a core, reusable engine for managing dynamic requests across all modules (Finance, HR, Projects, Procurement, IT, etc.). It provides metadata-driven form definitions, validation, and approval workflow logic, allowing any module to define and process requests without duplicating code.

## Key Capabilities
- **Dynamic Form Engine**: Define request types, fields, validation rules, categories, and subcategories via metadata (JSON schemas).
- **Approval Workflow Engine**: Configurable, metadata-driven approval chains per request type, group, or context (amount, project, etc.), with support for escalation and conditional routing.
- **Request Lifecycle Management**: Handles all request statuses (draft, submitted, approved, disbursed, retired, completed, etc.) and transitions.
- **Integration Points**: Designed to integrate with file/document storage, notification, user/team management, and audit trail services in the core folder.

## Why Core?
- **Cross-Module Usage**: Finance, HR, Projects, and future modules all use the same request engine for their workflows.
- **Consistency**: Ensures all requests follow the same standards for data, approval, and audit.
- **Extensibility**: New request types or modules can be added by updating metadata, not duplicating logic.

## Structure
- **/schemas/**: JSON/YAML schemas for request types and forms
- **/workflows/**: Approval workflow definitions and examples
- **/integration.md**: How to connect other modules to the request system

## Example Use Cases
- Financial request (expense, petty cash, salary, procurement)
- HR request (leave, travel, recruitment)
- Project request (resource allocation, milestone approval)

---

For more details, see the technical specifications and integration documentation.
