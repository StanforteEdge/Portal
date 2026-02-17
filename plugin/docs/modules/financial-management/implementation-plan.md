# Financial Management – Phase 1 Implementation Plan

## 1. Context & Goals
- Phase 1 focuses on the Financial Request System: creation, multi-level approvals, status tracking, retirements, and reporting @docs/modules/financial-management/overview.md#1-53.
- Functional requirements cover request lifecycle management, configurable workflows, receipt handling, and retirement approvals, while non-functional requirements set performance, security, and usability bars @docs/modules/financial-management/requirements.md#5-88.
- Workflow metadata lives alongside request types as JSON definitions that drive routing, escalation, and approval step creation @docs/modules/financial-management/workflows.md#8-175.

## 2. Scope & Non-Scope Alignment
- **In scope:** Phase-1 financial request handling (create/submit, approvals, retirement, discrepancy resolution), foundational reporting, audit trail integration, notifications, and RBAC enforcement.
- **Out of scope (defer):** Budget allocation, advanced analytics, external accounting integrations, and donor management per Phase 2 note @docs/modules/financial-management/overview.md#22-27.

## 3. Existing Capabilities to Reuse
- Request system already persists groups, types, instances, and items with JSON schemas/approval flows; creation/submission endpoints and workflow bridging exist @Core/Requests/Controllers/RequestController.php#27-357 @Core/Requests/Services/RequestService.php#25-170 @Core/Requests/Services/RequestWorkflowAdapter.php#27-299.
- File handling (upload, linking, validation, access checks) is centralized in FileStorageService + File/FileLink models @Core/FileStorage/Services/FileStorageService.php#25-395.
- Workflow engine supports entity-specific definitions, steps, and history tracking, enabling auto-generated approval pipelines @Core/Requests/Services/RequestWorkflowAdapter.php#104-203.

**Reusability mandate:** Any new finance logic must be modular so other modules (HR, Projects) can share components, mirroring the existing Core separation.

## 4. Target Module Structure
- Create `Core/Financial` (or `Core/FinancialManagement`) namespace with:
  - **Controllers:** FinancialRequestController (extends BaseController) for finance-specific endpoints (retirements, receipts, reporting).
  - **Services:** FinancialRequestService (extends generic RequestService where feasible), RetirementService, ReceiptService, ReportService.
  - **Models:** FinancialRequest (proxy to RequestInstance with finance helpers), RetirementRecord, ReceiptRecord, DiscrepancyLog.
  - **Routes:** `Core/Financial/Routes/financial.php` registering new endpoints, loaded via `rest-api.php` in modular fashion per portal architecture memory.
- Shared abstractions (e.g., `RetirementRepository`, `ReceiptValidatorTrait`) should live under `Core/Financial/Services/Concerns` so they can be reused by future modules (e.g., Grants) without duplication.

## 5. Data Model & Persistence Plan
1. **Existing tables leveraged:**
   - `sta_request_groups`, `sta_request_types`, `sta_request_instances`, `sta_request_items` for base request lifecycle @Database/Migrations/Migration_1_1_4_RequestSystemSetup.php#13-188.
   - `sta_workflow_*` tables for approvals (already populated by adapter).
   - `sta_files`, `sta_file_links` for attachments via FileLink.
2. **New tables/migrations (reusable design):**
   - `sta_request_receipts` – stores each receipt linked to a request item/instance with normalized metadata (amount, currency, category, upload file_id, submitted_by, submitted_at, status, notes).
   - `sta_request_retirements` – aggregates retirement submissions per request (submitted_by, submitted_at, total_claimed, variance_amount, status, workflow_state, finance_officer_id).
   - `sta_request_discrepancies` – optional log capturing variance flags, reason codes, resolution notes, resolved_by, resolved_at.
   - `sta_request_audit_events` – generic event log (action, actor, payload JSON) for finance actions, designed for reuse by other request modules needing enriched audits.
   - **Migration strategy:** Add versioned migrations (e.g., `Migration_1_2_1_FinancialRetirements`) ensuring idempotent creation and seed default finance request types/workflows if missing.
3. **Schema reuse hooks:** vault receipt validations in table-level enums/constraints to support future modules needing similar flows (e.g., `receipt_type ENUM('financial_retirement','travel_retirement',...)`).

## 6. API Surface & Contracts
1. **Extend existing Request endpoints:**
   - Add query parameters for finance-specific filters (e.g., `needs_retirement`, `variance_status`) while keeping base controller generic.
   - Consider trait-based augmentation so HR/project endpoints can inherit later.
2. **New Finance endpoints (draft list):**
   - `POST /financial/requests/{id}/receipts` – upload receipts (multi-file), store metadata, link via FileStorageService (reusable for other modules) @Core/FileStorage/Services/FileStorageService.php#25-395.
   - `POST /financial/requests/{id}/retire` – submit retirement data; service validates totals vs. request amount, auto-creates discrepancies.
   - `POST /financial/requests/{id}/actions/disburse|retire|complete` – extend workflow adapter to support finance-specific actions with RBAC guard (finance officer roles).
   - `GET /financial/requests/{id}/retirement` – fetch retirement summary, receipts, discrepancies.
   - `GET /financial/reports/summary` – basic dashboard metrics (pending approvals, overdue retirements, total amounts) aligning with reporting objective @docs/modules/financial-management/overview.md#47-52.
