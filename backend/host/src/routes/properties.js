const express = require('express');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db-mongodb');
const { ensureAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

const parseJSONField = (value, fallback) => {
  if (!value && value !== 0) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

const numberOrNull = (value) => (value === null || value === undefined ? null : Number(value));

const sanitizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item === null || item === undefined) return '';
      return String(item).trim();
    })
    .filter((item) => item.length > 0);
};

const sanitizeDiscounts = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  const weekly = Number(source.weekly);
  const monthly = Number(source.monthly);
  return {
    weekly: Number.isFinite(weekly) && weekly >= 0 ? weekly : 0,
    monthly: Number.isFinite(monthly) && monthly >= 0 ? monthly : 0
  };
};

const toArray = (value) => {
  const parsed = parseJSONField(value, []);
  if (Array.isArray(parsed)) return sanitizeStringArray(parsed);
  return [];
};

const parseDiscounts = (value) => sanitizeDiscounts(parseJSONField(value, {}));

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const computeStatus = (row) => {
  const now = new Date();
  const start = toDate(row.availability_start);
  const end = toDate(row.availability_end);
  if (end && end < now) return 'Inactive';
  if (start && start > now) return 'Snoozed';
  return 'Live';
};

const formatProperty = (row, extras = {}) => {
  if (!row) return null;

  const analytics = {
    average_rating: numberOrNull(row.average_rating),
    reviews_count: row.reviews_count !== null && row.reviews_count !== undefined ? Number(row.reviews_count) : 0,
    views_last_90d: row.views_last_90d !== null && row.views_last_90d !== undefined ? Number(row.views_last_90d) : 0
  };

  return {
    id: row._id ? row._id.toString() : row.id,
    owner_id: row.owner_id ? (typeof row.owner_id === 'object' ? row.owner_id.toString() : row.owner_id) : row.owner_id,
    name: row.name,
    description: row.description,
    location: row.location,
    address: row.address,
    price_per_night: numberOrNull(row.price_per_night),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    amenities: Array.isArray(row.amenities) ? row.amenities : toArray(row.amenities),
    property_type: row.property_type,
    privacy_type: row.privacy_type,
    max_guests: row.max_guests,
    beds: row.beds,
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    street: row.street,
    unit: row.unit,
    city: row.city,
    state: row.state,
    zip: row.zip,
    country: row.country,
    highlights: Array.isArray(row.highlights) ? row.highlights : toArray(row.highlights),
    safety: Array.isArray(row.safety) ? row.safety : toArray(row.safety),
    weekend_premium_percent: numberOrNull(row.weekend_premium_percent),
    discounts: typeof row.discounts === 'object' && !Array.isArray(row.discounts) ? row.discounts : parseDiscounts(row.discounts),
    booking_mode: row.booking_mode,
    availability_start: row.availability_start,
    availability_end: row.availability_end,
    created_at: row.created_at,
    status: computeStatus(row),
    cover_photo_path: extras.coverPhotoPath || row.cover_photo_path || null,
    analytics
  };
};

const createSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('', null).optional(),
  location: Joi.string().min(1).max(255).required(),
  address: Joi.string().allow('', null).max(500).optional(),
  price_per_night: Joi.number().precision(2).min(0).required(),
  bedrooms: Joi.number().integer().min(0).required(),
  bathrooms: Joi.number().integer().min(0).required(),
  amenities: Joi.array().items(Joi.string()).default([]),
  property_type: Joi.string().max(50).allow(null, ''),
  privacy_type: Joi.string().valid('Entire place','Room','Shared').allow(null),
  max_guests: Joi.number().integer().min(0).allow(null),
  beds: Joi.number().integer().min(0).allow(null),
  latitude: Joi.number().precision(8).allow(null),
  longitude: Joi.number().precision(8).allow(null),
  street: Joi.string().max(255).allow('', null),
  unit: Joi.string().max(100).allow('', null),
  city: Joi.string().max(120).allow('', null),
  state: Joi.string().max(80).allow('', null),
  zip: Joi.string().max(20).allow('', null),
  country: Joi.string().max(80).allow('', null),
  highlights: Joi.array().items(Joi.string()).default([]),
  safety: Joi.array().items(Joi.string()).default([]),
  weekend_premium_percent: Joi.number().precision(2).min(0).max(99.99).allow(null),
  discounts: Joi.object().unknown(true).default({}),
  booking_mode: Joi.string().valid('APPROVAL','INSTANT').default('APPROVAL'),
  availability_start: Joi.date().allow(null).optional(),
  availability_end: Joi.date().allow(null).optional()
});

const updateSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().allow('', null).optional(),
  location: Joi.string().min(1).max(255).optional(),
  address: Joi.string().allow('', null).max(500).optional(),
  price_per_night: Joi.number().precision(2).min(0).optional(),
  bedrooms: Joi.number().integer().min(0).optional(),
  bathrooms: Joi.number().integer().min(0).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  property_type: Joi.string().max(50).allow(null, '').optional(),
  privacy_type: Joi.string().valid('Entire place','Room','Shared').allow(null, '').optional(),
  max_guests: Joi.number().integer().min(0).allow(null).optional(),
  beds: Joi.number().integer().min(0).allow(null).optional(),
  latitude: Joi.number().precision(8).allow(null).optional(),
  longitude: Joi.number().precision(8).allow(null).optional(),
  street: Joi.string().max(255).allow('', null).optional(),
  unit: Joi.string().max(100).allow('', null).optional(),
  city: Joi.string().max(120).allow('', null).optional(),
  state: Joi.string().max(80).allow('', null).optional(),
  zip: Joi.string().max(20).allow('', null).optional(),
  country: Joi.string().max(80).allow('', null).optional(),
  highlights: Joi.array().items(Joi.string()).optional(),
  safety: Joi.array().items(Joi.string()).optional(),
  weekend_premium_percent: Joi.number().precision(2).min(0).max(99.99).allow(null).optional(),
  discounts: Joi.object().unknown(true).optional(),
  booking_mode: Joi.string().valid('APPROVAL','INSTANT').optional(),
  availability_start: Joi.date().allow(null).optional(),
  availability_end: Joi.date().allow(null).optional()
});

router.post('/', ensureAuth, async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const ownerId = req.session.owner.id;
    console.log('[Create Property] Owner ID from session:', ownerId);
    
    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    
    // Verify owner exists
    const ownersCollection = db.collection('owners');
    let ownerObjectId;
    try {
      ownerObjectId = new ObjectId(ownerId);
      const ownerExists = await ownersCollection.findOne({ _id: ownerObjectId });
      if (!ownerExists) {
        console.error('[Create Property] Owner not found:', ownerId);
        // Try to find owner by email as fallback
        const ownerByEmail = await ownersCollection.findOne({ email: req.session.owner.email });
        if (ownerByEmail) {
          console.log('[Create Property] Found owner by email, using correct ID:', ownerByEmail._id.toString());
          ownerObjectId = ownerByEmail._id;
        } else {
          return res.status(401).json({ error: 'owner_not_found' });
        }
      }
    } catch (idError) {
      console.error('[Create Property] Invalid owner ID:', ownerId, idError);
      return res.status(400).json({ error: 'invalid_owner_id' });
    }

    const amenities = sanitizeStringArray(value.amenities);
    const highlights = sanitizeStringArray(value.highlights);
    const safety = sanitizeStringArray(value.safety);
    const discounts = sanitizeDiscounts(value.discounts);

    const propertyDoc = {
      owner_id: ownerObjectId,
      name: value.name,
      description: value.description || null,
      location: value.location,
      address: value.address || null,
      price_per_night: value.price_per_night,
      bedrooms: value.bedrooms,
      bathrooms: value.bathrooms,
      amenities: amenities,
      property_type: value.property_type || null,
      privacy_type: value.privacy_type || null,
      max_guests: value.max_guests || null,
      beds: value.beds || null,
      latitude: value.latitude || null,
      longitude: value.longitude || null,
      street: value.street || null,
      unit: value.unit || null,
      city: value.city || null,
      state: value.state || null,
      zip: value.zip || null,
      country: value.country || null,
      highlights: highlights,
      safety: safety,
      weekend_premium_percent: value.weekend_premium_percent || 0,
      discounts: discounts,
      average_rating: numberOrNull(value.average_rating),
      reviews_count: value.reviews_count || 0,
      views_last_90d: value.views_last_90d || 0,
      booking_mode: value.booking_mode || 'APPROVAL',
      availability_start: value.availability_start || null,
      availability_end: value.availability_end || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log('[Create Property] Inserting property:', propertyDoc.name);
    const result = await propertiesCollection.insertOne(propertyDoc);
    console.log('[Create Property] ✅ Property inserted successfully, ID:', result.insertedId.toString());
    return res.json({ id: result.insertedId.toString() });
  } catch (e) {
    console.error('[Create Property] ❌ Error:', e);
    console.error('[Create Property] Stack:', e.stack);
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
});

