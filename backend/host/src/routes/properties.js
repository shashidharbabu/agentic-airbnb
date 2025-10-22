const express = require('express');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');
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
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    description: row.description,
    location: row.location,
    address: row.address,
    price_per_night: numberOrNull(row.price_per_night),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    amenities: toArray(row.amenities),
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
    highlights: toArray(row.highlights),
    safety: toArray(row.safety),
    weekend_premium_percent: numberOrNull(row.weekend_premium_percent),
    discounts: parseDiscounts(row.discounts),
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
  property_type: Joi.string().max(50).optional(),
  privacy_type: Joi.string().valid('Entire place','Room','Shared').optional(),
  max_guests: Joi.number().integer().min(0).optional(),
  beds: Joi.number().integer().min(0).optional(),
  latitude: Joi.number().precision(8).optional(),
  longitude: Joi.number().precision(8).optional(),
  street: Joi.string().max(255).allow('', null).optional(),
  unit: Joi.string().max(100).allow('', null).optional(),
  city: Joi.string().max(120).allow('', null).optional(),
  state: Joi.string().max(80).allow('', null).optional(),
  zip: Joi.string().max(20).allow('', null).optional(),
  country: Joi.string().max(80).allow('', null).optional(),
  highlights: Joi.array().items(Joi.string()).optional(),
  safety: Joi.array().items(Joi.string()).optional(),
  weekend_premium_percent: Joi.number().precision(2).min(0).max(99.99).optional(),
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
    const conn = await pool.getConnection();
    try {
      const amenities = sanitizeStringArray(value.amenities);
      const highlights = sanitizeStringArray(value.highlights);
      const safety = sanitizeStringArray(value.safety);
      const discounts = sanitizeDiscounts(value.discounts);

      const [result] = await conn.execute(
        `INSERT INTO properties 
         (owner_id, name, description, location, address, price_per_night, bedrooms, bathrooms, amenities,
          property_type, privacy_type, max_guests, beds, latitude, longitude, street, unit, city, state, zip, country,
          highlights, safety, weekend_premium_percent, discounts, average_rating, reviews_count, views_last_90d, booking_mode,
          availability_start, availability_end)
         VALUES (:owner_id, :name, :description, :location, :address, :price_per_night, :bedrooms, :bathrooms, :amenities,
          :property_type, :privacy_type, :max_guests, :beds, :latitude, :longitude, :street, :unit, :city, :state, :zip, :country,
          :highlights, :safety, :weekend_premium_percent, :discounts, :average_rating, :reviews_count, :views_last_90d, :booking_mode,
          :availability_start, :availability_end)`,
        {
          owner_id: ownerId,
          name: value.name,
          description: value.description || null,
          location: value.location,
          address: value.address || null,
          price_per_night: value.price_per_night,
          bedrooms: value.bedrooms,
          bathrooms: value.bathrooms,
          amenities: JSON.stringify(amenities),
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
          highlights: JSON.stringify(highlights),
          safety: JSON.stringify(safety),
          weekend_premium_percent: value.weekend_premium_percent || 0,
          discounts: JSON.stringify(discounts),
          average_rating: numberOrNull(value.average_rating),
          reviews_count: value.reviews_count || 0,
          views_last_90d: value.views_last_90d || 0,
          booking_mode: value.booking_mode || 'APPROVAL',
          availability_start: value.availability_start || null,
          availability_end: value.availability_end || null
        }
      );
      return res.json({ id: result.insertId });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/mine', ensureAuth, async (req, res) => {
  try {
    const ownerId = req.session.owner.id;
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT p.*,
                (SELECT file_path FROM property_photos WHERE property_id = p.id ORDER BY id ASC LIMIT 1) AS cover_photo_path
           FROM properties p
          WHERE p.owner_id = :owner_id
          ORDER BY p.created_at DESC`,
        { owner_id: ownerId }
      );

      const properties = rows.map((row) => formatProperty(row));

      return res.json({ properties });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const conn = await pool.getConnection();
    try {
  const [props] = await conn.execute('SELECT * FROM properties WHERE id = :id', { id });
      if (props.length === 0) return res.status(404).json({ error: 'not_found' });
      const [photos] = await conn.execute('SELECT id, file_path, created_at FROM property_photos WHERE property_id = :id ORDER BY id DESC', { id });
  const coverPhotoPath = photos[0]?.file_path || null;
  return res.json({ property: formatProperty(props[0], { coverPhotoPath }), photos });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const id = parseInt(req.params.id, 10);
    const ownerId = req.session.owner.id;

    const conn = await pool.getConnection();
    try {
      const [own] = await conn.execute('SELECT owner_id FROM properties WHERE id = :id', { id });
      if (own.length === 0) return res.status(404).json({ error: 'not_found' });
      if (own[0].owner_id !== ownerId) return res.status(403).json({ error: 'forbidden' });

      const updates = {};
      const fields = [
        'name','description','location','address','price_per_night','bedrooms','bathrooms','amenities',
        'property_type','privacy_type','max_guests','beds','latitude','longitude','street','unit','city','state','zip','country',
        'highlights','safety','weekend_premium_percent','discounts','booking_mode',
        'availability_start','availability_end'
      ];
      for (const f of fields) if (Object.prototype.hasOwnProperty.call(value, f)) updates[f] = value[f];
      if (Object.prototype.hasOwnProperty.call(updates, 'amenities')) updates.amenities = JSON.stringify(sanitizeStringArray(updates.amenities));
      if (Object.prototype.hasOwnProperty.call(updates, 'highlights')) updates.highlights = JSON.stringify(sanitizeStringArray(updates.highlights));
      if (Object.prototype.hasOwnProperty.call(updates, 'safety')) updates.safety = JSON.stringify(sanitizeStringArray(updates.safety));
      if (Object.prototype.hasOwnProperty.call(updates, 'discounts')) updates.discounts = JSON.stringify(sanitizeDiscounts(updates.discounts));
      if (Object.keys(updates).length === 0) {
        const [rows] = await conn.execute('SELECT * FROM properties WHERE id = :id', { id });
        const [photos] = await conn.execute('SELECT id, file_path, created_at FROM property_photos WHERE property_id = :id ORDER BY id DESC', { id });
        const coverPhotoPath = photos[0]?.file_path || null;
        return res.json({ property: formatProperty(rows[0], { coverPhotoPath }) });
      }

      const setClause = Object.keys(updates).map(k => `${k} = :${k}`).join(', ');
      await conn.execute(`UPDATE properties SET ${setClause} WHERE id = :id`, { ...updates, id });
      const [rows] = await conn.execute('SELECT * FROM properties WHERE id = :id', { id });
      const [photos] = await conn.execute('SELECT id, file_path, created_at FROM property_photos WHERE property_id = :id ORDER BY id DESC', { id });
      const coverPhotoPath = photos[0]?.file_path || null;
      return res.json({ property: formatProperty(rows[0], { coverPhotoPath }) });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.post('/:id/photos', ensureAuth, upload.array('photos', 10), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ownerId = req.session.owner.id;

    const conn = await pool.getConnection();
    try {
      const [own] = await conn.execute('SELECT owner_id FROM properties WHERE id = :id', { id });
      if (own.length === 0) return res.status(404).json({ error: 'not_found' });
      if (own[0].owner_id !== ownerId) return res.status(403).json({ error: 'forbidden' });

      const files = req.files || [];
      const relBase = '/uploads/property-photos';
      for (const f of files) {
        const relPath = path.posix.join(relBase, path.basename(f.path));
        await conn.execute('INSERT INTO property_photos (property_id, file_path) VALUES (:pid, :file)', { pid: id, file: relPath });
      }
      const [photos] = await conn.execute('SELECT id, file_path, created_at FROM property_photos WHERE property_id = :id ORDER BY id DESC', { id });
      return res.json({ photos });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.delete('/:id/photos/:photoId', ensureAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const photoId = parseInt(req.params.photoId, 10);
    const ownerId = req.session.owner.id;

    const conn = await pool.getConnection();
    try {
      const [own] = await conn.execute('SELECT owner_id FROM properties WHERE id = :id', { id });
      if (own.length === 0) return res.status(404).json({ error: 'not_found' });
      if (own[0].owner_id !== ownerId) return res.status(403).json({ error: 'forbidden' });

      const [rows] = await conn.execute('SELECT file_path FROM property_photos WHERE id = :photoId AND property_id = :id', { photoId, id });
      if (rows.length === 0) return res.status(404).json({ error: 'photo_not_found' });
      const filePath = rows[0].file_path;

      await conn.execute('DELETE FROM property_photos WHERE id = :photoId AND property_id = :id', { photoId, id });

      // best-effort delete file from disk
      try {
        const absPath = path.join(__dirname, '..', '..', filePath);
        fs.unlink(absPath, () => {});
      } catch {}

      return res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
