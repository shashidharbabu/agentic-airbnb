const express = require('express');
const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database-mongodb');
const { optionalAuth } = require('../middleware/auth');

console.log('🚀 PROPERTIES ROUTE FILE LOADED - VERSION 2.0');

const router = express.Router();
const PLACEHOLDER_PHOTO_PATH =
  process.env.DEFAULT_PROPERTY_PHOTO || '/uploads/property-photos/placeholder-house.jpg';

const searchSchema = Joi.object({
  location: Joi.string().optional().default(''),
  check_in: Joi.string().optional().default(''),
  check_out: Joi.string().optional().default(''),
  guests: Joi.number().integer().min(0).optional(),
  property_type: Joi.string().optional().default(''),
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
}).options({ stripUnknown: true });


router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const {
      location,
      check_in,
      check_out,
      guests,
      property_type,
      min_price,
      max_price,
      page,
      limit
    } = value;

    const skip = (page - 1) * limit;

    console.log('[Search] Query params:', { location, check_in, check_out, guests, property_type, min_price, max_price, page, limit });
    
    console.log('[Search] Attempting DB connection...');
    let db;
    try {
      db = await getDB();
      console.log('[Search] DB connection acquired, database name:', db.databaseName);
    } catch (dbError) {
      console.error('[Search] Database connection failed:', dbError);
      return res.status(500).json({ error: 'Database connection failed', details: dbError.message });
    }
    
    const propertiesCollection = db.collection('properties');
    const bookingsCollection = db.collection('bookings');
    const ownersCollection = db.collection('owners');
    const propertyPhotosCollection = db.collection('property_photos');
    
    // Verify we can access the collection
    const collectionCount = await propertiesCollection.countDocuments();
    console.log('[Search] Properties collection accessible, total documents:', collectionCount);

    try {
      const query = {};

      // Helper to check if value is meaningful (not empty/null/undefined)
      const hasValue = (val) => val !== undefined && val !== null && val !== '';

      // Location search (multiple fields)
      if (hasValue(location)) {
        query.$or = [
          { location: { $regex: location, $options: 'i' } },
          { city: { $regex: location, $options: 'i' } },
          { state: { $regex: location, $options: 'i' } },
          { country: { $regex: location, $options: 'i' } },
          { name: { $regex: location, $options: 'i' } }
        ];
      }

      // Guests filter
      if (guests && guests > 0) {
        query.max_guests = { $gte: guests };
      }

      // Property type filter
      if (hasValue(property_type)) {
        query.property_type = property_type;
      }

      // Price filters
      if (typeof min_price === 'number' && min_price >= 0) {
        query.price_per_night = { ...(query.price_per_night || {}), $gte: min_price };
      }
      if (typeof max_price === 'number' && max_price >= 0) {
        query.price_per_night = { ...(query.price_per_night || {}), $lte: max_price };
      }

      // Date availability check - get conflicting property IDs first
      let excludedPropertyIds = [];
      if (hasValue(check_in) && hasValue(check_out)) {
        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);
        
        const conflictingBookings = await bookingsCollection.find({
          status: 'ACCEPTED',
          $or: [
            { start_date: { $lte: checkOutDate }, end_date: { $gt: checkInDate } },
            { start_date: { $lt: checkOutDate }, end_date: { $gte: checkInDate } },
            { start_date: { $gte: checkInDate }, end_date: { $lte: checkOutDate } }
          ]
        }).toArray();

        excludedPropertyIds = conflictingBookings.map(b => b.property_id);
        if (excludedPropertyIds.length > 0) {
          query._id = { $nin: excludedPropertyIds };
        }
      }

      console.log('[Search] MongoDB query:', JSON.stringify(query, null, 2));
      
      // Get total count
      const total = await propertiesCollection.countDocuments(query);
      console.log('[Search] Count query OK, total:', total);
      
      if (total === 0 && Object.keys(query).length === 0) {
        console.warn('[Search] WARNING: No properties found with empty query! Checking database...');
        const allProps = await propertiesCollection.find({}).limit(5).toArray();
        console.log('[Search] Sample properties in DB:', allProps.length);
        allProps.forEach(p => {
          console.log(`  - ${p.name} (ID: ${p._id}, owner_id: ${p.owner_id})`);
        });
      }

      // Fetch properties
      const properties = await propertiesCollection
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      console.log('[Search] List query OK, rows:', properties.length);
      if (properties.length > 0) {
        console.log('[Search] First property:', properties[0].name, 'ID:', properties[0]._id);
      }

      // Fetch owner names and photos
      if (properties.length > 0) {
        try {
          const propertyIds = properties.map(p => p._id);
          const ownerIds = [...new Set(properties.map(p => p.owner_id).filter(Boolean))];

          // Fetch owners - handle both ObjectId and string IDs
          const ownerObjectIds = ownerIds.map(id => {
            try {
              return typeof id === 'string' ? new ObjectId(id) : id;
            } catch {
              return id;
            }
          }).filter(Boolean);
          
          const owners = await ownersCollection.find({ 
            _id: { $in: ownerObjectIds.length > 0 ? ownerObjectIds : ownerIds } 
          }).toArray();
          const ownerMap = {};
          owners.forEach(o => { 
            const ownerIdStr = o._id.toString();
            ownerMap[ownerIdStr] = o.name;
            // Also map the original owner_id format for compatibility
            if (o._id) {
              ownerMap[o._id] = o.name;
            }
          });

          // Fetch photos
          const photos = await propertyPhotosCollection
            .find({ property_id: { $in: propertyIds } })
            .sort({ created_at: -1 })
            .toArray();
          
          const photoMap = {};
          photos.forEach(p => {
            const propId = p.property_id.toString();
            if (!photoMap[propId]) photoMap[propId] = [];
            photoMap[propId].push(p.file_path);
          });

          // Attach to properties
          properties.forEach(p => {
            // Handle owner_id lookup - try multiple formats
            const ownerId = p.owner_id;
            let ownerName = null;
            if (ownerId) {
              // Try different formats
              const ownerIdStr = typeof ownerId === 'object' && ownerId.toString ? ownerId.toString() : String(ownerId);
              ownerName = ownerMap[ownerId] || ownerMap[ownerIdStr] || ownerMap[new ObjectId(ownerIdStr).toString()] || null;
              
              if (!ownerName && ownerId) {
                console.warn('[Search] Owner not found for property', p.name, 'owner_id:', ownerId, 'type:', typeof ownerId);
              }
            }
            p.owner_name = ownerName;
            
            // Handle photo lookup
            const propIdStr = p._id.toString();
            const propPhotos = photoMap[propIdStr] || [];
            const firstPhoto = propPhotos[0];
            p.main_photo = firstPhoto || PLACEHOLDER_PHOTO_PATH;
            p.images = propPhotos.length > 0 ? propPhotos : [PLACEHOLDER_PHOTO_PATH];
          });
        } catch (joinErr) {
          console.error('[Search] Failed to fetch owners/photos, continuing without:', joinErr.message);
          properties.forEach(p => {
            p.owner_name = null;
            p.main_photo = PLACEHOLDER_PHOTO_PATH;
            p.images = [PLACEHOLDER_PHOTO_PATH];
          });
        }
      }

      const formattedProperties = properties.map((p) => {
        const out = {
          id: p._id.toString(),
          owner_id: p.owner_id ? (typeof p.owner_id === 'object' ? p.owner_id.toString() : p.owner_id) : null,
          name: p.name,
          description: p.description,
          location: p.location,
          city: p.city,
          state: p.state,
          country: p.country,
          price_per_night: p.price_per_night,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          max_guests: p.max_guests,
          property_type: p.property_type,
          amenities: Array.isArray(p.amenities) ? p.amenities : (p.amenities ? (() => { try { return typeof p.amenities === 'string' ? JSON.parse(p.amenities) : []; } catch { return []; } })() : []),
          owner_name: p.owner_name || null,
          main_photo: p.main_photo || PLACEHOLDER_PHOTO_PATH,
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [PLACEHOLDER_PHOTO_PATH]
        };
        return out;
      });

      return res.json({
        properties: formattedProperties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      console.error('[Search] FATAL ERROR:', err?.message || err);
      console.error('[Search] Stack:', err?.stack);
      console.error('[Search] Full error object:', err);
      return res.status(500).json({ error: 'Internal server error', details: err?.message });
    }
  } catch (err) {
    console.error('[Search] FATAL ERROR:', err?.message || err);
    console.error('[Search] Stack:', err?.stack);
    console.error('[Search] Full error object:', err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    let propertyId;
    try {
      propertyId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid property ID' });
    }

    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const ownersCollection = db.collection('owners');
    const propertyPhotosCollection = db.collection('property_photos');

    const property = await propertiesCollection.findOne({ _id: propertyId });
    if (!property) return res.status(404).json({ error: 'Property not found' });

    // Get owner info
    const owner = property.owner_id ? await ownersCollection.findOne({ _id: property.owner_id }) : null;

    // Get property photos
    const photos = await propertyPhotosCollection
      .find({ property_id: propertyId })
      .sort({ created_at: 1 })
      .toArray();

    const formattedPhotos = photos.map(p => ({ id: p._id.toString(), file_path: p.file_path }));
    const imageList = formattedPhotos.map(p => p.file_path);
    if (imageList.length === 0) {
      imageList.push(PLACEHOLDER_PHOTO_PATH);
    }

    const formattedProperty = {
      id: property._id.toString(),
      owner_id: property.owner_id ? (typeof property.owner_id === 'object' ? property.owner_id.toString() : property.owner_id) : null,
      name: property.name,
      description: property.description,
      location: property.location,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      price_per_night: property.price_per_night,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      max_guests: property.max_guests,
      property_type: property.property_type,
      amenities: Array.isArray(property.amenities) ? property.amenities : (property.amenities ? (() => { try { return typeof property.amenities === 'string' ? JSON.parse(property.amenities) : []; } catch { return []; } })() : []),
      owner_name: owner?.name || null,
      owner_email: owner?.email || null,
      photos: formattedPhotos,
      images: imageList
    };

    return res.json({ property: formattedProperty });
  } catch (err) {
    console.error('Get property details error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/availability', async (req, res) => {
  try {
    let propertyId;
    try {
      propertyId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid property ID' });
    }

    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in and check_out dates are required' });
    }

    const db = await getDB();
    const bookingsCollection = db.collection('bookings');

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    const conflicts = await bookingsCollection.find({
      property_id: propertyId,
      status: 'ACCEPTED',
      $or: [
        { start_date: { $lte: checkOutDate }, end_date: { $gt: checkInDate } },
        { start_date: { $lt: checkOutDate }, end_date: { $gte: checkInDate } },
        { start_date: { $gte: checkInDate }, end_date: { $lte: checkOutDate } }
      ]
    }).toArray();

    const formattedConflicts = conflicts.map(c => ({
      id: c._id.toString(),
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status
    }));

    return res.json({
      available: conflicts.length === 0,
      conflicts: formattedConflicts
    });
  } catch (err) {
    console.error('Check availability error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
