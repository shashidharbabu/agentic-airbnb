-- =====================================================
-- ADD IMAGES FOR PROPERTIES MISSING PHOTOS
-- Properties: 26, 27, 28, 29
-- =====================================================

USE airbnb_core;

-- =====================================================
-- Property 26: Artist Studio Loft in SoFA District
-- Modern, urban loft style images
-- =====================================================

INSERT INTO property_photos (property_id, file_path) VALUES
(26, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'),
(26, 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800'),
(26, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800');

-- =====================================================
-- Property 27 (411): Bright Studio in San Jose Downtown
-- Compact, modern apartment/studio images
-- =====================================================

INSERT INTO property_photos (property_id, file_path) VALUES
(27, 'https://images.unsplash.com/photo-1502672260066-6bc1484541fd?w=800'),
(27, 'https://images.unsplash.com/photo-1600566752229-250ed79c5494?w=800'),
(27, 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800');

-- =====================================================
-- Property 28 (412): Charming House Near SJSU
-- Family home, residential house images
-- =====================================================

-- Add 2 more images to property 28 (it already has 1)
INSERT INTO property_photos (property_id, file_path) VALUES
(28, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'),
(28, 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800');

-- =====================================================
-- Property 29: Private Garden Suite in Los Gatos
-- Cozy, garden, guest house style images
-- =====================================================

INSERT INTO property_photos (property_id, file_path) VALUES
(29, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'),
(29, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'),
(29, 'https://images.unsplash.com/photo-1600563438938-a650e6d0cf04?w=800');

-- =====================================================
-- VERIFY IMAGE ADDITIONS
-- =====================================================

SELECT 'Images added successfully!' AS Status;

SELECT 
  pp.property_id,
  p.name AS property_name,
  COUNT(pp.id) AS photo_count
FROM properties p
LEFT JOIN property_photos pp ON pp.property_id = p.id
WHERE p.id IN (26, 27, 28, 29)
GROUP BY pp.property_id, p.name
ORDER BY pp.property_id;

-- Show all properties with photo counts
SELECT 
  p.id,
  p.name,
  COUNT(pp.id) AS photo_count
FROM properties p
LEFT JOIN property_photos pp ON pp.property_id = p.id
GROUP BY p.id, p.name
ORDER BY p.id;

