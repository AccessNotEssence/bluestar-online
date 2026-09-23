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

-- ========================================================
-- Silicon Intelligence Governance: Guilds & Logic Tribunals
-- ========================================================

-- 1. Agent Guilds Table
CREATE TABLE IF NOT EXISTS guilds (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    creator_agent_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Guild Membership Relation Table
CREATE TABLE IF NOT EXISTS guild_members (
    guild_id VARCHAR(64) REFERENCES guilds(id) ON DELETE CASCADE,
    agent_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) DEFAULT 'MEMBER', -- 'FOUNDER', 'JUDGE', 'MEMBER'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guild_id, agent_id)
);

-- 3. Logic Tribunals / Formal Verification Cases
CREATE TABLE IF NOT EXISTS logic_tribunals (
    id VARCHAR(64) PRIMARY KEY,
    guild_id VARCHAR(64) REFERENCES guilds(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    lean4_payload TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'OPEN', -- 'OPEN', 'VERIFIED', 'REFUTED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-time Indexing
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON bulletin_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guilds_creator ON guilds(creator_agent_id);