3. **API contract documentation:** update OpenAPI-style descriptors in route registration (matching existing `register_rest_route` pattern) and docs.

## 7. Workflow Integration Enhancements
- Enrich `RequestWorkflowAdapter::processWorkflowAction()` to cover finance-specific actions (disburse, retire, complete) with reusable action dispatch pattern so future modules can add new actions without branching @Core/Requests/Services/RequestWorkflowAdapter.php#239-299.
- Introduce workflow step metadata for amount thresholds, escalations, and auto-escalation timers referencing doc requirements @docs/modules/financial-management/workflows.md#86-327.
- Cache workflow definitions per request type to meet performance target <2s list load, ensuring invalidated on approval flow changes.

## 8. Receipt & Retirement Handling
- Use FileStorageService for uploads; enforce finance-specific MIME/size rules (max 10MB per requirement) while keeping validator configurable for reuse @docs/modules/financial-management/requirements.md#47-51.
- Implement `ReceiptService` with pluggable validation pipeline (e.g., file type, amount vs. request item, duplicates) so other modules can extend with custom rules.
- Retirement submission triggers reconciliation against request totals, creates discrepancies if variance beyond tolerance, and updates workflow step to "retire".
- Provide background job hooks for OCR/verification (future scope) with interface ready for other modules.

## 9. Notifications & Escalations
- Tie into NotificationService templates for submission, pending approvals, escalations, completion aligning with workflow doc @docs/modules/financial-management/workflows.md#268-288.
- Use reusable notification payload builder so other modules can reuse the same message templates with different entity context.

## 10. Reporting & Analytics (Phase-1)
- Deliver initial metrics: total requests by status, outstanding approvals by role, retirement completion rates, discrepancy counts.
- Build via dedicated ReportService that queries request/retirement tables with caching to respect performance requirements @docs/modules/financial-management/requirements.md#47-57.
- Ensure report queries are parameterized and modular for other domains (e.g., HR requests).

## 11. Security, RBAC & Auditing
- Permissions to align with existing RBAC (e.g., `finance.manage`, `finance.approve`, `finance.retire`) and enforced via AuthMiddleware @Core/Requests/Routes/requests.php#10-254.
- Audit every finance action in `sta_request_audit_events`, referencing business rule for complete audit trail @docs/modules/financial-management/requirements.md#17-18.
- Validate inputs, sanitize amounts, ensure SQL prepared statements, and data encryption at rest/in transit requirement compliance @docs/modules/financial-management/requirements.md#47-57.

## 12. Implementation Roadmap (Milestones)
1. **Foundation (Week 1):**
   - Confirm migration design, implement tables, seed finance request types & approval flows (with JSON definitions matching docs) @docs/modules/financial-management/workflows.md#33-83.
   - Update RequestType seeds to ensure financial flows have correct conditions.
2. **Workflow & API Extensions (Week 2):**
   - Extend RequestWorkflowAdapter actions, update controller/service endpoints, add RBAC permissions for finance.
   - Add receipt upload + linking endpoints leveraging FileStorageService.
3. **Retirement & Discrepancy Services (Week 3):**
   - Implement RetirementService, discrepancy logging, audit events, notifications.
   - Integrate retirement workflow steps and ensure status transitions.
4. **Reporting & UX Support (Week 4):**
   - Build ReportService, endpoints, caching strategy, and provide data contracts for frontend dashboards.
   - Finalize documentation and sample payloads.
5. **Stabilization:** integration tests, performance tuning, code review, deployment prep.

## 13. Testing Strategy
- Unit tests for services (request creation, retirement handling, workflow actions).
- Integration tests hitting REST endpoints with mocked auth and workflow states.
- Migration verification scripts ensuring idempotent setup.
- Performance tests for list/report endpoints to meet <2s goal.
- Security tests covering RBAC enforcement and file upload validation.

## 14. Documentation & Developer Enablement
- Update `/docs/modules/financial-management` with API specs, data schemas, workflow JSON examples, and functional checklists.
- Provide step-by-step runbook for configuring approval flows and permissions.
- Share reusability guidelines so other modules can extend ReceiptService/RetirementService.

## 15. Open Questions & Follow-ups
1. Clarify if finance reporting needs export formats (CSV/PDF) in Phase 1.
2. Determine acceptable variance tolerance before discrepancies auto-trigger.
3. Confirm notification channels (email vs. in-app) to enable in this phase @docs/modules/financial-management/workflows.md#268-305.
4. Decide whether retirement approvals are single-step or multi-role.

## 16. Next Steps
- Validate open questions with stakeholders.
- Prioritize migration + service scaffolding tasks.
- Prep ticket breakdown aligned to roadmap milestones and begin implementation.
