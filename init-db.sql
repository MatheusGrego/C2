-- ============================================
-- SENTINEL C2 - DATABASE INITIALIZATION
-- Version: 1.0.6
-- ============================================

-- Create blob_storage schema for binary data
CREATE SCHEMA IF NOT EXISTS blob_storage;

-- ============================================
-- SCHEMA: public (Metadata and Control)
-- ============================================

-- Users table (Operators)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Agents table (Connected Implants)
CREATE TABLE IF NOT EXISTS public.agents (
    hwid VARCHAR(64) PRIMARY KEY,
    hostname VARCHAR(100) NOT NULL,
    os_info VARCHAR(100),
    ip_local VARCHAR(45),
    status VARCHAR(20) DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'DEAD')),
    communication_mode VARCHAR(20) DEFAULT 'SESSION' CHECK (communication_mode IN ('SESSION', 'BEACON')),
    beacon_interval INTEGER DEFAULT NULL,
    cpu_load DOUBLE PRECISION DEFAULT 0,
    ram_usage BIGINT DEFAULT 0,
    active_window VARCHAR(255),
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commands table (Command History with Correlation ID)
CREATE TABLE IF NOT EXISTS public.commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_hwid VARCHAR(64) NOT NULL REFERENCES public.agents(hwid) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    payload JSONB,
    response_text TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'EXECUTED', 'FAILED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP
);

-- Create index for faster command lookups
CREATE INDEX IF NOT EXISTS idx_commands_agent_hwid ON public.commands(agent_hwid);
CREATE INDEX IF NOT EXISTS idx_commands_status ON public.commands(status);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);

-- ============================================
-- SCHEMA: blob_storage (Binary Data)
-- ============================================

-- Screenshots table
CREATE TABLE IF NOT EXISTS blob_storage.agent_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_hwid VARCHAR(64) NOT NULL REFERENCES public.agents(hwid) ON DELETE CASCADE,
    trigger_command_id UUID REFERENCES public.commands(id) ON DELETE SET NULL,
    image_data BYTEA NOT NULL,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster screenshot lookups
CREATE INDEX IF NOT EXISTS idx_screenshots_agent_hwid ON blob_storage.agent_screenshots(agent_hwid);
CREATE INDEX IF NOT EXISTS idx_screenshots_captured_at ON blob_storage.agent_screenshots(captured_at DESC);

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL PRIVILEGES ON SCHEMA public TO sentinel;
GRANT ALL PRIVILEGES ON SCHEMA blob_storage TO sentinel;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sentinel;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA blob_storage TO sentinel;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sentinel;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA blob_storage TO sentinel;
