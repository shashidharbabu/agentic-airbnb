const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database');
const { ensureAuth } = require('../middleware/auth');

const router = express.Router();

const createBookingSchema = Joi.object({
  property_id: Joi.number().integer().positive().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
  guests: Joi.number().integer().min(1).max(20).required(),
  special_requests: Joi.string().max(1000).optional().allow('')
});

const dateDiffNights = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e - s;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

router.post('/', ensureAuth, async (req, res) => {
  try {
    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const travelerId = req.session.traveler.id;
    const { property_id, start_date, end_date, guests, special_requests } = value;

    const nights = dateDiffNights(start_date, end_date);
    if (nights < 1) {
      return res.status(400).json({ error: 'Stay must be at least 1 night' });
    }

    const conn = await pool.getConnection();
    try {
      const [propertyRows] = await conn.execute(
        `
        SELECT id, name, price AS price_per_night, max_guests
        FROM properties
        WHERE id = ? AND active = 1
        `,
        [property_id]
      );

      if (propertyRows.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const property = propertyRows[0];

      if (guests > property.max_guests) {
        return res.status(400).json({
          error: `Maximum ${property.max_guests} guests allowed for this property`
        });
      }

      const [conflicts] = await conn.execute(
        `
        SELECT id
        FROM bookings
        WHERE property_id = ?
          AND status = 'ACCEPTED'
          AND (
            (start_date <= ? AND end_date > ?) OR
            (start_date < ? AND end_date >= ?) OR
            (start_date >= ? AND end_date <= ?)
          )
        `,
        [property_id, end_date, start_date, end_date, start_date, start_date, end_date]
      );

      if (conflicts.length > 0) {
        return res.status(409).json({ error: 'Property not available for selected dates' });
      }

      const totalPrice = property.price_per_night * nights;

      const [result] = await conn.execute(
        `
        INSERT INTO bookings (
          property_id, traveler_id, start_date, end_date, guests, total_price, status, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
        `,
        [
          property_id,
          travelerId,
          start_date,
          end_date,
          guests,
          totalPrice,
          special_requests || ''
        ]
      );

      const bookingId = result.insertId;

      const [bookingRows] = await conn.execute(
        `
        SELECT 
          b.*,
          p.name AS property_name,
          p.location AS property_location,
          p.price AS price_per_night,
          u.name AS owner_name,
          JSON_EXTRACT(p.images_json, '$[0]') AS property_photo
        FROM bookings b
        LEFT JOIN properties p ON b.property_id = p.id
        LEFT JOIN users u ON p.owner_id = u.id AND u.role = 'HOST'
        WHERE b.id = ?
        `,
        [bookingId]
      );

      return res.status(201).json({
        message: 'Booking created successfully',
        booking: bookingRows[0]
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/traveler/:id', ensureAuth, async (req, res) => {
  try {
    const travelerId = Number(req.params.id);
    const requestingTravelerId = req.session.traveler.id;

    if (travelerId !== requestingTravelerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status } = req.query;

    const conn = await pool.getConnection();
    try {
      let whereClause = 'WHERE b.traveler_id = ?';
      const params = [travelerId];

      if (status) {
        whereClause += ' AND b.status = ?';
        params.push(status);
      }

      const [bookings] = await conn.execute(
        `
        SELECT 
          b.*,
          p.name AS property_name,
          p.location AS property_location,
          p.price AS price_per_night,
          p.bedrooms,
          p.bathrooms,
          p.type AS property_type,
          u.name AS owner_name,
          JSON_EXTRACT(p.images_json, '$[0]') AS property_photo
        FROM bookings b
        LEFT JOIN properties p ON b.property_id = p.id
        LEFT JOIN users u ON p.owner_id = u.id AND u.role = 'HOST'
        ${whereClause}
        ORDER BY b.created_at DESC
        `,
        params
      );

      return res.json({ bookings });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Get traveler bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', ensureAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const travelerId = req.session.traveler.id;

    const conn = await pool.getConnection();
    try {
      const [bookings] = await conn.execute(
        `
        SELECT 
          b.*,
          p.name AS property_name,
          p.description AS property_description,
          p.location AS property_location,
          p.price AS price_per_night,
          p.bedrooms,
          p.bathrooms,
          p.type AS property_type,
          p.amenities_json AS amenities,
          u.name AS owner_name,
          u.email AS owner_email,
          JSON_EXTRACT(p.images_json, '$[0]') AS property_photo
        FROM bookings b
        LEFT JOIN properties p ON b.property_id = p.id
        LEFT JOIN users u ON p.owner_id = u.id AND u.role = 'HOST'
        WHERE b.id = ? AND b.traveler_id = ?
        `,
        [bookingId, travelerId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookings[0];

      if (booking.amenities) {
        try {
          booking.amenities = JSON.parse(booking.amenities);
        } catch {
          booking.amenities = [];
        }
      }

      return res.json({ booking });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Get booking details error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/:id/cancel', ensureAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const travelerId = req.session.traveler.id;

    const conn = await pool.getConnection();
    try {
      const [bookings] = await conn.execute(
        `
        SELECT id, status, start_date
        FROM bookings
        WHERE id = ? AND traveler_id = ?
        `,
        [bookingId, travelerId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookings[0];

      if (booking.status === 'CANCELLED') {
        return res.status(400).json({ error: 'Booking is already cancelled' });
      }

      if (booking.status === 'ACCEPTED') {
        const startDate = new Date(booking.start_date);
        const now = new Date();
        const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntilStart < 1) {
          return res.status(400).json({
            error: 'Cannot cancel booking less than 24 hours before check-in'
          });
        }
      }

      await conn.execute(
        `
        UPDATE bookings
        SET status = 'CANCELLED', status_updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [bookingId]
      );

      return res.json({
        message: 'Booking cancelled successfully',
        booking_id: bookingId
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
