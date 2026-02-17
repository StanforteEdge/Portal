-- Expense Management DB Schema (Phase 1)

CREATE TABLE expense_requests (
    id UUID PRIMARY KEY,
    request_number INTEGER NOT NULL,
    request_type VARCHAR(32) NOT NULL, -- travel, meals, petty_cash, etc.
    category VARCHAR(32) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    requester_id UUID NOT NULL,
    status VARCHAR(16) NOT NULL, -- SUBMITTED, APPROVED, REJECTED, PAID, etc.
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reimbursed_at TIMESTAMP,
    payment_ref VARCHAR(64),
    FOREIGN KEY (requester_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_expense_requests_number_type ON expense_requests(request_type, request_number);

CREATE TABLE expense_request_files (
    id UUID PRIMARY KEY,
    expense_request_id UUID NOT NULL,
    file_id UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_request_id) REFERENCES expense_requests(id),
    FOREIGN KEY (file_id) REFERENCES files(id)
);

CREATE TABLE expense_request_comments (
    id UUID PRIMARY KEY,
    expense_request_id UUID NOT NULL,
    commenter_id UUID NOT NULL,
    comment TEXT NOT NULL,
    commented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_request_id) REFERENCES expense_requests(id),
    FOREIGN KEY (commenter_id) REFERENCES users(id)
);
