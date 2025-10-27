const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

console.log('🚀 PROPERTIES ROUTE FILE LOADED - VERSION 2.0');

const router = express.Router();

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

    const offset = (page - 1) * limit;

    console.log('[Search] Query params:', { location, check_in, check_out, guests, property_type, min_price, max_price, page, limit });
    
    console.log('[Search] Attempting DB connection...');
    const conn = await pool.getConnection();
    console.log('[Search] DB connection acquired');
    try {
      const where = [];
      const params = [];

      // Helper to check if value is meaningful (not empty/null/undefined)
      const hasValue = (val) => val !== undefined && val !== null && val !== '';

      if (hasValue(location)) {
        // Match against multiple fields to emulate Airbnb-style search
        where.push('(p.location LIKE ? OR p.city LIKE ? OR p.state LIKE ? OR p.country LIKE ? OR p.name LIKE ?)');
        const like = `%${location}%`;
        params.push(like, like, like, like, like);
      }

      if (guests && guests > 0) {
        where.push('p.max_guests >= ?');
        params.push(guests);
      }

      if (hasValue(property_type)) {
        where.push('p.property_type = ?');
        params.push(property_type);
      }

      if (typeof min_price === 'number' && min_price >= 0) {
        where.push('p.price_per_night >= ?');
        params.push(min_price);
      }

      if (typeof max_price === 'number' && max_price >= 0) {
        where.push('p.price_per_night <= ?');
        params.push(max_price);
      }

      // Only add date availability check if BOTH dates are provided and valid
      if (hasValue(check_in) && hasValue(check_out)) {
        where.push(`
          p.id NOT IN (
            SELECT DISTINCT b.property_id
            FROM bookings b
            WHERE b.status = 'ACCEPTED'
              AND (
                (b.start_date <= ? AND b.end_date > ?) OR
                (b.start_date < ? AND b.end_date >= ?) OR
                (b.start_date >= ? AND b.end_date <= ?)
              )
          )
        `);
        params.push(check_out, check_in, check_out, check_in, check_in, check_out);
      }

      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

      console.log('[Search] WHERE conditions:', where.length);
      console.log('[Search] Base params count:', params.length);
      console.log('[Search] Params values:', params);
      
      const countSql = `
        SELECT COUNT(*) AS total
        FROM properties p
        ${whereClause}
      `;
      console.log('[Search] Executing count query...');
      const [countRows] = await conn.query(countSql, params);
      const total = countRows[0]?.total ?? 0;
      console.log('[Search] Count query OK, total:', total);

      // Simplified query - fetch properties first, then join data separately
      const listSql = `
        SELECT
          p.id,
          p.owner_id,
          p.name,
          p.description,
          p.location,
          p.city,
          p.state,
          p.country,
          p.price_per_night,
          p.bedrooms,
          p.bathrooms,
          p.max_guests,
          p.property_type,
          p.amenities
        FROM properties p
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      console.log('[Search] Executing list query, limit:', limit, 'offset:', offset);
      const listParams = [...params, limit, offset];
      console.log('[Search] List params count:', listParams.length);
      console.log('[Search] List params:', listParams);
      console.log('[Search] SQL query:', listSql.replace(/\s+/g, ' ').substring(0, 200) + '...');
      
      let rows;
      // Use query instead of execute for better compatibility
      [rows] = await conn.query(listSql, listParams);
      console.log('[Search] List query OK, rows:', rows.length);
      
      // Fetch owner names and photos separately (more reliable than joins/subqueries)
      if (rows.length > 0) {
        try {
          const propertyIds = rows.map(r => r.id);
          const ownerIds = [...new Set(rows.map(r => r.owner_id).filter(Boolean))];
          
          // Fetch owners
          let ownerMap = {};
          if (ownerIds.length > 0) {
            const placeholders = ownerIds.map(() => '?').join(',');
            const [ownerRows] = await conn.query(
              `SELECT id, name FROM owners WHERE id IN (${placeholders})`,
              ownerIds
            );
            ownerRows.forEach(o => { ownerMap[o.id] = o.name; });
          }
          
          // Fetch photos
          let photoMap = {};
          const photoPlaceholders = propertyIds.map(() => '?').join(',');
          const [photoRows] = await conn.query(
            `SELECT property_id, file_path FROM property_photos WHERE property_id IN (${photoPlaceholders}) ORDER BY id`,
            propertyIds
          );
          photoRows.forEach(p => {
            if (!photoMap[p.property_id]) photoMap[p.property_id] = [];
            photoMap[p.property_id].push(p.file_path);
          });
          
          // Attach to rows
          rows.forEach(r => {
            r.owner_name = ownerMap[r.owner_id] || null;
            r.main_photo = photoMap[r.id]?.[0] || null;
          });
        } catch (joinErr) {
          console.error('[Search] Failed to fetch owners/photos, continuing without:', joinErr.message);
          rows.forEach(r => {
            r.owner_name = null;
            r.main_photo = null;
          });
        }
      }
      

      const properties = rows.map((p) => {
        const out = { ...p };

        // Parse amenities JSON if it's a string
        if (out.amenities && typeof out.amenities === 'string') {
          try { out.amenities = JSON.parse(out.amenities); } catch { out.amenities = []; }
        } else if (!out.amenities) {
          out.amenities = [];
        }

        // Get all photos for this property
        out.images = out.main_photo ? [out.main_photo] : [];

        return out;
      });

      return res.json({
        properties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } finally {
      conn.release();
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
    const propertyId = req.params.id;

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `
        SELECT
          p.*,
          o.name AS owner_name,
          o.email AS owner_email
        FROM properties p
        LEFT JOIN owners o ON o.id = p.owner_id
        WHERE p.id = ?
        `,
        [propertyId]
      );

      if (!rows.length) return res.status(404).json({ error: 'Property not found' });

      const property = rows[0];

      // Parse amenities JSON if it's a string
      if (property.amenities && typeof property.amenities === 'string') {
        try { property.amenities = JSON.parse(property.amenities); } catch { property.amenities = []; }
      } else if (!property.amenities) {
        property.amenities = [];
      }

      // Get property photos
      const [photoRows] = await conn.execute(
        'SELECT id, file_path FROM property_photos WHERE property_id = ? ORDER BY id',
        [propertyId]
      );

      property.photos = photoRows;
      property.images = photoRows.map(photo => photo.file_path);

      return res.json({ property });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Get property details error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/availability', async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in and check_out dates are required' });
    }

    const conn = await pool.getConnection();
    try {
      const [conflicts] = await conn.execute(
        `
        SELECT id, start_date, end_date, status
        FROM bookings
        WHERE property_id = ?
          AND status = 'ACCEPTED'
          AND (
            (start_date <= ? AND end_date > ?) OR
            (start_date < ? AND end_date >= ?) OR
            (start_date >= ? AND end_date <= ?)
          )
        `,
        [propertyId, check_out, check_in, check_out, check_in, check_in, check_out]
      );

      return res.json({
        available: conflicts.length === 0,
        conflicts
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Check availability error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
