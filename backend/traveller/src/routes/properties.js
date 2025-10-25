const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const searchSchema = Joi.object({
  location: Joi.string().min(1).max(255).optional(),
  check_in: Joi.date().iso().optional(),
  check_out: Joi.date().iso().optional(),
  guests: Joi.number().integer().min(1).max(20).optional(),
  property_type: Joi.string().optional(),          
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});


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

    const conn = await pool.getConnection();
    try {
      const where = ['p.active = 1'];
      const params = [];

      if (location) {
        where.push('p.location LIKE ?');
        params.push(`%${location}%`);
      }

      if (guests) {
        where.push('p.max_guests >= ?');
        params.push(guests);
      }

      if (property_type) {
        where.push('p.type = ?');
        params.push(property_type);
      }

      if (min_price !== undefined) {
        where.push('p.price >= ?');
        params.push(min_price);
      }

      if (max_price !== undefined) {
        where.push('p.price <= ?');
        params.push(max_price);
      }

      if (check_in && check_out) {
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

      const countSql = `
        SELECT COUNT(*) AS total
        FROM properties p
        ${whereClause}
      `;
      const [countRows] = await conn.execute(countSql, params);
      const total = countRows[0]?.total ?? 0;

      const listSql = `
        SELECT
          p.id,
          p.name,
          p.description,
          p.location,
          p.price,                        
          p.bedrooms,
          p.bathrooms,
          p.max_guests,
          p.type AS property_type,        
          p.amenities_json AS amenities,
          p.images_json AS images,
          u.name AS owner_name,
          JSON_EXTRACT(p.images_json, '$[0]') AS main_photo
        FROM properties p
        LEFT JOIN users u
          ON u.id = p.owner_id AND u.role = 'HOST'
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await conn.execute(listSql, [...params, Number(limit), Number(offset)]);

      const properties = rows.map((p) => {
        const out = { ...p };

        out.price_per_night = Number(out.price);
        delete out.price;

        if (out.amenities) {
          try { out.amenities = JSON.parse(out.amenities); } catch { out.amenities = []; }
        }
        if (out.images) {
          try { out.images = JSON.parse(out.images); } catch { out.images = []; }
        }

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
    console.error('Search properties error:', err);
    return res.status(500).json({ error: 'Internal server error' });
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
          u.name  AS owner_name,
          u.email AS owner_email
        FROM properties p
        LEFT JOIN users u
          ON u.id = p.owner_id AND u.role = 'HOST'
        WHERE p.id = ?
        `,
        [propertyId]
      );

      if (!rows.length) return res.status(404).json({ error: 'Property not found' });

      const property = rows[0];

      if (property.amenities_json) {
        try { property.amenities = JSON.parse(property.amenities_json); } catch { property.amenities = []; }
      } else {
        property.amenities = [];
      }

      if (property.images_json) {
        try { property.images = JSON.parse(property.images_json); } catch { property.images = []; }
      } else {
        property.images = [];
      }

      property.property_type = property.type;
      property.price_per_night = Number(property.price);

      property.photos = property.images.map((url, i) => ({ id: i + 1, file_path: url }));

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
