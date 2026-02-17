-- User & Team Management DB Schema (PostgreSQL)

CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    description VARCHAR(255),
    parent_team_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_team_id) REFERENCES teams(id)
);

CREATE TABLE team_memberships (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    team_id UUID NOT NULL,
    role VARCHAR(32) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    UNIQUE (user_id, team_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_team_memberships_user_id ON team_memberships(user_id);
CREATE INDEX idx_team_memberships_team_id ON team_memberships(team_id);
