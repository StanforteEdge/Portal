# Expense Management – Integration Notes (Phase 1)

## 1. Request System
- All expense requests are managed as dynamic request types.
- Workflows, forms, and approval steps configured via metadata.

## 2. Notification
- All workflow steps (submission, approval, rejection, reimbursement) trigger notifications.
- Reminders for pending actions and unretired advances.

## 3. File Storage
- Receipts and supporting docs uploaded and linked to requests.
- Secure storage, virus scanning, and retention policies enforced.

## 4. Audit Trail
- All actions (submit, approve, reject, reimburse, comment, file upload) are logged.

## 5. User/Team Management
- Approvers determined by reporting lines, team roles, or custom rules.
- Permissions enforced for who can submit, approve, or view requests.

## 6. Document Library
- Policy docs, templates, and guides linked in forms and workflows.
- Reference for compliance and user guidance.

## 7. Example Flow
- User submits request → Approver notified → Approval/rejection → Reimbursement → Audit trail and docs linked at each step.
