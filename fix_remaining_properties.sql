-- =====================================================
-- FIX REMAINING PROPERTIES WITH INCOMPLETE DATA
-- Properties: 1, 19, 23
-- =====================================================

USE airbnb_core;

-- Property 1: Add missing fields
UPDATE properties 
SET 
  property_type = 'Loft',
  max_guests = 2,
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Air conditioning', 'Heating', 'TV', 'Workspace'),
  highlights = JSON_ARRAY('Cozy atmosphere', 'Great location', 'Modern amenities'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'First aid kit'),
  average_rating = 4.85,
  reviews_count = 127,
  views_last_90d = 580,
  booking_mode = 'INSTANT',
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 1;

-- Property 19: Fix unrealistic price and location
UPDATE properties 
SET 
  name = 'University District Student Housing',
  description = 'Comfortable 2-bedroom apartment near San Jose State University. Perfect for visiting students, families, or professors. Walking distance to campus, libraries, and downtown. Features include full kitchen, study areas, and free WiFi. Clean, safe, and affordable.',
  location = 'San Jose, California',
  address = '155 South 9th Street',
  street = '155 South 9th Street',
  city = 'San Jose',
  state = 'California',
  zip = '95112',
  country = 'United States',
  price_per_night = 115.00,
  max_guests = 4,
  property_type = 'Apartment',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Desk', 'Study area', 'Air conditioning', 'Heating', 'TV', 'Free parking'),
  highlights = JSON_ARRAY('Near SJSU', 'Student-friendly', 'Quiet study space'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Well-lit building', 'First aid kit'),
  average_rating = 4.7,
  reviews_count = 92,
  views_last_90d = 420,
  booking_mode = 'INSTANT',
  latitude = 37.3352,
  longitude = -121.8850,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 19;

-- Property 23: Fix $0 price
UPDATE properties 
SET 
  name = 'Downtown San Jose Apartment',
  description = 'Modern 1-bedroom apartment in prime downtown San Jose location. Close to San Jose Airport (SJC), making it perfect for travelers. Features include full kitchen, comfortable furnishings, and easy access to public transportation. Great for business trips and city exploration.',
  price_per_night = 105.00,
  max_guests = 3,
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Air conditioning', 'Heating', 'TV', 'Near airport', 'Free parking'),
  highlights = JSON_ARRAY('Near SJC Airport', 'Downtown location', 'Easy transit access'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Secure building', 'First aid kit'),
  average_rating = 4.75,
  reviews_count = 134,
  views_last_90d = 640,
  booking_mode = 'INSTANT',
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 23;

-- Verify all fixes
SELECT 'All properties fixed!' AS Status;

SELECT 
  id, 
  name, 
  price_per_night, 
  location, 
  property_type, 
  max_guests,
  average_rating,
  reviews_count
FROM properties 
WHERE id IN (1, 19, 23)
ORDER BY id;

