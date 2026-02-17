# Expense Management – API Specification (Phase 1)

## 1. Submit Expense Request
- **POST /expense-requests**
  - Request:
    ```json
    {
      "request_type": "travel",
      "category": "transport",
      "amount": 120.00,
      "description": "Taxi to client site",
      "date": "2025-07-19",
      "files": ["file_id1", "file_id2"]
    }
    ```
  - Response:
    ```json
    {
      "request_id": "r1a2b3c4-...",
      "request_number": 123,
      "status": "SUBMITTED"
    }
    ```

## 2. List Expense Requests
- **GET /expense-requests**
  - Query: status, category, date range, requester, etc.

## 3. Get Expense Request Details
- **GET /expense-requests/{id}**

## 4. Approve/Reject/Comment
- **POST /expense-requests/{id}/approve**
- **POST /expense-requests/{id}/reject**
- **POST /expense-requests/{id}/comment**
  - Request: `{ "comment": "..." }`

## 5. Upload Receipt/File
- **POST /expense-requests/{id}/files**
  - Multipart upload

## 6. Track Reimbursement
- **POST /expense-requests/{id}/reimburse**
  - Request: `{ "payment_date": "2025-07-20", "payment_ref": "TRX12345" }`

## 7. Petty Cash Request
- **POST /expense-requests** (type = "petty_cash")

## 8. Notifications
- Automated via core notification system for all workflow steps

## 9. Error Handling
- Standard error format:
  ```json
  { "error": { "code": 400, "message": "Bad Request" } }
  ```
