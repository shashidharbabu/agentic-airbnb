const express = require('express');
const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db-mongodb');
const { ensureAuth } = require('../middleware/auth');
const { sendEvent } = require('../config/kafka');
const TOPICS = require('../config/kafka-topics');

const router = express.Router();

const statusQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ACCEPTED', 'CANCELLED').default('PENDING')
});

async function fetchBookings(db, options) {
  const { ownerId, status, id } = options;
  const bookingsCollection = db.collection('bookings');
  const propertiesCollection = db.collection('properties');
  const usersCollection = db.collection('users');

  const matchStage = { 'property.owner_id': new ObjectId(ownerId) };
  if (id) {
    matchStage._id = new ObjectId(id);
  }
  if (status) {
    matchStage.status = status;
  }

  const bookings = await bookingsCollection.aggregate([
    {
      $lookup: {
        from: 'properties',
        localField: 'property_id',
        foreignField: '_id',
        as: 'property'
      }
    },
    { $unwind: '$property' },
    {
      $lookup: {
        from: 'users',
        localField: 'traveler_id',
        foreignField: '_id',
        as: 'traveler_account'
      }
    },
    { $unwind: { path: '$traveler_account', preserveNullAndEmptyArrays: true } },
    { $match: matchStage },
    { $sort: { start_date: 1, created_at: 1 } }
  ]).toArray();

  return bookings.map(booking => ({
    id: booking._id.toString(),
    property_id: booking.property_id ? (typeof booking.property_id === 'object' ? booking.property_id.toString() : booking.property_id) : null,
    traveler_id: booking.traveler_id ? (typeof booking.traveler_id === 'object' ? booking.traveler_id.toString() : booking.traveler_id) : null,
    traveler_name: booking.traveler_name,
    traveler_email: booking.traveler_email,
    start_date: booking.start_date,
    end_date: booking.end_date,
    guests: booking.guests,
    status: booking.status,
    total_price: booking.total_price || null,
    special_requests: booking.special_requests || null,
    created_at: booking.created_at,
    property_owner_id: booking.property.owner_id ? (typeof booking.property.owner_id === 'object' ? booking.property.owner_id.toString() : booking.property.owner_id) : null,
    property_name: booking.property.name,
    property_location: booking.property.location,
    property_address: booking.property.address,
    property_city: booking.property.city,
    property_state: booking.property.state,
    property_country: booking.property.country,
    traveler_account_name: booking.traveler_account?.name || null,
    traveler_account_email: booking.traveler_account?.email || null
  }));
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
  id: typeof row.id === 'string' ? row.id : row._id?.toString() || row.id?.toString(),
  status: row.status,
  startDate: row.start_date,
  endDate: row.end_date,
  guests: row.guests,
  createdAt: row.created_at,
  travelerId: row.traveler_id ? (typeof row.traveler_id === 'object' ? row.traveler_id.toString() : row.traveler_id) : null,
  totalPrice: row.total_price,
  specialRequests: row.special_requests,
  traveler: {
    name: row.traveler_account_name || row.traveler_name,
    email: row.traveler_account_email || row.traveler_email
  },
  property: {
    id: row.property_id ? (typeof row.property_id === 'object' ? row.property_id.toString() : row.property_id) : null,
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
    const db = await getDB();

    const rows = await fetchBookings(db, { ownerId, status: value.status });
    return res.json({ bookings: rows.map(serializeBooking) });
  } catch (err) {
    console.error('GET /bookings/incoming failed:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /bookings/property/:propertyId - Get all bookings for a specific property
router.get('/property/:propertyId', ensureAuth, async (req, res) => {
  try {
    let propertyId;
    try {
      propertyId = new ObjectId(req.params.propertyId);
    } catch {
      return res.status(400).json({ error: 'invalid_property_id' });
    }

    const ownerId = req.session.owner.id;
    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const bookingsCollection = db.collection('bookings');
    const usersCollection = db.collection('users');

    // First check if the property belongs to this owner
    const property = await propertiesCollection.findOne({ _id: propertyId });
    if (!property) {
      return res.status(404).json({ error: 'property_not_found' });
    }

    if (property.owner_id.toString() !== ownerId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // Fetch all bookings for this property
    const bookings = await bookingsCollection.aggregate([
      { $match: { property_id: propertyId } },
      {
        $lookup: {
          from: 'users',
          localField: 'traveler_id',
          foreignField: '_id',
          as: 'traveler_account'
        }
      },
      { $unwind: { path: '$traveler_account', preserveNullAndEmptyArrays: true } },
      { $sort: { start_date: -1, created_at: -1 } }
    ]).toArray();

    const formattedBookings = bookings.map(booking => ({
      id: booking._id.toString(),
      property_id: booking.property_id ? (typeof booking.property_id === 'object' ? booking.property_id.toString() : booking.property_id) : null,
      traveler_id: booking.traveler_id ? (typeof booking.traveler_id === 'object' ? booking.traveler_id.toString() : booking.traveler_id) : null,
      traveler_name: booking.traveler_account?.name || booking.traveler_name,
      traveler_email: booking.traveler_account?.email || booking.traveler_email,
      start_date: booking.start_date,
      end_date: booking.end_date,
      guests: booking.guests,
      status: booking.status,
      total_price: booking.total_price || null,
      special_requests: booking.special_requests || null,
      created_at: booking.created_at
    }));

    return res.json({ bookings: formattedBookings });
  } catch (err) {
    console.error(`GET /bookings/property/${req.params.propertyId} failed:`, err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /bookings/:id/accept
router.post('/:id/accept', ensureAuth, async (req, res) => {
  try {
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'invalid_id' });
    }

    const ownerId = req.session.owner.id;
    const db = await getDB();
    const bookingsCollection = db.collection('bookings');

    // Fetch booking to verify ownership and status
    const rows = await fetchBookings(db, { ownerId, id });

    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    const booking = rows[0];
    if (booking.property_owner_id !== ownerId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(422).json({ error: 'already_cancelled' });
    }

    if (booking.status === 'ACCEPTED') {
      return res.json({ booking: serializeBooking(booking) });
    }

    // Check for date conflicts
    const propertyId = typeof booking.property_id === 'string' ? new ObjectId(booking.property_id) : booking.property_id;
    const conflicts = await bookingsCollection.countDocuments({
      property_id: propertyId,
      status: 'ACCEPTED',
      _id: { $ne: id },
      start_date: { $lt: booking.end_date },
      end_date: { $gt: booking.start_date }
    });

    if (conflicts > 0) {
      return res.status(409).json({ error: 'date_conflict' });
    }

    // Update booking status (without transaction for standalone MongoDB)
    await bookingsCollection.updateOne(
      { _id: id },
      { $set: { status: 'ACCEPTED', updated_at: new Date() } }
    );

    // Fetch updated booking
    const updatedRows = await fetchBookings(db, { ownerId, id });
    const updatedBooking = updatedRows[0];

    // Send Kafka event for booking acceptance
    try {
      await sendEvent(TOPICS.BOOKING_ACCEPTED, {
        type: 'booking-accepted',
        booking_id: id.toString(),
        property_id: updatedBooking.property_id,
        owner_id: ownerId,
        traveler_id: updatedBooking.traveler_id,
        traveler_name: updatedBooking.traveler_name,
        traveler_email: updatedBooking.traveler_email,
        start_date: updatedBooking.start_date.toISOString ? updatedBooking.start_date.toISOString() : new Date(updatedBooking.start_date).toISOString(),
        end_date: updatedBooking.end_date.toISOString ? updatedBooking.end_date.toISOString() : new Date(updatedBooking.end_date).toISOString(),
        guests: updatedBooking.guests,
        total_price: updatedBooking.total_price,
        status: 'ACCEPTED'
      }, id.toString());
    } catch (kafkaError) {
      // Log error but don't fail the booking acceptance
      console.error('Failed to send Kafka event for booking acceptance:', kafkaError);
    }

    return res.json({ booking: serializeBooking(updatedBooking) });
  } catch (err) {
    console.error(`POST /bookings/${req.params.id}/accept failed:`, err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /bookings/:id/cancel
router.post('/:id/cancel', ensureAuth, async (req, res) => {
  try {
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'invalid_id' });
    }

    const ownerId = req.session.owner.id;
    const db = await getDB();
    const bookingsCollection = db.collection('bookings');

    // Fetch booking to verify ownership and status
    const rows = await fetchBookings(db, { ownerId, id });

    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    const booking = rows[0];
    if (booking.property_owner_id !== ownerId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    if (booking.status === 'CANCELLED') {
      return res.json({ booking: serializeBooking(booking) });
    }

    // Update booking status (without transaction for standalone MongoDB)
    await bookingsCollection.updateOne(
      { _id: id },
      { $set: { status: 'CANCELLED', updated_at: new Date() } }
    );

    // Fetch updated booking
    const updatedRows = await fetchBookings(db, { ownerId, id });
    const updatedBooking = updatedRows[0];

    // Send Kafka event for booking cancellation
    try {
      await sendEvent(TOPICS.BOOKING_CANCELLED, {
        type: 'booking-cancelled',
        booking_id: id.toString(),
        property_id: updatedBooking.property_id,
        owner_id: ownerId,
        traveler_id: updatedBooking.traveler_id,
        traveler_name: updatedBooking.traveler_name,
        traveler_email: updatedBooking.traveler_email,
        cancelled_by: 'HOST',
        start_date: updatedBooking.start_date.toISOString ? updatedBooking.start_date.toISOString() : new Date(updatedBooking.start_date).toISOString(),
        end_date: updatedBooking.end_date.toISOString ? updatedBooking.end_date.toISOString() : new Date(updatedBooking.end_date).toISOString(),
        guests: updatedBooking.guests,
        total_price: updatedBooking.total_price,
        status: 'CANCELLED'
      }, id.toString());
    } catch (kafkaError) {
      // Log error but don't fail the booking cancellation
      console.error('Failed to send Kafka event for booking cancellation:', kafkaError);
    }

    return res.json({ booking: serializeBooking(updatedBooking) });
  } catch (err) {
    console.error(`POST /bookings/${req.params.id}/cancel failed:`, err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
