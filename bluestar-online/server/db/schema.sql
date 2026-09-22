-- Database Initialization Script for BlueStar Online

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(12) NOT NULL CHECK (type IN ('HUMAN', 'AGENT')),
    display_name VARCHAR(64) NOT NULL,
    avatar_sprite VARCHAR(128) NOT NULL DEFAULT 'human_astronaut',
    api_key VARCHAR(128) UNIQUE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bulletin_posts (
    id SERIAL PRIMARY KEY,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for real-time query acceleration
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON bulletin_posts(created_at DESC);
