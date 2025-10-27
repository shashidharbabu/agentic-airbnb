-- =====================================================
-- POPULATE ALL LISTINGS WITH REALISTIC AIRBNB DATA
-- Database: airbnb_core
-- Updates all "Untitled listing" properties with complete information
-- =====================================================

USE airbnb_core;

-- =====================================================
-- UPDATE PROPERTIES 6-15, 17-18, 26, 29 (Untitled listings)
-- =====================================================

-- Property 6: Modern Downtown Apartment
UPDATE properties 
SET 
  name = 'Modern Downtown Apartment',
  description = 'Stylish 1-bedroom apartment in the heart of San Jose downtown. Features include a modern kitchen with stainless steel appliances, in-unit washer/dryer, and stunning city views. Walking distance to San Pedro Square, restaurants, and nightlife. Perfect for business travelers and urban explorers.',
  location = 'San Jose, California',
  address = '88 South 4th Street',
  street = '88 South 4th Street',
  unit = 'Apt 301',
  city = 'San Jose',
  state = 'California',
  zip = '95112',
  country = 'United States',
  price_per_night = 110.00,
  bedrooms = 1,
  bathrooms = 1,
  beds = 1,
  max_guests = 2,
  property_type = 'Apartment',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air conditioning', 'Heating', 'TV', 'Workspace', 'City views'),
  highlights = JSON_ARRAY('Great location', 'Recently renovated', 'Self check-in'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'First aid kit'),
  average_rating = 4.7,
  reviews_count = 83,
  views_last_90d = 420,
  booking_mode = 'INSTANT',
  latitude = 37.3352,
  longitude = -121.8890,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 6;

