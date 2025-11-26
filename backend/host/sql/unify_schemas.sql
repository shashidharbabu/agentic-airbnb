-- =====================================================
-- SCHEMA UNIFICATION MIGRATION
-- Integrates Host and Traveller systems
-- =====================================================

USE airbnb_core;

-- =====================================================
-- 1. STANDARDIZE ID TYPES TO BIGINT
-- =====================================================

-- Temporarily disable foreign key checks for modifications
SET FOREIGN_KEY_CHECKS = 0;

-- Users table (used by traveller system)
ALTER TABLE users MODIFY COLUMN id BIGINT AUTO_INCREMENT;

-- Properties table
ALTER TABLE properties MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE properties MODIFY COLUMN owner_id BIGINT NOT NULL;

-- Bookings table
ALTER TABLE bookings MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE bookings MODIFY COLUMN property_id BIGINT NOT NULL;
ALTER TABLE bookings MODIFY COLUMN traveler_id BIGINT NULL;

-- Favorites table
ALTER TABLE favorites MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE favorites MODIFY COLUMN traveler_id BIGINT NOT NULL;
ALTER TABLE favorites MODIFY COLUMN property_id BIGINT NOT NULL;

-- Traveler profiles
ALTER TABLE traveler_profiles MODIFY COLUMN traveler_id BIGINT PRIMARY KEY;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 2. ADD MISSING COLUMNS TO BOOKINGS TABLE
-- =====================================================

-- Add total_price column if it doesn't exist (needed by traveller system)
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'bookings'
        AND COLUMN_NAME = 'total_price'
    ),
    'SELECT "Column total_price already exists" AS Status',
    'ALTER TABLE bookings ADD COLUMN total_price DECIMAL(10,2) NULL AFTER guests'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add special_requests column if it doesn't exist (nice to have)
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'bookings'
        AND COLUMN_NAME = 'special_requests'
    ),
    'SELECT "Column special_requests already exists" AS Status',
    'ALTER TABLE bookings ADD COLUMN special_requests TEXT NULL AFTER total_price'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. ENSURE PROPERTIES TABLE HAS ALL REQUIRED COLUMNS
-- =====================================================

-- Add 'type' column as alias for property_type (traveller system compatibility)
-- This is just for backward compatibility - we'll handle this in the API layer

-- Add 'price' column as alias for price_per_night (traveller system compatibility)
-- This is also handled in API layer, but we can add a computed column if needed

-- =====================================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Add index on bookings.traveler_id if not exists (already should exist from add_traveler_tables.sql)
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'bookings'
        AND INDEX_NAME = 'idx_bookings_traveler'
    ),
    'SELECT "Index idx_bookings_traveler already exists" AS Status',
    'ALTER TABLE bookings ADD INDEX idx_bookings_traveler (traveler_id)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 5. VERIFY FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Ensure bookings -> users foreign key exists
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND CONSTRAINT_NAME = 'fk_bookings_traveler'
        AND TABLE_NAME = 'bookings'
    ),
    'SELECT "Foreign key fk_bookings_traveler already exists" AS Status',
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_traveler FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure bookings -> properties foreign key exists
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND CONSTRAINT_NAME = 'fk_bookings_property'
        AND TABLE_NAME = 'bookings'
    ),
    'SELECT "Foreign key fk_bookings_property already exists" AS Status',
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure favorites -> users foreign key exists
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND CONSTRAINT_NAME = 'fk_favorites_traveler'
        AND TABLE_NAME = 'favorites'
    ),
    'SELECT "Foreign key fk_favorites_traveler already exists" AS Status',
    'ALTER TABLE favorites ADD CONSTRAINT fk_favorites_traveler FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure favorites -> properties foreign key exists
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND CONSTRAINT_NAME = 'fk_favorites_property'
        AND TABLE_NAME = 'favorites'
    ),
    'SELECT "Foreign key fk_favorites_property already exists" AS Status',
    'ALTER TABLE favorites ADD CONSTRAINT fk_favorites_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

SELECT 'Schema unification complete!' AS Status;

-- Show table structures
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_KEY
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'airbnb_core'
  AND TABLE_NAME IN ('users', 'properties', 'bookings', 'favorites')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT 'Migration completed successfully. Both Host and Traveller systems can now work with unified schema.' AS Message;

