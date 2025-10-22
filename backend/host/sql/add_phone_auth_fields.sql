USE airbnb_core;

-- Add phone authentication fields to owners table
ALTER TABLE owners 
ADD COLUMN firebase_uid VARCHAR(255) UNIQUE AFTER google_id;

-- Add index for firebase_uid for faster lookups
CREATE INDEX idx_owners_firebase_uid ON owners(firebase_uid);

-- Make email nullable since phone users might not have email
ALTER TABLE owners
MODIFY COLUMN email VARCHAR(255) NULL;

