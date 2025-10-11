-- Agent Airbnb Database Schema
-- This schema supports the AI concierge agent functionality

-- Users table (for future authentication)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    party_type ENUM('solo', 'couple', 'family', 'group', 'business') NOT NULL,
    party_size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User preferences table
CREATE TABLE user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    budget_tier ENUM('budget', 'mid-range', 'luxury') NOT NULL,
    interests JSON, -- Array of interests like ['outdoor', 'culture', 'food', 'nightlife']
    mobility_needs JSON, -- Array like ['wheelchair_accessible', 'no_stairs']
    dietary_restrictions JSON, -- Array like ['vegan', 'gluten_free', 'halal']
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Activities table
CREATE TABLE activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    price_tier ENUM('free', 'budget', 'mid-range', 'luxury') NOT NULL,
    duration_hours DECIMAL(3, 1),
    tags JSON, -- Array of tags like ['outdoor', 'museum', 'family_friendly']
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    child_friendly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restaurants table
CREATE TABLE restaurants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    price_tier ENUM('budget', 'mid-range', 'upscale', 'fine_dining') NOT NULL,
    cuisine_type VARCHAR(100),
    dietary_options JSON, -- Array like ['vegan', 'vegetarian', 'gluten_free']
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    child_friendly BOOLEAN DEFAULT FALSE,
    rating DECIMAL(2, 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Local events table
CREATE TABLE local_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    price_tier ENUM('free', 'budget', 'mid-range', 'luxury') NOT NULL,
    event_type VARCHAR(100),
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weather data table
CREATE TABLE weather_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    temperature_high INT,
    temperature_low INT,
    conditions VARCHAR(100),
    precipitation_chance INT,
    wind_speed INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated itineraries table
CREATE TABLE itineraries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    day_number INT NOT NULL,
    time_block ENUM('morning', 'afternoon', 'evening') NOT NULL,
    activity_id INT,
    restaurant_id INT,
    event_id INT,
    custom_activity TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL,
    FOREIGN KEY (event_id) REFERENCES local_events(id) ON DELETE SET NULL
);

-- Packing checklists table
CREATE TABLE packing_checklists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category ENUM('clothing', 'toiletries', 'electronics', 'documents', 'other') NOT NULL,
    is_essential BOOLEAN DEFAULT FALSE,
    weather_dependent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Agent conversations table (for NLU context)
CREATE TABLE agent_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_message TEXT NOT NULL,
    agent_response TEXT,
    intent VARCHAR(100),
    entities JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
