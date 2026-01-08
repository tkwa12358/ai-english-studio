-- AI English Studio - MySQL 数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS ai_english CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_english;

-- 用户表（合并 auth.users 和 profiles）
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  voice_credits INT DEFAULT 0,
  professional_voice_minutes INT DEFAULT 0,
  email_confirmed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone)
) ENGINE=InnoDB;

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  device_id VARCHAR(255),
  device_info TEXT,
  ip_address VARCHAR(45),
  token VARCHAR(500) UNIQUE,
  expires_at DATETIME,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_device (user_id, device_id),
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 视频分类表
CREATE TABLE IF NOT EXISTS video_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 视频表
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INT,
  subtitles_en LONGTEXT,
  subtitles_cn LONGTEXT,
  is_published TINYINT(1) DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category_id),
  INDEX idx_published (is_published),
  FOREIGN KEY (category_id) REFERENCES video_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  video_id VARCHAR(36),
  last_position INT DEFAULT 0,
  completed_sentences JSON DEFAULT '[]',
  total_practice_time INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_video (user_id, video_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 单词本表
CREATE TABLE IF NOT EXISTS word_book (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  word VARCHAR(100) NOT NULL,
  phonetic VARCHAR(100),
  translation TEXT,
  context TEXT,
  context_translation TEXT,
  definitions JSON DEFAULT '[]',
  mastery_level INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  INDEX idx_user (user_id),
  INDEX idx_word (word),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 单词缓存表
CREATE TABLE IF NOT EXISTS word_cache (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  word VARCHAR(100) NOT NULL UNIQUE,
  phonetic VARCHAR(100),
  translation TEXT,
  definitions JSON DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_word (word)
) ENGINE=InnoDB;

-- 授权码表
CREATE TABLE IF NOT EXISTS auth_codes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) NOT NULL UNIQUE,
  code_type ENUM('registration', '10min', '60min', 'pro_10min', 'pro_30min', 'pro_60min') NOT NULL,
  minutes_amount INT,
  is_used TINYINT(1) DEFAULT 0,
  used_by VARCHAR(36),
  used_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_used (is_used),
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 语音评测表
CREATE TABLE IF NOT EXISTS voice_assessments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  video_id VARCHAR(36),
  original_text TEXT NOT NULL,
  user_audio_url TEXT,
  accuracy_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 专业评测供应商表
CREATE TABLE IF NOT EXISTS professional_assessment_providers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50) NOT NULL,
  api_endpoint TEXT NOT NULL,
  api_key_secret_name VARCHAR(100),
  api_secret_key_name VARCHAR(100),
  region VARCHAR(50),
  is_active TINYINT(1) DEFAULT 1,
  is_default TINYINT(1) DEFAULT 0,
  priority INT DEFAULT 0,
  config_json JSON DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 专业评测记录表
CREATE TABLE IF NOT EXISTS professional_assessments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  video_id VARCHAR(36),
  original_text TEXT NOT NULL,
  provider_id VARCHAR(36),
  provider_name VARCHAR(100) NOT NULL,
  pronunciation_score DECIMAL(5,2),
  accuracy_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  words_result JSON,
  phonemes_result JSON,
  feedback TEXT,
  duration_seconds INT,
  minutes_charged INT DEFAULT 0,
  is_billed TINYINT(1) DEFAULT 0,
  billing_error TEXT,
  raw_response JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL,
  FOREIGN KEY (provider_id) REFERENCES professional_assessment_providers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 翻译供应商表
CREATE TABLE IF NOT EXISTS translation_providers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50) NOT NULL,
  app_id VARCHAR(100),
  api_key VARCHAR(255) NOT NULL,
  api_secret VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  is_default TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 用户统计表
CREATE TABLE IF NOT EXISTS user_statistics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL UNIQUE,
  total_watch_time INT DEFAULT 0,
  total_practice_time INT DEFAULT 0,
  today_watch_time INT DEFAULT 0,
  today_practice_time INT DEFAULT 0,
  total_videos_watched INT DEFAULT 0,
  total_sentences_completed INT DEFAULT 0,
  total_words_learned INT DEFAULT 0,
  total_assessments INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_study_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 每日统计表
CREATE TABLE IF NOT EXISTS daily_statistics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  study_date DATE NOT NULL,
  watch_time INT DEFAULT 0,
  practice_time INT DEFAULT 0,
  sentences_completed INT DEFAULT 0,
  words_learned INT DEFAULT 0,
  videos_watched INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, study_date),
  INDEX idx_user (user_id),
  INDEX idx_date (study_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 注册尝试记录表（防刷）
CREATE TABLE IF NOT EXISTS registration_attempts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ip_address VARCHAR(45) NOT NULL,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_time (attempted_at)
) ENGINE=InnoDB;

-- 插入默认视频分类
INSERT INTO video_categories (id, name, description, sort_order) VALUES
  (UUID(), '日常对话', '日常生活中的英语对话', 1),
  (UUID(), '商务英语', '商务场景的英语表达', 2),
  (UUID(), '新闻英语', '新闻报道和时事话题', 3),
  (UUID(), '影视英语', '电影和电视剧片段', 4),
  (UUID(), '演讲TED', 'TED演讲和公开演讲', 5)
ON DUPLICATE KEY UPDATE name = VALUES(name);
