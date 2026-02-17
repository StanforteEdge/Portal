-- File Storage & Document Management DB Schema (PostgreSQL)

CREATE TABLE files (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    status VARCHAR(16) DEFAULT 'active', -- active, archived, deleted
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    metadata JSONB,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE file_links (
    id UUID PRIMARY KEY,
    file_id UUID NOT NULL,
    linked_entity_type VARCHAR(32) NOT NULL, -- request, user, comment, etc.
    linked_entity_id UUID NOT NULL,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Indexes for efficient queries
CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_file_links_entity ON file_links(linked_entity_type, linked_entity_id);
