USE airbnb_core;

-- Add OAuth fields to owners table (ignore errors if columns already exist)
ALTER TABLE owners 
ADD COLUMN google_id VARCHAR(255) UNIQUE AFTER email;

ALTER TABLE owners
ADD COLUMN auth_provider ENUM('email', 'google', 'phone') DEFAULT 'email' AFTER google_id;

ALTER TABLE owners
MODIFY COLUMN password_hash VARCHAR(255) NULL;

