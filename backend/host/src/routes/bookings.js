const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');
const { ensureAuth } = require('../middleware/auth');

const router = express.Router();

const statusQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ACCEPTED', 'CANCELLED').default('PENDING')
});

const BOOKING_SELECT_WITH_TRAVELER = `
  SELECT
    b.id,
    b.property_id,
    b.traveler_id,
    b.traveler_name,
    b.traveler_email,
    b.start_date,
    b.end_date,
    b.guests,
    b.status,
    b.created_at,
    p.owner_id AS property_owner_id,
    p.name AS property_name,
    p.location AS property_location,
    p.address AS property_address,
    p.city AS property_city,
    p.state AS property_state,
    p.country AS property_country,
    tu.name AS traveler_account_name,
    tu.email AS traveler_account_email
  FROM bookings b
  JOIN properties p ON p.id = b.property_id
  LEFT JOIN users tu ON tu.id = b.traveler_id
`;

const BOOKING_SELECT_LEGACY = `
  SELECT
    b.id,
    b.property_id,
    NULL AS traveler_id,
    b.traveler_name,
    b.traveler_email,
    b.start_date,
    b.end_date,
    b.guests,
    b.status,
    b.created_at,
    p.owner_id AS property_owner_id,
    p.name AS property_name,
    p.location AS property_location,
    p.address AS property_address,
    p.city AS property_city,
    p.state AS property_state,
    p.country AS property_country,
    NULL AS traveler_account_name,
    NULL AS traveler_account_email
  FROM bookings b
  JOIN properties p ON p.id = b.property_id
`;

let supportsTravelerAccounts = true;

const isSchemaMismatchError = (error) => {
  if (!error) return false;
  return error.code === 'ER_BAD_FIELD_ERROR' ||
    error.code === 'ER_NO_SUCH_TABLE' ||
    error.errno === 1054 ||
    error.errno === 1146;
};

const buildBookingQuery = (base, { ownerId, status, id, lock }) => {
  const params = { ownerId };
  const conditions = ['p.owner_id = :ownerId'];
  if (typeof id === 'number' && !Number.isNaN(id)) {
    conditions.push('b.id = :id');
    params.id = id;
  }
  if (status) {
    conditions.push('b.status = :status');
    params.status = status;
  }

  let query = `${base}\nWHERE ${conditions.join('\n  AND ')}`;
  if (!id) query += '\nORDER BY b.start_date ASC, b.created_at ASC';
  if (lock) query += '\nFOR UPDATE';
  return { query, params };
};

async function fetchBookings(conn, options) {
  const base = supportsTravelerAccounts ? BOOKING_SELECT_WITH_TRAVELER : BOOKING_SELECT_LEGACY;
  const { query, params } = buildBookingQuery(base, options);
  try {
    const [rows] = await conn.execute(query, params);
    return rows;
  } catch (error) {
    if (supportsTravelerAccounts && isSchemaMismatchError(error)) {
      supportsTravelerAccounts = false;
      const fallback = buildBookingQuery(BOOKING_SELECT_LEGACY, options);
      const [rows] = await conn.execute(fallback.query, fallback.params);
      return rows;
    }
    throw error;
  }
}

const buildLocationLabel = (row) => {
  if (row.property_location) return row.property_location;
  const parts = [];
  if (row.property_city) parts.push(row.property_city);
  if (row.property_state) parts.push(row.property_state);
  if (!row.property_state && row.property_country) parts.push(row.property_country);
  else if (row.property_country) parts.push(row.property_country);
  return parts.length ? parts.join(', ') : 'Location not set';
};

const serializeBooking = (row) => ({
  id: row.id,
  status: row.status,
  startDate: row.start_date,
  endDate: row.end_date,
  guests: row.guests,
  createdAt: row.created_at,
  travelerId: row.traveler_id,
  traveler: {
    name: row.traveler_account_name || row.traveler_name,
    email: row.traveler_account_email || row.traveler_email
  },
  property: {
    id: row.property_id,
    name: row.property_name || 'Untitled listing',
    location: buildLocationLabel(row),
    city: row.property_city,
    state: row.property_state,
    country: row.property_country,
    address: row.property_address
  }
});

// GET /bookings/incoming?status=PENDING|ACCEPTED|CANCELLED
router.get('/incoming', ensureAuth, async (req, res) => {
  try {
    const { value, error } = statusQuerySchema.validate({ status: req.query.status });
    if (error) return res.status(400).json({ error: 'invalid_status' });

    const ownerId = req.session.owner.id;
    const conn = await pool.getConnection();

    try {
      const rows = await fetchBookings(conn, { ownerId, status: value.status });

      return res.json({ bookings: rows.map(serializeBooking) });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('GET /bookings/incoming failed:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /bookings/:id/accept
router.post('/:id/accept', ensureAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid_id' });

    const ownerId = req.session.owner.id;
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const rows = await fetchBookings(conn, { ownerId, id, lock: true });

      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'not_found' });
      }

      const booking = rows[0];
      if (booking.property_owner_id !== ownerId) {
        await conn.rollback();
        return res.status(403).json({ error: 'forbidden' });
      }

      if (booking.status === 'CANCELLED') {
        await conn.rollback();
        return res.status(422).json({ error: 'already_cancelled' });
      }

      if (booking.status === 'ACCEPTED') {
        await conn.commit();
        return res.json({ booking: serializeBooking(booking) });
      }

      const [conflicts] = await conn.execute(
        `SELECT id
           FROM bookings
          WHERE property_id = :propertyId
            AND status = 'ACCEPTED'
            AND id != :id
            AND start_date < :endDate
            AND end_date > :startDate
          LIMIT 1`,
        {
          propertyId: booking.property_id,
          id,
          startDate: booking.start_date,
          endDate: booking.end_date
        }
      );

      if (conflicts.length > 0) {
        await conn.rollback();
        return res.status(409).json({ error: 'date_conflict' });
      }

      await conn.execute(
        'UPDATE bookings SET status = "ACCEPTED" WHERE id = :id',
        { id }
      );

      const updatedRows = await fetchBookings(conn, { ownerId, id });

      await conn.commit();

      return res.json({ booking: serializeBooking(updatedRows[0]) });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(`POST /bookings/${req.params.id}/accept failed:`, err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /bookings/:id/cancel
router.post('/:id/cancel', ensureAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid_id' });

    const ownerId = req.session.owner.id;
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const rows = await fetchBookings(conn, { ownerId, id, lock: true });

      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'not_found' });
      }

      const booking = rows[0];
      if (booking.property_owner_id !== ownerId) {
        await conn.rollback();
        return res.status(403).json({ error: 'forbidden' });
      }

      if (booking.status === 'CANCELLED') {
        await conn.commit();
        return res.json({ booking: serializeBooking(booking) });
      }

      await conn.execute(
        'UPDATE bookings SET status = "CANCELLED" WHERE id = :id',
        { id }
      );

      const updatedRows = await fetchBookings(conn, { ownerId, id });

      await conn.commit();

      return res.json({ booking: serializeBooking(updatedRows[0]) });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(`POST /bookings/${req.params.id}/cancel failed:`, err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
