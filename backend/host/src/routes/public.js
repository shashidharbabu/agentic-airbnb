const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');

const router = express.Router();

// GET /public/properties?location=&start_date=&end_date=&guests=
router.get('/properties', async (req, res) => {
  try {
    const location = (req.query.location || '').toString();
    const conn = await pool.getConnection();
    try {
      let sql = 'SELECT id, owner_id, name, description, location, address, price_per_night, bedrooms, bathrooms, amenities, availability_start, availability_end, created_at FROM properties';
      const params = {};
      const wheres = [];
      if (location) { wheres.push('location LIKE :loc'); params.loc = `%${location}%`; }
      if (wheres.length) sql += ' WHERE ' + wheres.join(' AND ');
      sql += ' ORDER BY created_at DESC LIMIT 50';
      const [rows] = await conn.execute(sql, params);
      return res.json({ properties: rows });
    } finally { conn.release(); }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

const bookingSchema = Joi.object({
  property_id: Joi.number().integer().required(),
  traveler_name: Joi.string().min(1).max(255).required(),
  traveler_email: Joi.string().email().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  guests: Joi.number().integer().min(1).required()
});

// POST /public/bookings
router.post('/bookings', async (req, res) => {
  try {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const conn = await pool.getConnection();
    try {
      const [exists] = await conn.execute('SELECT id FROM properties WHERE id = :id', { id: value.property_id });
      if (exists.length === 0) return res.status(404).json({ error: 'property_not_found' });

      const [result] = await conn.execute(
        `INSERT INTO bookings (property_id, traveler_name, traveler_email, start_date, end_date, guests, status)
         VALUES (:pid, :name, :email, :start, :end, :guests, 'PENDING')`,
        {
          pid: value.property_id,
          name: value.traveler_name,
          email: value.traveler_email,
          start: value.start_date,
          end: value.end_date,
          guests: value.guests
        }
      );
      return res.json({ id: result.insertId });
    } finally { conn.release(); }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /public/bookings/:id
router.get('/bookings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT id, property_id, traveler_name, traveler_email, start_date, end_date, guests, status, created_at
           FROM bookings WHERE id = :id`,
        { id }
      );
      if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
      return res.json({ booking: rows[0] });
    } finally { conn.release(); }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
