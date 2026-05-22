-- ============================================================
-- ARIA PLATFORM — Full Database Schema
-- Runs automatically when MySQL container starts
-- ============================================================

CREATE DATABASE IF NOT EXISTS aria_platform;
USE aria_platform;

-- ── USERS ───────────────────────────────────────────────────
CREATE TABLE users (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid           CHAR(36)     NOT NULL UNIQUE DEFAULT (UUID()),
  username       VARCHAR(50)  NOT NULL UNIQUE,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  avatar_name    VARCHAR(100) NOT NULL DEFAULT 'ARIA',
  avatar_style   VARCHAR(20)  NOT NULL DEFAULT 'cyan',
  avatar_image   TEXT         NULL,
  system_prompt  TEXT         NULL,
  personality    VARCHAR(20)  NOT NULL DEFAULT 'friendly',
  voice_name     VARCHAR(100) NULL,
  voice_speed    DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  voice_pitch    DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  model          VARCHAR(50)  NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── API KEYS (encrypted) ─────────────────────────────────────
CREATE TABLE api_keys (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        BIGINT UNSIGNED NOT NULL,
  provider       VARCHAR(30)  NOT NULL DEFAULT 'anthropic',
  encrypted_key  TEXT         NOT NULL,
  key_hint       VARCHAR(10)  NOT NULL,        -- last 4 chars e.g. "...xK9z"
  is_valid       TINYINT(1)   NOT NULL DEFAULT 0,
  last_tested_at TIMESTAMP    NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_provider (user_id, provider)
);

-- ── CHAT SESSIONS ────────────────────────────────────────────
CREATE TABLE chat_sessions (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid           CHAR(36)     NOT NULL UNIQUE DEFAULT (UUID()),
  user_id        BIGINT UNSIGNED NOT NULL,
  title          VARCHAR(255) NOT NULL DEFAULT 'New Chat',
  personality    VARCHAR(20)  NOT NULL DEFAULT 'friendly',
  message_count  INT UNSIGNED NOT NULL DEFAULT 0,
  token_count    INT UNSIGNED NOT NULL DEFAULT 0,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  started_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at       TIMESTAMP    NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── MESSAGES ────────────────────────────────────────────────
CREATE TABLE messages (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid           CHAR(36)     NOT NULL UNIQUE DEFAULT (UUID()),
  session_id     BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  role           ENUM('user','assistant') NOT NULL,
  content        TEXT         NOT NULL,
  has_image      TINYINT(1)   NOT NULL DEFAULT 0,
  image_path     VARCHAR(500) NULL,
  token_count    INT UNSIGNED NOT NULL DEFAULT 0,
  emotion        VARCHAR(20)  NOT NULL DEFAULT 'neutral',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── MEETINGS ────────────────────────────────────────────────
CREATE TABLE meetings (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid             CHAR(36)     NOT NULL UNIQUE DEFAULT (UUID()),
  user_id          BIGINT UNSIGNED NOT NULL,
  room_id          VARCHAR(100) NOT NULL UNIQUE,
  platform         VARCHAR(30)  NOT NULL DEFAULT 'custom',
  bot_name         VARCHAR(100) NOT NULL DEFAULT 'ARIA',
  bot_personality  VARCHAR(20)  NOT NULL DEFAULT 'professional',
  status           ENUM('scheduled','active','ended') NOT NULL DEFAULT 'scheduled',
  started_at       TIMESTAMP    NULL,
  ended_at         TIMESTAMP    NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── TRANSCRIPTS ──────────────────────────────────────────────
CREATE TABLE transcripts (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  meeting_id BIGINT UNSIGNED NOT NULL,
  speaker    ENUM('user','bot') NOT NULL,
  content    TEXT         NOT NULL,
  spoken_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- ── MEETING NOTES (AI generated) ────────────────────────────
CREATE TABLE meeting_notes (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  meeting_id   BIGINT UNSIGNED NOT NULL UNIQUE,
  summary      TEXT         NOT NULL,
  key_points   JSON         NOT NULL,
  action_items JSON         NOT NULL,
  generated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- ── CODE FILES ───────────────────────────────────────────────
CREATE TABLE code_files (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        CHAR(36)     NOT NULL UNIQUE DEFAULT (UUID()),
  user_id     BIGINT UNSIGNED NOT NULL,
  filename    VARCHAR(255) NOT NULL,
  language    VARCHAR(30)  NOT NULL DEFAULT 'python',
  content     LONGTEXT     NOT NULL DEFAULT '',
  folder_path VARCHAR(500) NOT NULL DEFAULT '/',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── CODE VERSIONS (history) ──────────────────────────────────
CREATE TABLE code_versions (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id        BIGINT UNSIGNED NOT NULL,
  content        LONGTEXT     NOT NULL,
  change_summary VARCHAR(255) NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES code_files(id) ON DELETE CASCADE
);

-- ── CODE RUNS ────────────────────────────────────────────────
CREATE TABLE code_runs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id     BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  language    VARCHAR(30)  NOT NULL,
  input_code  LONGTEXT     NOT NULL,
  output      TEXT         NULL,
  error       TEXT         NULL,
  duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
  exit_code   TINYINT      NOT NULL DEFAULT 0,
  executed_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES code_files(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── ANALYTICS ────────────────────────────────────────────────
CREATE TABLE analytics (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT UNSIGNED NOT NULL,
  date               DATE         NOT NULL,
  sessions_count     INT UNSIGNED NOT NULL DEFAULT 0,
  messages_count     INT UNSIGNED NOT NULL DEFAULT 0,
  tokens_input       INT UNSIGNED NOT NULL DEFAULT 0,
  tokens_output      INT UNSIGNED NOT NULL DEFAULT 0,
  estimated_cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  voice_chars_used   INT UNSIGNED NOT NULL DEFAULT 0,
  meetings_count     INT UNSIGNED NOT NULL DEFAULT 0,
  meeting_minutes    INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_date (user_id, date)
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX idx_messages_session    ON messages(session_id);
CREATE INDEX idx_messages_created    ON messages(created_at);
CREATE INDEX idx_transcripts_meeting ON transcripts(meeting_id);
CREATE INDEX idx_code_files_user     ON code_files(user_id);
CREATE INDEX idx_analytics_user_date ON analytics(user_id, date);
CREATE INDEX idx_meetings_user       ON meetings(user_id);
CREATE INDEX idx_sessions_user       ON chat_sessions(user_id);
