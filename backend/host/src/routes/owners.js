const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');
const { ensureAuth } = require('../middleware/auth');

const router = express.Router();

const updateSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  location: Joi.string().max(255).allow('', null).optional(),
  phone: Joi.string().max(50).allow('', null).optional(),
  about: Joi.string().allow('', null).optional(),
  avatar_url: Joi.string().uri().allow('', null).optional(),
  street: Joi.string().max(255).allow('', null).optional(),
  unit: Joi.string().max(100).allow('', null).optional(),
  city: Joi.string().max(120).allow('', null).optional(),
  state: Joi.string().max(80).allow('', null).optional(),
  zip: Joi.string().max(20).allow('', null).optional(),
  country: Joi.string().max(80).allow('', null).optional()
});

router.get('/me', ensureAuth, async (req, res) => {
  try {
    const id = req.session.owner.id;
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id, email, name, location, phone, about, avatar_url, street, unit, city, state, zip, country, created_at FROM owners WHERE id = :id',
        { id }
      );
      if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
      return res.json({ owner: rows[0] });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/me', ensureAuth, async (req, res) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const id = req.session.owner.id;
    const fields = ['name', 'location', 'phone', 'about', 'avatar_url','street','unit','city','state','zip','country'];
    const updates = {};
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(value, f)) updates[f] = value[f];
    }
    if (Object.keys(updates).length === 0) return res.json({ ok: true });

    const setClauses = Object.keys(updates).map((k) => `${k} = :${k}`).join(', ');

    const conn = await pool.getConnection();
    try {
      await conn.execute(`UPDATE owners SET ${setClauses} WHERE id = :id`, { ...updates, id });
      const [rows] = await conn.execute(
        'SELECT id, email, name, location, phone, about, avatar_url, street, unit, city, state, zip, country, created_at FROM owners WHERE id = :id',
        { id }
      );
      return res.json({ owner: rows[0] });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
