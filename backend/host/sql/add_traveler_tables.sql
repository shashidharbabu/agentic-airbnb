USE airbnb_core;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('TRAVELER','HOST') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS traveler_profiles (
  traveler_id BIGINT PRIMARY KEY,
  phone VARCHAR(30),
  about TEXT,
  city VARCHAR(80),
  country VARCHAR(80),
  state_abbr VARCHAR(10),
  languages VARCHAR(160),
  gender VARCHAR(40),
  profile_image_url VARCHAR(255),
  CONSTRAINT fk_traveler_profiles_user FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  traveler_id BIGINT NOT NULL,
  property_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_favorites_traveler_property (traveler_id, property_id),
  CONSTRAINT fk_favorites_traveler FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
        FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'bookings'
         AND COLUMN_NAME = 'traveler_id'
    ),
    'SELECT 1',
    'ALTER TABLE bookings ADD COLUMN traveler_id BIGINT NULL AFTER property_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
        FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'bookings'
         AND INDEX_NAME = 'idx_bookings_traveler'
    ),
    'SELECT 1',
    'ALTER TABLE bookings ADD INDEX idx_bookings_traveler (traveler_id)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
        FROM information_schema.REFERENTIAL_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE()
         AND CONSTRAINT_NAME = 'fk_bookings_traveler'
         AND TABLE_NAME = 'bookings'
    ),
    'SELECT 1',
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_traveler FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
