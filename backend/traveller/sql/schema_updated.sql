CREATE DATABASE IF NOT EXISTS airbnb_core;
USE airbnb_core;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('TRAVELER','HOST') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS traveler_profiles (
  traveler_id INT PRIMARY KEY,
  phone VARCHAR(30),
  about TEXT,
  city VARCHAR(80),
  country VARCHAR(80),
  state_abbr VARCHAR(10),
  languages VARCHAR(160),
  gender VARCHAR(40),
  profile_image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_traveler_profiles_user FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS properties (
  id INT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  type VARCHAR(80),
  location VARCHAR(160) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  max_guests INT NOT NULL DEFAULT 1,
  amenities_json JSON,
  bedrooms INT,
  bathrooms INT,
  images_json JSON,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_properties_owner (owner_id),
  INDEX idx_properties_location (location),
  INDEX idx_properties_type (type),
  INDEX idx_properties_active (active),
  CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  traveler_id INT NOT NULL,
  property_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  guests INT NOT NULL,
  status ENUM('PENDING','ACCEPTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_price DECIMAL(10,2),
  INDEX idx_bookings_traveler (traveler_id),
  INDEX idx_bookings_property (property_id),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_dates (start_date, end_date),
  CONSTRAINT fk_bookings_traveler FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  traveler_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (traveler_id, property_id),
  INDEX idx_favorites_traveler (traveler_id),
  INDEX idx_favorites_property (property_id),
  CONSTRAINT fk_favorites_traveler FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
('John Doe', 'john.doe@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'TRAVELER'),
('Jane Smith', 'jane.smith@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'TRAVELER'),
('Mike Wilson', 'mike.wilson@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'TRAVELER'),
('Host User', 'host@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HOST');


INSERT IGNORE INTO traveler_profiles (traveler_id, phone, about, city, country, state_abbr, languages, gender) VALUES
(1, '+1234567890', 'Love traveling and exploring new places!', 'New York', 'United States', 'NY', 'English,Spanish', 'male'),
(2, '+1987654321', 'Adventure seeker and food lover', 'Los Angeles', 'United States', 'CA', 'English,French', 'female'),
(3, '+1555123456', 'Business traveler who loves comfort', 'Chicago', 'United States', 'IL', 'English', 'male');


INSERT IGNORE INTO properties (owner_id, name, type, location, description, price, max_guests, amenities_json, bedrooms, bathrooms, images_json) VALUES
(4, 'Cozy Downtown Apartment', 'Apartment', 'San Francisco, CA', 'Beautiful apartment in the heart of downtown', 150.00, 4, '["wifi","kitchen","parking","gym"]', 2, 1, '["https://example.com/image1.jpg","https://example.com/image2.jpg"]'),
(4, 'Luxury Beach House', 'House', 'Malibu, CA', 'Stunning beachfront property with ocean views', 500.00, 8, '["wifi","kitchen","pool","beach_access","parking"]', 4, 3, '["https://example.com/beach1.jpg","https://example.com/beach2.jpg"]'),
(4, 'Modern City Loft', 'Apartment', 'New York, NY', 'Sleek loft in trendy neighborhood', 200.00, 2, '["wifi","kitchen","rooftop","gym"]', 1, 1, '["https://example.com/loft1.jpg","https://example.com/loft2.jpg"]');
