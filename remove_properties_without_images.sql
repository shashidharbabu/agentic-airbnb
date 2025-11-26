-- =====================================================
-- REMOVE PROPERTIES NOT RENDERING IMAGES
-- Properties to remove:
-- 1. "Bright Studio in San Jose Downtown" (ID: 27)
-- 2. "City View Loft" (will find by name)
-- =====================================================

USE airbnb_core;

-- Show properties we're about to delete (for verification)
SELECT 'Properties to be deleted:' AS info;
SELECT id, name, location FROM properties 
WHERE (name LIKE '%Bright Studio%San Jose Downtown%' OR id = 27)
   OR (name LIKE '%City View Loft%' OR name = 'City View Loft');

-- Delete property photos for Property ID 27 (Bright Studio)
DELETE FROM property_photos WHERE property_id = 27;

-- Delete any bookings for Property ID 27
DELETE FROM bookings WHERE property_id = 27;

-- Delete favorites for Property ID 27
DELETE FROM favorites WHERE property_id = 27;

-- Delete Property ID 27 (Bright Studio in San Jose Downtown)
DELETE FROM properties WHERE id = 27;

-- Delete property photos for City View Loft (if found)
DELETE pp FROM property_photos pp
INNER JOIN properties p ON pp.property_id = p.id
WHERE p.name LIKE '%City View Loft%' OR p.name = 'City View Loft';

-- Delete bookings for City View Loft
DELETE b FROM bookings b
INNER JOIN properties p ON b.property_id = p.id
WHERE p.name LIKE '%City View Loft%' OR p.name = 'City View Loft';

-- Delete favorites for City View Loft
DELETE f FROM favorites f
INNER JOIN properties p ON f.property_id = p.id
WHERE p.name LIKE '%City View Loft%' OR p.name = 'City View Loft';

-- Delete the City View Loft property itself
DELETE FROM properties 
WHERE name LIKE '%City View Loft%' OR name = 'City View Loft';

-- Verify deletions
SELECT 'Verification - Remaining properties with similar names:' AS status;
SELECT id, name FROM properties 
WHERE name LIKE '%Bright Studio%' 
   OR name LIKE '%City View Loft%';

SELECT '✅ Properties removed successfully!' AS status;

