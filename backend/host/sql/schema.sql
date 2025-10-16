CREATE DATABASE IF NOT EXISTS airbnb_core;
USE airbnb_core;

CREATE TABLE IF NOT EXISTS owners (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  location VARCHAR(255),
  phone VARCHAR(50),
  about TEXT,
  avatar_url VARCHAR(512),
  street VARCHAR(255),
  unit VARCHAR(100),
  city VARCHAR(120),
  state VARCHAR(80),
  zip VARCHAR(20),
  country VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS properties (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  price_per_night DECIMAL(10,2) NOT NULL DEFAULT 0,
  bedrooms INT NOT NULL DEFAULT 1,
  bathrooms INT NOT NULL DEFAULT 1,
  amenities JSON,
  property_type VARCHAR(50),
  privacy_type VARCHAR(20),
  max_guests INT,
  beds INT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  street VARCHAR(255),
  unit VARCHAR(100),
  city VARCHAR(120),
  state VARCHAR(80),
  zip VARCHAR(20),
  country VARCHAR(80),
  highlights JSON,
  safety JSON,
  weekend_premium_percent DECIMAL(5,2) DEFAULT 0,
  discounts JSON,
  booking_mode ENUM('APPROVAL','INSTANT') DEFAULT 'APPROVAL',
  availability_start DATE,
  availability_end DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_properties_owner (owner_id),
  INDEX idx_properties_location (location),
  CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS property_photos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_photos_property (property_id),
  CONSTRAINT fk_photos_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  traveler_name VARCHAR(255) NOT NULL,
  traveler_email VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  guests INT NOT NULL DEFAULT 1,
  status ENUM('PENDING','ACCEPTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bookings_property (property_id),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_dates (start_date, end_date),
  CONSTRAINT fk_bookings_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;
