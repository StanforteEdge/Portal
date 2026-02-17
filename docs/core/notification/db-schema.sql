-- Notification & Reminders DB Schema (PostgreSQL)

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(32) NOT NULL, -- info, warning, action, reminder, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    status VARCHAR(16) DEFAULT 'unread', -- unread, read, archived
    sent_via VARCHAR(32)[], -- array of channels
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    archived_at TIMESTAMP
);

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    type VARCHAR(32) NOT NULL, -- workflow, reminder, etc.
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    language VARCHAR(8) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_notification_preferences (
    user_id UUID NOT NULL,
    channel VARCHAR(16) NOT NULL, -- in-app, email, sms
    enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, channel),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE reminders (
    id UUID PRIMARY KEY,
    notification_id UUID NOT NULL,
    remind_at TIMESTAMP NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id)
);

-- Indexes for efficient queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_reminders_remind_at ON reminders(remind_at);
