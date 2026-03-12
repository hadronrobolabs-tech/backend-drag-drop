-- =============================================================================
-- DRAG_AND_DROP — Single schema file. Update this file only when adding new
-- tables or columns. App runs this on startup (all statements are idempotent).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `drag_and_drop`;
USE `drag_and_drop`;

-- Tracks which migrations have been applied (legacy, kept for compatibility)
CREATE TABLE IF NOT EXISTS schema_migrations (
  name VARCHAR(255) PRIMARY KEY,
  applied_at VARCHAR(50) NOT NULL
);

-- Custom blocks (admin-created blocks, visible to all users)
-- created_at, updated_at: DATETIME format YYYY-MM-DD HH:MM:SS
CREATE TABLE IF NOT EXISTS custom_blocks (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'Custom',
  inputs TEXT NOT NULL,
  template TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
CREATE INDEX idx_custom_blocks_updated_at ON custom_blocks(updated_at);

-- -----------------------------------------------------------------------------
-- Future: add new tables below (use CREATE TABLE IF NOT EXISTS, index duplicate ignored on re-run).
-- Example:
-- CREATE TABLE IF NOT EXISTS projects (...)
-- CREATE INDEX idx_projects_updated_at ON projects(updated_at)
-- -----------------------------------------------------------------------------
