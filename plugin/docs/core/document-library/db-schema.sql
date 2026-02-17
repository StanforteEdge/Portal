-- Document Library DB Schema (PostgreSQL)
-- Uses unified taxonomy system for categories

-- Core taxonomy registry (shared across features)
CREATE TABLE taxonomies (
    id UUID PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL, -- 'document_categories', 'project_categories', etc.
    feature VARCHAR(32) NOT NULL, -- 'documents', 'projects', 'finance'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unified taxonomy terms (replaces document_categories)
CREATE TABLE taxonomy_terms (
    id UUID PRIMARY KEY,
    taxonomy_id UUID NOT NULL,
    name VARCHAR(64) NOT NULL,
    slug VARCHAR(64) NOT NULL,
    parent_id UUID, -- for hierarchical categories
    taxonomy_type VARCHAR(20), -- 'team', 'department', 'document_type'
    metadata JSON, -- feature-specific data
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taxonomy_id) REFERENCES taxonomies(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES taxonomy_terms(id),
    UNIQUE(taxonomy_id, slug)
);

CREATE TABLE document_tags (
    id UUID PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category_id UUID NOT NULL, -- FK to taxonomy_terms
    department_id UUID, -- FK to departments table (if exists)
    summary TEXT,
    content TEXT NOT NULL, -- Markdown or HTML
    content_type VARCHAR(20) NOT NULL DEFAULT 'wysiwyg', -- wysiwyg, upload, link
    external_url TEXT, -- for link type documents
    status VARCHAR(16) DEFAULT 'draft', -- draft, review, published, archived, rejected
    version VARCHAR(20) DEFAULT '1.0.0', -- semantic versioning
    tags JSON, -- array of tag names
    metadata JSON, -- custom fields object
    created_by UUID NOT NULL,
    reviewed_by UUID, -- user who reviewed the document
    published_by UUID,
    published_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES taxonomy_terms(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    FOREIGN KEY (published_by) REFERENCES users(id)
);

CREATE TABLE document_attachments (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    file_id UUID NOT NULL, -- FK to file storage system
    attachment_type VARCHAR(20) DEFAULT 'supporting', -- primary, supporting
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    -- FOREIGN KEY (file_id) REFERENCES files(id) -- depends on file storage implementation
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    version VARCHAR(20) NOT NULL, -- semantic versioning
    content TEXT NOT NULL,
    content_type VARCHAR(20) NOT NULL DEFAULT 'wysiwyg',
    external_url TEXT,
    change_notes TEXT, -- what changed in this version
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE document_subscriptions (
    id UUID PRIMARY KEY,
    document_id UUID, -- nullable for category/department subscriptions
    category_id UUID, -- nullable for document-specific subscriptions
    department_id UUID, -- nullable for document/category subscriptions
    user_id UUID NOT NULL,
    subscription_type VARCHAR(20) NOT NULL DEFAULT 'document', -- document, category, department
    notify_on_update BOOLEAN DEFAULT FALSE,
    notify_on_publish BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(document_id, category_id, department_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_published_at ON documents(published_at);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags); -- for JSON array search
-- Taxonomy indexes
CREATE INDEX idx_taxonomies_feature ON taxonomies(feature);
CREATE INDEX idx_taxonomy_terms_taxonomy_id ON taxonomy_terms(taxonomy_id);
CREATE INDEX idx_taxonomy_terms_parent_id ON taxonomy_terms(parent_id);
CREATE INDEX idx_taxonomy_terms_taxonomy_type ON taxonomy_terms(taxonomy_type);
CREATE INDEX idx_taxonomy_terms_slug ON taxonomy_terms(slug);
CREATE INDEX idx_document_attachments_document_id ON document_attachments(document_id);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_subscriptions_user_id ON document_subscriptions(user_id);
CREATE INDEX idx_document_subscriptions_document_id ON document_subscriptions(document_id);
CREATE INDEX idx_document_subscriptions_category_id ON document_subscriptions(category_id);
CREATE INDEX idx_document_subscriptions_type ON document_subscriptions(subscription_type);

-- Full-text search index for document content
CREATE INDEX idx_documents_content_fts ON documents USING GIN(to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || content));

-- Unique constraint for document versions
CREATE UNIQUE INDEX idx_document_versions_unique ON document_versions(document_id, version);
