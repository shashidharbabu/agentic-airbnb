const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database');
const { ensureAuth } = require('../middleware/auth');

const router = express.Router();

const addFavoriteSchema = Joi.object({
  property_id: Joi.number().integer().positive().required()
});

router.post('/', ensureAuth, async (req, res) => {
  try {
    const { error, value } = addFavoriteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const travelerId = req.session.traveler.id;
    const { property_id } = value;

    const conn = await pool.getConnection();
    try {
      const [propertyRows] = await conn.execute(
        'SELECT id, name FROM properties WHERE id = ? AND active = 1',
        [property_id]
      );

      if (propertyRows.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const [existingFavorites] = await conn.execute(
        'SELECT id FROM favorites WHERE traveler_id = ? AND property_id = ?',
        [travelerId, property_id]
      );

      if (existingFavorites.length > 0) {
        return res.status(409).json({ error: 'Property already in favorites' });
      }

      await conn.execute(
        'INSERT INTO favorites (traveler_id, property_id) VALUES (?, ?)',
        [travelerId, property_id]
      );

      return res.status(201).json({
        message: 'Property added to favorites successfully',
        property_id: property_id
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:propertyId', ensureAuth, async (req, res) => {
  try {
    const travelerId = req.session.traveler.id;
    const propertyId = req.params.propertyId;

    const conn = await pool.getConnection();
    try {
      const [existingFavorites] = await conn.execute(
        'SELECT id FROM favorites WHERE traveler_id = ? AND property_id = ?',
        [travelerId, propertyId]
      );

      if (existingFavorites.length === 0) {
        return res.status(404).json({ error: 'Property not in favorites' });
      }

      await conn.execute(
        'DELETE FROM favorites WHERE traveler_id = ? AND property_id = ?',
        [travelerId, propertyId]
      );

      return res.json({
        message: 'Property removed from favorites successfully',
        property_id: propertyId
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/traveler/:id', ensureAuth, async (req, res) => {
  try {
    const travelerId = req.params.id;
    const requestingTravelerId = req.session.traveler.id;

    if (parseInt(travelerId) !== requestingTravelerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const conn = await pool.getConnection();
    try {
      const [countResult] = await conn.execute(
        'SELECT COUNT(*) as total FROM favorites WHERE traveler_id = ?',
        [travelerId]
      );
      const total = countResult[0].total;

      const [favorites] = await conn.execute(`
        SELECT 
          f.id as favorite_id,
          f.created_at as favorited_at,
          p.id as property_id,
          p.name as property_name,
          p.description,
          p.location,
          p.price as price_per_night,
          p.bedrooms,
          p.bathrooms,
          p.max_guests,
          p.type as property_type,
          p.amenities_json as amenities,
          u.name as owner_name,
          JSON_EXTRACT(p.images_json, '$[0]') as main_photo
        FROM favorites f
        LEFT JOIN properties p ON f.property_id = p.id
        LEFT JOIN users u ON p.owner_id = u.id AND u.role = 'HOST'
        WHERE f.traveler_id = ?
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
      `, [travelerId, parseInt(limit), offset]);

      const processedFavorites = favorites.map(favorite => {
        if (favorite.amenities) {
          try {
            favorite.amenities = JSON.parse(favorite.amenities);
          } catch (e) {
            favorite.amenities = [];
          }
        }
        return favorite;
      });

      return res.json({
        favorites: processedFavorites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/check/:propertyId', ensureAuth, async (req, res) => {
  try {
    const travelerId = req.session.traveler.id;
    const propertyId = req.params.propertyId;

    const conn = await pool.getConnection();
    try {
      const [favorites] = await conn.execute(
        'SELECT id FROM favorites WHERE traveler_id = ? AND property_id = ?',
        [travelerId, propertyId]
      );

      return res.json({
        is_favorited: favorites.length > 0
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Check favorite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
