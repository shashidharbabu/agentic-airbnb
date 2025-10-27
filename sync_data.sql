-- =====================================================
-- SYNC & REDISTRIBUTE DATA BETWEEN TRAVELLER AND HOST
-- Make data more realistic by distributing properties evenly
-- =====================================================

USE airbnb_core;

-- Current state: Owner 1 has 26 properties, which is unrealistic
-- Let's redistribute properties among multiple owners

-- =====================================================
-- 1. Redistribute Properties to Different Owners
-- =====================================================

-- Owner 1 (host1@example.com) - Keep 5 properties
-- Properties 1, 25, 28, 6, 7

-- Owner 2 (host2@example.com) - Assign 5 properties  
UPDATE properties SET owner_id = 2 WHERE id IN (2, 8, 9, 10, 11);

-- Owner 3 (host3@example.com) - Assign 5 properties
UPDATE properties SET owner_id = 3 WHERE id IN (12, 13, 14, 15, 17);

-- Owner 4 (owner1@example.com) - Keep 1 + assign 4 more
UPDATE properties SET owner_id = 4 WHERE id IN (18, 19, 20, 22);

-- Owner 6 (shashidharbabu.pasupuletivenkatadurga@sjsu.edu) - Assign 4 properties
UPDATE properties SET owner_id = 6 WHERE id IN (3, 4, 5, 26);

-- Owner 7 - Keep 1, assign 2 more
UPDATE properties SET owner_id = 7 WHERE id IN (21, 23);

-- Owner 13 (Demo Host) - Keep 1, assign 1 more
UPDATE properties SET owner_id = 13 WHERE id IN (29);

-- =====================================================
-- 2. Update Booking Property Owners (maintain existing bookings)
-- =====================================================
-- Note: Existing bookings stay with their original properties
-- The property owner may have changed, but bookings are preserved

-- =====================================================
-- 3. Verify Distribution
-- =====================================================

SELECT 'PROPERTIES PER OWNER (After Sync):' AS Info;
SELECT 
  o.id,
  o.name,
  o.email,
  COUNT(p.id) as property_count
FROM owners o
LEFT JOIN properties p ON p.owner_id = o.id
GROUP BY o.id, o.name, o.email
HAVING property_count > 0
ORDER BY property_count DESC;

SELECT '' AS '';
SELECT 'OWNER 1 (host1@example.com) PROPERTIES:' AS Info;
SELECT id, name, location, price_per_night
FROM properties
WHERE owner_id = 1
ORDER BY id;

SELECT '' AS '';
SELECT 'BOOKINGS BY OWNER:' AS Info;
SELECT 
  p.owner_id,
  o.name as owner_name,
  COUNT(b.id) as booking_count,
  COUNT(CASE WHEN b.status = 'PENDING' THEN 1 END) as pending_count
FROM bookings b
JOIN properties p ON p.id = b.property_id
JOIN owners o ON o.id = p.owner_id
GROUP BY p.owner_id, o.name
ORDER BY booking_count DESC;

SELECT '' AS '';
SELECT 'TRAVELER 2 BOOKINGS:' AS Info;
SELECT 
  b.id,
  b.property_id,
  p.name as property_name,
  p.owner_id,
  o.name as owner_name,
  b.status,
  b.start_date,
  b.end_date
FROM bookings b
JOIN properties p ON p.id = b.property_id
JOIN owners o ON o.id = p.owner_id
WHERE b.traveler_id = 2
ORDER BY b.created_at DESC;

