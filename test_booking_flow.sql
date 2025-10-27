-- =====================================================
-- TEST BOOKING FLOW
-- Create test bookings to verify they appear on both sides
-- =====================================================

USE airbnb_core;

-- Show current state
SELECT 'Current Users:' AS Info;
SELECT id, name, email, role FROM users WHERE role = 'TRAVELER';

SELECT 'Current Owners:' AS Info;
SELECT id, name, email FROM owners LIMIT 5;

SELECT 'Current Bookings:' AS Info;
SELECT id, property_id, traveler_id, traveler_name, start_date, end_date, status, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;

-- Create a test booking for traveler_id = 2 (current logged-in traveler)
-- Property 28 belongs to owner_id = 1 (Host One)

INSERT INTO bookings (
  property_id, 
  traveler_id, 
  traveler_name, 
  traveler_email,
  start_date, 
  end_date, 
  guests, 
  total_price,
  special_requests,
  status
) VALUES (
  28,  -- Charming House Near SJSU (owned by owner_id 1)
  2,   -- Traveler ID 2 (current logged-in user)
  'Shashidhar Babu Pasupuleti Venkata Durga',
  'host1@example.com',
  '2025-10-28',
  '2025-10-31',
  3,
  435.00,  -- $145 x 3 nights
  'fvrfgvre',
  'PENDING'
);

SELECT 'New Booking Created:' AS Info;
SELECT id, property_id, traveler_id, traveler_name, start_date, end_date, guests, total_price, status 
FROM bookings 
WHERE traveler_id = 2
ORDER BY created_at DESC;

-- Verify the booking can be retrieved by host (owner_id = 1)
SELECT 'Host Should See (owner_id = 1):' AS Info;
SELECT 
  b.id,
  b.property_id,
  b.traveler_id,
  b.traveler_name,
  b.traveler_email,
  b.start_date,
  b.end_date,
  b.guests,
  b.status,
  b.total_price,
  b.special_requests,
  p.name AS property_name,
  p.owner_id
FROM bookings b
JOIN properties p ON p.id = b.property_id
WHERE p.owner_id = 1
  AND b.status = 'PENDING'
ORDER BY b.created_at DESC;

-- Verify the booking can be retrieved by traveler
SELECT 'Traveler Should See (traveler_id = 2):' AS Info;
SELECT 
  b.id,
  b.property_id,
  b.traveler_id,
  b.start_date,
  b.end_date,
  b.guests,
  b.status,
  b.total_price,
  p.name AS property_name
FROM bookings b
JOIN properties p ON p.id = b.property_id
WHERE b.traveler_id = 2
ORDER BY b.created_at DESC;