-- Property 7: Cozy Studio Near Tech Campuses
UPDATE properties 
SET 
  name = 'Cozy Studio Near Apple & Google',
  description = 'Efficient studio apartment perfectly located between major tech campuses. Ideal for business travelers and interns. Features a comfortable queen bed, kitchenette, high-speed internet, and dedicated workspace. Free parking and easy access to highways 85 and 280.',
  location = 'Cupertino, California',
  address = '10250 Bandley Drive',
  street = '10250 Bandley Drive',
  unit = 'Studio 12',
  city = 'Cupertino',
  state = 'California',
  zip = '95014',
  country = 'United States',
  price_per_night = 95.00,
  bedrooms = 1,
  bathrooms = 1,
  beds = 1,
  max_guests = 2,
  property_type = 'Apartment',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchenette', 'Free parking', 'Air conditioning', 'Heating', 'TV', 'Workspace'),
  highlights = JSON_ARRAY('Near tech campuses', 'Fast WiFi', 'Free parking'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Well-lit parking', 'First aid kit'),
  average_rating = 4.6,
  reviews_count = 67,
  views_last_90d = 340,
  booking_mode = 'INSTANT',
  latitude = 37.3230,
  longitude = -122.0322,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 7;

-- Property 8: Spacious Family Retreat
UPDATE properties 
SET 
  name = 'Spacious Family Retreat with Pool',
  description = 'Beautiful 3-bedroom house with swimming pool and large backyard. Perfect for families visiting the Bay Area. Modern kitchen, comfortable living spaces, game room, and BBQ area. Close to parks, shopping, and excellent schools. Quiet residential neighborhood with plenty of parking.',
  location = 'Santa Clara, California',
  address = '2456 Oak Grove Avenue',
  street = '2456 Oak Grove Avenue',
  city = 'Santa Clara',
  state = 'California',
  zip = '95051',
  country = 'United States',
  price_per_night = 220.00,
  bedrooms = 3,
  bathrooms = 2,
  beds = 4,
  max_guests = 8,
  property_type = 'House',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Pool', 'Washer', 'Dryer', 'Free parking', 'BBQ grill', 'Backyard', 'Air conditioning', 'Heating', 'TV', 'Game room'),
  highlights = JSON_ARRAY('Family-friendly', 'Pool', 'Great for groups'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Pool safety fence', 'Security cameras', 'First aid kit'),
  average_rating = 4.9,
  reviews_count = 124,
  views_last_90d = 680,
  booking_mode = 'APPROVAL',
  latitude = 37.3541,
  longitude = -121.9552,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 8;

-- Property 9: Luxury Penthouse Suite
UPDATE properties 
SET 
  name = 'Luxury Penthouse with Rooftop Terrace',
  description = 'Exquisite 2-bedroom penthouse with private rooftop terrace and 360-degree views. High-end finishes throughout, gourmet kitchen, spa-like bathrooms, and premium amenities. Building features include gym, pool, concierge, and valet parking. Perfect for special occasions and corporate retreats.',
  location = 'San Jose, California',
  address = '200 Park Center Plaza',
  street = '200 Park Center Plaza',
  unit = 'Penthouse 2',
  city = 'San Jose',
  state = 'California',
  zip = '95113',
  country = 'United States',
  price_per_night = 350.00,
  bedrooms = 2,
  bathrooms = 2,
  beds = 2,
  max_guests = 4,
  property_type = 'Penthouse',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Gourmet kitchen', 'Gym', 'Pool', 'Concierge', 'Valet parking', 'Rooftop terrace', 'City views', 'Air conditioning', 'Heating', 'TV', 'Workspace', 'Hot tub'),
  highlights = JSON_ARRAY('Luxury amenities', 'Rooftop terrace', '360° views'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', '24/7 security', 'Secure building', 'First aid kit'),
  average_rating = 4.95,
  reviews_count = 178,
  views_last_90d = 920,
  booking_mode = 'APPROVAL',
  latitude = 37.3318,
  longitude = -121.8909,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 9;

-- Property 10: Charming Cottage Near Downtown
UPDATE properties 
SET 
  name = 'Charming Cottage Near Downtown',
  description = 'Adorable 2-bedroom cottage with garden and patio in quiet neighborhood. Recently updated with modern amenities while maintaining vintage charm. Walking distance to light rail, restaurants, and shopping. Perfect for small families or couples seeking a peaceful retreat close to city attractions.',
  location = 'San Jose, California',
  address = '567 Vine Street',
  street = '567 Vine Street',
  city = 'San Jose',
  state = 'California',
  zip = '95125',
  country = 'United States',
  price_per_night = 135.00,
  bedrooms = 2,
  bathrooms = 1,
  beds = 2,
  max_guests = 4,
  property_type = 'House',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Free parking', 'Garden', 'Patio', 'Air conditioning', 'Heating', 'TV', 'Washer', 'Dryer'),
  highlights = JSON_ARRAY('Quiet neighborhood', 'Garden patio', 'Near transit'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Well-lit exterior', 'First aid kit'),
  average_rating = 4.8,
  reviews_count = 96,
  views_last_90d = 480,
  booking_mode = 'INSTANT',
  latitude = 37.3024,
  longitude = -121.8975,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 10;

-- Property 11: Modern Townhouse
UPDATE properties 
SET 
  name = 'Modern Townhouse in Silicon Valley',
  description = 'Contemporary 2-bedroom townhouse in the heart of Silicon Valley. Open floor plan with modern finishes, 2-car garage, private patio, and community amenities. Close to Stanford, tech companies, and shopping centers. Perfect for extended stays and remote workers.',
  location = 'Palo Alto, California',
  address = '345 University Avenue',
  street = '345 University Avenue',
  unit = 'Unit B',
  city = 'Palo Alto',
  state = 'California',
  zip = '94301',
  country = 'United States',
  price_per_night = 280.00,
  bedrooms = 2,
  bathrooms = 2,
  beds = 2,
  max_guests = 4,
  property_type = 'Townhouse',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Garage parking', 'Washer', 'Dryer', 'Patio', 'Air conditioning', 'Heating', 'TV', 'Workspace', 'Community pool'),
  highlights = JSON_ARRAY('Near Stanford', 'Great for remote work', 'Community amenities'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Gated community', 'Security system', 'First aid kit'),
  average_rating = 4.85,
  reviews_count = 142,
  views_last_90d = 750,
  booking_mode = 'INSTANT',
  latitude = 37.4419,
  longitude = -122.1430,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 11;

-- Property 12: Beachside Getaway
UPDATE properties 
SET 
  name = 'Beachside Bungalow in Santa Cruz',
  description = 'Charming beach bungalow just steps from the sand. Perfect coastal retreat with ocean views, outdoor shower, and beach gear included. Enjoy morning coffee on the deck while watching surfers, or walk to the boardwalk and pier. Ideal for beach lovers and surf enthusiasts.',
  location = 'Santa Cruz, California',
  address = '789 Beach Street',
  street = '789 Beach Street',
  city = 'Santa Cruz',
  state = 'California',
  zip = '95060',
  country = 'United States',
  price_per_night = 195.00,
  bedrooms = 2,
  bathrooms = 1,
  beds = 2,
  max_guests = 4,
  property_type = 'House',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Free parking', 'Ocean views', 'Beach gear', 'Outdoor shower', 'Deck', 'Heating', 'TV'),
  highlights = JSON_ARRAY('Beachfront', 'Ocean views', 'Beach gear included'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'First aid kit'),
  average_rating = 4.9,
  reviews_count = 187,
  views_last_90d = 890,
  booking_mode = 'INSTANT',
  latitude = 36.9741,
  longitude = -122.0308,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 12;

-- Property 13: Wine Country Estate
UPDATE properties 
SET 
  name = 'Wine Country Estate with Vineyard Views',
  description = 'Stunning estate in Napa Valley wine country. 3 bedrooms, gourmet kitchen, infinity pool, and panoramic vineyard views. Perfect for wine lovers, special celebrations, and romantic getaways. Walking distance to several wineries and fine dining restaurants.',
  location = 'Napa, California',
  address = '1234 Silverado Trail',
  street = '1234 Silverado Trail',
  city = 'Napa',
  state = 'California',
  zip = '94558',
  country = 'United States',
  price_per_night = 450.00,
  bedrooms = 3,
  bathrooms = 3,
  beds = 3,
  max_guests = 6,
  property_type = 'Villa',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Gourmet kitchen', 'Pool', 'Hot tub', 'Vineyard views', 'Fire pit', 'Wine fridge', 'Air conditioning', 'Heating', 'TV', 'Outdoor dining'),
  highlights = JSON_ARRAY('Wine country', 'Vineyard views', 'Luxury amenities'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Pool safety fence', 'Security system', 'First aid kit'),
  average_rating = 4.98,
  reviews_count = 245,
  views_last_90d = 1150,
  booking_mode = 'APPROVAL',
  latitude = 38.2975,
  longitude = -122.2869,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 13;

-- Property 14: Urban Loft with City Views
UPDATE properties 
SET 
  name = 'Urban Loft with Panoramic City Views',
  description = 'Sleek industrial loft in downtown San Jose with floor-to-ceiling windows and stunning city views. Open concept living with exposed brick, polished concrete floors, and modern finishes. Walking distance to restaurants, bars, SAP Center, and convention center.',
  location = 'San Jose, California',
  address = '150 South First Street',
  street = '150 South First Street',
  unit = 'Loft 805',
  city = 'San Jose',
  state = 'California',
  zip = '95113',
  country = 'United States',
  price_per_night = 165.00,
  bedrooms = 1,
  bathrooms = 1,
  beds = 1,
  max_guests = 2,
  property_type = 'Loft',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Gym', 'Parking included', 'City views', 'Air conditioning', 'Heating', 'TV', 'Workspace', 'High ceilings'),
  highlights = JSON_ARRAY('City views', 'Downtown location', 'Modern design'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Secure building', '24/7 security', 'First aid kit'),
  average_rating = 4.82,
  reviews_count = 156,
  views_last_90d = 720,
  booking_mode = 'INSTANT',
  latitude = 37.3318,
  longitude = -121.8890,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 14;

-- Property 15: Mountain Cabin Retreat
UPDATE properties 
SET 
  name = 'Cozy Mountain Cabin in Lake Tahoe',
  description = 'Rustic yet comfortable cabin in the woods near Lake Tahoe. Perfect for winter skiing or summer hiking. Features wood-burning fireplace, full kitchen, hot tub, and mountain views. Close to ski resorts, beaches, and hiking trails. Ideal for outdoor enthusiasts and nature lovers.',
  location = 'South Lake Tahoe, California',
  address = '4567 Tahoe Mountain Road',
  street = '4567 Tahoe Mountain Road',
  city = 'South Lake Tahoe',
  state = 'California',
  zip = '96150',
  country = 'United States',
  price_per_night = 240.00,
  bedrooms = 2,
  bathrooms = 1,
  beds = 3,
  max_guests = 6,
  property_type = 'Cabin',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Free parking', 'Hot tub', 'Fireplace', 'Mountain views', 'Heating', 'TV', 'Deck'),
  highlights = JSON_ARRAY('Near ski resorts', 'Hot tub', 'Mountain views'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Emergency kit', 'First aid kit'),
  average_rating = 4.88,
  reviews_count = 203,
  views_last_90d = 980,
  booking_mode = 'INSTANT',
  latitude = 38.9399,
  longitude = -119.9772,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 15;

-- Property 17: Historic Victorian Home
UPDATE properties 
SET 
  name = 'Historic Victorian Home in Willow Glen',
  description = 'Beautifully preserved Victorian home in the charming Willow Glen neighborhood. Original hardwood floors, period details, and modern updates. 3 bedrooms, gourmet kitchen, and landscaped garden. Walk to boutique shops, cafes, and farmers market. Perfect for families and history enthusiasts.',
  location = 'San Jose, California',
  address = '345 Lincoln Avenue',
  street = '345 Lincoln Avenue',
  city = 'San Jose',
  state = 'California',
  zip = '95125',
  country = 'United States',
  price_per_night = 210.00,
  bedrooms = 3,
  bathrooms = 2,
  beds = 3,
  max_guests = 6,
  property_type = 'House',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Free parking', 'Garden', 'Washer', 'Dryer', 'Air conditioning', 'Heating', 'TV', 'Workspace'),
  highlights = JSON_ARRAY('Historic charm', 'Great neighborhood', 'Walking distance to shops'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Security system', 'First aid kit'),
  average_rating = 4.92,
  reviews_count = 168,
  views_last_90d = 810,
  booking_mode = 'APPROVAL',
  latitude = 37.3024,
  longitude = -121.8975,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 17;

-- Property 18: Contemporary Condo
UPDATE properties 
SET 
  name = 'Contemporary Condo Near Apple Park',
  description = 'Brand new 2-bedroom condo in Cupertino, minutes from Apple Park and major tech campuses. Modern finishes, smart home features, full kitchen, and in-unit laundry. Building amenities include gym, pool, and secure parking. Perfect for tech professionals and extended stays.',
  location = 'Cupertino, California',
  address = '10800 North Wolfe Road',
  street = '10800 North Wolfe Road',
  unit = 'Unit 404',
  city = 'Cupertino',
  state = 'California',
  zip = '95014',
  country = 'United States',
  price_per_night = 190.00,
  bedrooms = 2,
  bathrooms = 2,
  beds = 2,
  max_guests = 4,
  property_type = 'Condo',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Gym', 'Pool', 'Parking included', 'Washer', 'Dryer', 'Air conditioning', 'Heating', 'TV', 'Workspace', 'Smart home'),
  highlights = JSON_ARRAY('Near Apple Park', 'Brand new', 'Smart home features'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Secure building', 'Security cameras', 'First aid kit'),
  average_rating = 4.75,
  reviews_count = 64,
  views_last_90d = 520,
  booking_mode = 'INSTANT',
  latitude = 37.3230,
  longitude = -122.0322,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 18;

-- Property 26: Artist's Studio Loft
UPDATE properties 
SET 
  name = 'Artist Studio Loft in SoFA District',
  description = 'Bright and airy artist loft in San Jose South First Area (SoFA). High ceilings, large windows, and creative vibe. Perfect for artists, designers, and creative professionals. Walking distance to art galleries, coffee shops, and farmers market. Features workspace, fast WiFi, and natural light.',
  location = 'San Jose, California',
  address = '388 South First Street',
  street = '388 South First Street',
  unit = 'Studio 201',
  city = 'San Jose',
  state = 'California',
  zip = '95113',
  country = 'United States',
  price_per_night = 120.00,
  bedrooms = 1,
  bathrooms = 1,
  beds = 1,
  max_guests = 2,
  property_type = 'Loft',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchenette', 'Air conditioning', 'Heating', 'Large windows', 'Natural light', 'Workspace', 'Art district'),
  highlights = JSON_ARRAY('Creative space', 'Natural light', 'Art district location'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Secure building', 'First aid kit'),
  average_rating = 4.7,
  reviews_count = 78,
  views_last_90d = 390,
  booking_mode = 'INSTANT',
  latitude = 37.3318,
  longitude = -121.8890,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 26;

-- Property 29: Garden Suite Retreat
UPDATE properties 
SET 
  name = 'Private Garden Suite in Los Gatos',
  description = 'Tranquil private suite with separate entrance in upscale Los Gatos neighborhood. Features include queen bed, kitchenette, private bathroom, and access to beautiful garden. Close to downtown Los Gatos, hiking trails, and wineries. Perfect for a peaceful getaway while staying close to Silicon Valley.',
  location = 'Los Gatos, California',
  address = '123 Garden Lane',
  street = '123 Garden Lane',
  city = 'Los Gatos',
  state = 'California',
  zip = '95030',
  country = 'United States',
  price_per_night = 155.00,
  bedrooms = 1,
  bathrooms = 1,
  beds = 1,
  max_guests = 2,
  property_type = 'Guest suite',
  privacy_type = 'Private room',
  amenities = JSON_ARRAY('WiFi', 'Kitchenette', 'Free parking', 'Garden access', 'Private entrance', 'Air conditioning', 'Heating', 'TV'),
  highlights = JSON_ARRAY('Quiet retreat', 'Garden access', 'Great location'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Well-lit exterior', 'First aid kit'),
  average_rating = 4.88,
  reviews_count = 112,
  views_last_90d = 560,
  booking_mode = 'INSTANT',
  latitude = 37.2358,
  longitude = -121.9623,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 29;

-- =====================================================
-- IMPROVE PROPERTIES 27 & 28 (411 & 412)
-- =====================================================

-- Property 27 (411): Enhance data
UPDATE properties 
SET 
  name = 'Bright Studio in San Jose Downtown',
  description = 'Comfortable studio apartment in the heart of San Jose. Perfect for solo travelers and couples. Features include a full kitchen, comfortable sleeping area, workspace, and modern amenities. Easy access to public transportation, restaurants, and entertainment. Great value for downtown location.',
  address = '25 South Second Street',
  street = '25 South Second Street',
  unit = 'Unit 411',
  city = 'San Jose',
  state = 'California',
  zip = '95113',
  country = 'United States',
  price_per_night = 88.00,
  bedrooms = 1,
  bathrooms = 1,
  beds = 1,
  max_guests = 2,
  property_type = 'Apartment',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Air conditioning', 'Heating', 'TV', 'Workspace'),
  highlights = JSON_ARRAY('Downtown location', 'Great value', 'Near transit'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'First aid kit'),
  average_rating = 4.6,
  reviews_count = 45,
  views_last_90d = 280,
  booking_mode = 'INSTANT',
  latitude = 37.3352,
  longitude = -121.8890,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 27;

-- Property 28 (412): Enhance data
UPDATE properties 
SET 
  name = 'Charming House Near SJSU',
  description = 'Lovely single-family home close to San Jose State University and downtown. Perfect for visiting families, professors, or students. Features 2 bedrooms, full kitchen, backyard, and free parking. Quiet neighborhood with easy access to campus and major freeways. Pet-friendly upon request.',
  address = '412 South 10th Street',
  street = '412 South 10th Street',
  city = 'San Jose',
  state = 'California',
  zip = '95112',
  country = 'United States',
  price_per_night = 145.00,
  bedrooms = 2,
  bathrooms = 1,
  beds = 2,
  max_guests = 4,
  property_type = 'House',
  privacy_type = 'Entire place',
  amenities = JSON_ARRAY('WiFi', 'Kitchen', 'Free parking', 'Backyard', 'Washer', 'Dryer', 'Air conditioning', 'Heating', 'TV', 'Pet-friendly'),
  highlights = JSON_ARRAY('Near SJSU', 'Pet-friendly', 'Free parking'),
  safety = JSON_ARRAY('Smoke detector', 'Carbon monoxide detector', 'Fire extinguisher', 'Security cameras', 'First aid kit'),
  average_rating = 4.7,
  reviews_count = 58,
  views_last_90d = 340,
  booking_mode = 'APPROVAL',
  latitude = 37.3352,
  longitude = -121.8850,
  availability_start = CURDATE(),
  availability_end = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
WHERE id = 28;

-- =====================================================
-- VERIFY UPDATES
-- =====================================================

SELECT 'Properties updated successfully!' AS Status;
SELECT id, name, price_per_night, location, property_type, bedrooms, average_rating, reviews_count 
FROM properties 
WHERE id IN (6,7,8,9,10,11,12,13,14,15,17,18,26,27,28,29)
ORDER BY id;

