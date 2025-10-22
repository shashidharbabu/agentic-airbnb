const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');
const { ensureAuth } = require('../middleware/auth');

const router = express.Router();

// GET /bookings/incoming?status=PENDING|ACCEPTED|CANCELLED
router.get('/incoming', ensureAuth, async (req, res) => {
  try {
    const ownerId = req.session.owner.id;
    const status = (req.query.status || 'PENDING').toString().toUpperCase();
    const allowed = ['PENDING', 'ACCEPTED', 'CANCELLED'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'invalid_status' });

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT b.*
           FROM bookings b
           JOIN properties p ON p.id = b.property_id
          WHERE p.owner_id = :ownerId AND b.status = :status
          ORDER BY b.created_at DESC`,
        { ownerId, status }
      );
      return res.json({ bookings: rows });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /bookings/:id/accept
router.post('/:id/accept', ensureAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ownerId = req.session.owner.id;

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT b.id, b.property_id, b.status, p.owner_id
           FROM bookings b
           JOIN properties p ON p.id = b.property_id
          WHERE b.id = :id`,
        { id }
      );
      if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
      if (rows[0].owner_id !== ownerId) return res.status(403).json({ error: 'forbidden' });
      if (rows[0].status === 'ACCEPTED') return res.json({ ok: true });

      await conn.execute('UPDATE bookings SET status = "ACCEPTED" WHERE id = :id', { id });
      return res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /bookings/:id/cancel
router.post('/:id/cancel', ensureAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ownerId = req.session.owner.id;

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT b.id, b.property_id, b.status, p.owner_id
           FROM bookings b
           JOIN properties p ON p.id = b.property_id
          WHERE b.id = :id`,
        { id }
      );
      if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
      if (rows[0].owner_id !== ownerId) return res.status(403).json({ error: 'forbidden' });

      await conn.execute('UPDATE bookings SET status = "CANCELLED" WHERE id = :id', { id });
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