router.get('/mine', ensureAuth, async (req, res) => {
  try {
    const ownerId = req.session.owner.id;
    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const propertyPhotosCollection = db.collection('property_photos');

    const properties = await propertiesCollection
      .find({ owner_id: new ObjectId(ownerId) })
      .sort({ created_at: -1 })
      .toArray();

    // Get cover photos for each property
    const propertiesWithPhotos = await Promise.all(
      properties.map(async (prop) => {
        const coverPhoto = await propertyPhotosCollection.findOne(
          { property_id: new ObjectId(prop._id), is_placeholder: { $ne: true } },
          { sort: { created_at: -1 } }
        );
        return formatProperty(prop, { coverPhotoPath: coverPhoto?.file_path || null });
      })
    );

    return res.json({ properties: propertiesWithPhotos });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'invalid_id' });
    }

    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const propertyPhotosCollection = db.collection('property_photos');

    const property = await propertiesCollection.findOne({ _id: id });
    if (!property) return res.status(404).json({ error: 'not_found' });

    const photos = await propertyPhotosCollection
      .find({ property_id: id, is_placeholder: { $ne: true } })
      .sort({ created_at: -1 })
      .toArray();

    const coverPhotoPath = photos[0]?.file_path || null;
    const formattedPhotos = photos.map(p => ({
      id: p._id.toString(),
      file_path: p.file_path,
      created_at: p.created_at
    }));

    return res.json({ property: formatProperty(property, { coverPhotoPath }), photos: formattedPhotos });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'invalid_id' });
    }
    const ownerId = req.session.owner.id;

    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const propertyPhotosCollection = db.collection('property_photos');

    const property = await propertiesCollection.findOne({ _id: id });
    if (!property) return res.status(404).json({ error: 'not_found' });
    if (property.owner_id.toString() !== ownerId) return res.status(403).json({ error: 'forbidden' });

    const updates = {};
    const fields = [
      'name','description','location','address','price_per_night','bedrooms','bathrooms','amenities',
      'property_type','privacy_type','max_guests','beds','latitude','longitude','street','unit','city','state','zip','country',
      'highlights','safety','weekend_premium_percent','discounts','booking_mode',
      'availability_start','availability_end'
    ];
    for (const f of fields) if (Object.prototype.hasOwnProperty.call(value, f)) updates[f] = value[f];
    
    if (Object.prototype.hasOwnProperty.call(updates, 'amenities')) updates.amenities = sanitizeStringArray(updates.amenities);
    if (Object.prototype.hasOwnProperty.call(updates, 'highlights')) updates.highlights = sanitizeStringArray(updates.highlights);
    if (Object.prototype.hasOwnProperty.call(updates, 'safety')) updates.safety = sanitizeStringArray(updates.safety);
    if (Object.prototype.hasOwnProperty.call(updates, 'discounts')) updates.discounts = sanitizeDiscounts(updates.discounts);
    
    if (Object.keys(updates).length === 0) {
      const photos = await propertyPhotosCollection
        .find({ property_id: id })
        .sort({ created_at: -1 })
        .toArray();
      const coverPhotoPath = photos[0]?.file_path || null;
      return res.json({ property: formatProperty(property, { coverPhotoPath }) });
    }

    updates.updated_at = new Date();
    await propertiesCollection.updateOne({ _id: id }, { $set: updates });
    
    const updatedProperty = await propertiesCollection.findOne({ _id: id });
    const photos = await propertyPhotosCollection
      .find({ property_id: id, is_placeholder: { $ne: true } })
      .sort({ created_at: -1 })
      .toArray();
    const coverPhotoPath = photos[0]?.file_path || null;
    return res.json({ property: formatProperty(updatedProperty, { coverPhotoPath }) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.post('/:id/photos', ensureAuth, upload.array('photos', 10), async (req, res) => {
  try {
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'invalid_id' });
    }
    const ownerId = req.session.owner.id;

    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const propertyPhotosCollection = db.collection('property_photos');

    const property = await propertiesCollection.findOne({ _id: id });
    if (!property) return res.status(404).json({ error: 'not_found' });
    if (property.owner_id.toString() !== ownerId) return res.status(403).json({ error: 'forbidden' });

    const files = req.files || [];
    const relBase = '/uploads/property-photos';
    for (const f of files) {
      const relPath = path.posix.join(relBase, path.basename(f.path));
      await propertyPhotosCollection.insertOne({
        property_id: id,
        file_path: relPath,
        created_at: new Date()
      });
    }
    const photos = await propertyPhotosCollection
      .find({ property_id: id, is_placeholder: { $ne: true } })
      .sort({ created_at: -1 })
      .toArray();
    
    const formattedPhotos = photos.map(p => ({
      id: p._id.toString(),
      file_path: p.file_path,
      created_at: p.created_at
    }));
    
    return res.json({ photos: formattedPhotos });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.delete('/:id/photos/:photoId', ensureAuth, async (req, res) => {
  try {
    let id, photoId;
    try {
      id = new ObjectId(req.params.id);
      photoId = new ObjectId(req.params.photoId);
    } catch {
      return res.status(400).json({ error: 'invalid_id' });
    }
    const ownerId = req.session.owner.id;

    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const propertyPhotosCollection = db.collection('property_photos');

    const property = await propertiesCollection.findOne({ _id: id });
    if (!property) return res.status(404).json({ error: 'not_found' });
    if (property.owner_id.toString() !== ownerId) return res.status(403).json({ error: 'forbidden' });

    const photo = await propertyPhotosCollection.findOne({ _id: photoId, property_id: id });
    if (!photo) return res.status(404).json({ error: 'photo_not_found' });
    const filePath = photo.file_path;

    await propertyPhotosCollection.deleteOne({ _id: photoId, property_id: id });

    // best-effort delete file from disk
    try {
      const absPath = path.join(__dirname, '..', '..', filePath);
      fs.unlink(absPath, () => {});
    } catch {}

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Delete entire property
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'invalid_id' });
    }
    const ownerId = req.session.owner.id;

    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const propertyPhotosCollection = db.collection('property_photos');
    const bookingsCollection = db.collection('bookings');

    // Check if property exists and belongs to the owner
    const property = await propertiesCollection.findOne({ _id: id });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (property.owner_id.toString() !== ownerId) {
      return res.status(403).json({ error: 'You do not have permission to delete this property' });
    }

    // Check for active bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeBookingsCount = await bookingsCollection.countDocuments({
      property_id: id,
      status: { $in: ['PENDING', 'ACCEPTED'] },
      end_date: { $gte: today }
    });

    if (activeBookingsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete property with active or upcoming bookings. Please cancel all bookings first.' 
      });
    }

    // Get all property photos for cleanup
    const photos = await propertyPhotosCollection
      .find({ property_id: id })
      .toArray();

    // Delete property photos from database
    await propertyPhotosCollection.deleteMany({ property_id: id });

    // Delete the property
    await propertiesCollection.deleteOne({ _id: id });

    // Best-effort delete photo files from disk
    for (const photo of photos) {
      try {
        const absPath = path.join(__dirname, '..', '..', photo.file_path);
        fs.unlink(absPath, () => {});
      } catch {}
    }

    return res.json({ 
      ok: true, 
      message: 'Property deleted successfully' 
    });
  } catch (e) {
    console.error('Error deleting property:', e);
    return res.status(500).json({ error: 'Failed to delete property. Please try again.' });
  }
});

module.exports = router;
