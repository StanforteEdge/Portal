-- Document Library DB Schema (PostgreSQL)

CREATE TABLE document_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    parent_category_id UUID,
    FOREIGN KEY (parent_category_id) REFERENCES document_categories(id)
);

CREATE TABLE documents (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category_id UUID NOT NULL,
    summary TEXT,
    content TEXT NOT NULL, -- Markdown or HTML
    status VARCHAR(16) DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    created_by UUID NOT NULL,
    published_by UUID,
    published_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES document_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (published_by) REFERENCES users(id)
);

CREATE TABLE document_attachments (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    file_id UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (file_id) REFERENCES files(id)
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Indexes for efficient queries
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_document_attachments_document_id ON document_attachments(document_id);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
