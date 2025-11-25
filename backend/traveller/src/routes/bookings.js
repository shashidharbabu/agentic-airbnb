const express = require('express');
const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database-mongodb');
const { ensureAuth } = require('../middleware/auth');
const { sendEvent } = require('../config/kafka');
const TOPICS = require('../config/kafka-topics');

const router = express.Router();

const createBookingSchema = Joi.object({
  property_id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
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
    console.log('Booking creation request received');
    console.log('Session:', req.session ? { traveler: req.session.traveler } : 'No session');
    console.log('Request body:', req.body);

    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      console.error('Validation error:', error.details);
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!req.session || !req.session.traveler || !req.session.traveler.id) {
      console.error('No traveler session found');
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }

    const travelerId = req.session.traveler.id;
    console.log('Traveler ID from session:', travelerId);

    let propertyId;
    try {
      propertyId = new ObjectId(value.property_id);
      console.log('Property ID converted:', propertyId.toString());
    } catch (err) {
      console.error('Invalid property ID:', value.property_id, err.message);
      return res.status(400).json({ error: `Invalid property ID: ${value.property_id}` });
    }

    const { start_date, end_date, guests, special_requests } = value;

    const nights = dateDiffNights(start_date, end_date);
    if (nights < 1) {
      return res.status(400).json({ error: 'Stay must be at least 1 night' });
    }

    const db = await getDB();
    const usersCollection = db.collection('users');
    const propertiesCollection = db.collection('properties');
    const bookingsCollection = db.collection('bookings');
    const ownersCollection = db.collection('owners');

    // Get traveler info
    const traveler = await usersCollection.findOne({ _id: new ObjectId(travelerId), role: 'TRAVELER' });
    if (!traveler) {
      console.error('Traveler not found in database:', travelerId);
      return res.status(404).json({ error: 'Traveler not found' });
    }
    console.log('Traveler found:', traveler.email);

    // Get property info
    const property = await propertiesCollection.findOne({ _id: propertyId });
    if (!property) {
      console.error('Property not found in database:', propertyId.toString());
      return res.status(404).json({ error: 'Property not found' });
    }
    console.log('Property found:', property.name);

    if (guests > property.max_guests) {
      return res.status(400).json({
        error: `Maximum ${property.max_guests} guests allowed for this property`
      });
    }

    // Check for conflicts
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const conflicts = await bookingsCollection.find({
      property_id: propertyId,
      status: 'ACCEPTED',
      $or: [
        { start_date: { $lte: endDate }, end_date: { $gt: startDate } },
        { start_date: { $lt: endDate }, end_date: { $gte: startDate } },
        { start_date: { $gte: startDate }, end_date: { $lte: endDate } }
      ]
    }).toArray();

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Property not available for selected dates' });
    }

    const totalPrice = property.price_per_night * nights;

    // Insert booking
    const result = await bookingsCollection.insertOne({
      property_id: propertyId,
      traveler_id: new ObjectId(travelerId),
      traveler_name: traveler.name,
      traveler_email: traveler.email,
      start_date: startDate,
      end_date: endDate,
      guests: guests,
      total_price: totalPrice,
      special_requests: special_requests || null,
      status: 'PENDING',
      created_at: new Date(),
      updated_at: new Date()
    });

    const bookingId = result.insertedId;

    // Get owner info
    const owner = property.owner_id ? await ownersCollection.findOne({ _id: property.owner_id }) : null;

    // Format booking response
    const booking = {
      id: bookingId.toString(),
      property_id: propertyId.toString(),
      traveler_id: travelerId,
      traveler_name: traveler.name,
      traveler_email: traveler.email,
      start_date: startDate,
      end_date: endDate,
      guests: guests,
      total_price: totalPrice,
      special_requests: special_requests || null,
      status: 'PENDING',
      created_at: new Date(),
      property_name: property.name,
      property_location: property.location,
      price_per_night: property.price_per_night,
      owner_name: owner?.name || null
    };

    // Send Kafka event for booking creation
    try {
      await sendEvent(TOPICS.BOOKING_CREATED, {
        type: 'booking-created',
        booking_id: bookingId.toString(),
        property_id: propertyId.toString(),
        owner_id: property.owner_id ? (typeof property.owner_id === 'object' ? property.owner_id.toString() : property.owner_id) : null,
        traveler_id: travelerId,
        traveler_name: traveler.name,
        traveler_email: traveler.email,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        guests: guests,
        total_price: totalPrice,
        status: 'PENDING'
      }, bookingId.toString());
    } catch (kafkaError) {
      // Log error but don't fail the booking creation
      console.error('Failed to send Kafka event for booking creation:', kafkaError);
    }

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/traveler/:id', ensureAuth, async (req, res) => {
  try {
    const travelerId = req.params.id;
    const requestingTravelerId = req.session.traveler.id;

    if (travelerId !== requestingTravelerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status } = req.query;

    const db = await getDB();
    const bookingsCollection = db.collection('bookings');
    const propertiesCollection = db.collection('properties');
    const ownersCollection = db.collection('owners');
    const propertyPhotosCollection = db.collection('property_photos');

    const matchQuery = { traveler_id: new ObjectId(travelerId) };
    if (status) {
      matchQuery.status = status;
    }

    const bookings = await bookingsCollection.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'properties',
          localField: 'property_id',
          foreignField: '_id',
          as: 'property'
        }
      },
      { $unwind: { path: '$property', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'owners',
          localField: 'property.owner_id',
          foreignField: '_id',
          as: 'owner'
        }
      },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      { $sort: { created_at: -1 } }
    ]).toArray();

    // Fetch photos for each booking
    const bookingsWithPhotos = await Promise.all(
      bookings.map(async (booking) => {
        const photo = await propertyPhotosCollection.findOne(
          { property_id: booking.property_id },
          { sort: { created_at: 1 } }
        );

        return {
          id: booking._id.toString(),
          property_id: booking.property_id ? (typeof booking.property_id === 'object' ? booking.property_id.toString() : booking.property_id) : null,
          traveler_id: booking.traveler_id ? (typeof booking.traveler_id === 'object' ? booking.traveler_id.toString() : booking.traveler_id) : null,
          traveler_name: booking.traveler_name,
          traveler_email: booking.traveler_email,
          start_date: booking.start_date,
          end_date: booking.end_date,
          guests: booking.guests,
          status: booking.status,
          total_price: booking.total_price,
          special_requests: booking.special_requests,
          created_at: booking.created_at,
          property_name: booking.property?.name || null,
          property_location: booking.property?.location || null,
          price_per_night: booking.property?.price_per_night || null,
          bedrooms: booking.property?.bedrooms || null,
          bathrooms: booking.property?.bathrooms || null,
          property_type: booking.property?.property_type || null,
          owner_name: booking.owner?.name || null,
          property_photo: photo?.file_path || null
        };
      })
    );

    return res.json({ bookings: bookingsWithPhotos });
  } catch (error) {
    console.error('Get traveler bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', ensureAuth, async (req, res) => {
  try {
    let bookingId, travelerId;
    try {
      bookingId = new ObjectId(req.params.id);
      travelerId = new ObjectId(req.session.traveler.id);
    } catch {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const db = await getDB();
    const bookingsCollection = db.collection('bookings');
    const propertiesCollection = db.collection('properties');
    const ownersCollection = db.collection('owners');

    const booking = await bookingsCollection.findOne({ _id: bookingId, traveler_id: travelerId });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get property and owner info
    const property = booking.property_id ? await propertiesCollection.findOne({ _id: booking.property_id }) : null;
    const owner = property?.owner_id ? await ownersCollection.findOne({ _id: property.owner_id }) : null;

    const formattedBooking = {
      id: booking._id.toString(),
      property_id: booking.property_id ? (typeof booking.property_id === 'object' ? booking.property_id.toString() : booking.property_id) : null,
      traveler_id: booking.traveler_id ? (typeof booking.traveler_id === 'object' ? booking.traveler_id.toString() : booking.traveler_id) : null,
      traveler_name: booking.traveler_name,
      traveler_email: booking.traveler_email,
      start_date: booking.start_date,
      end_date: booking.end_date,
      guests: booking.guests,
      status: booking.status,
      total_price: booking.total_price,
      special_requests: booking.special_requests,
      created_at: booking.created_at,
      property_name: property?.name || null,
      property_description: property?.description || null,
      property_location: property?.location || null,
      price_per_night: property?.price_per_night || null,
      bedrooms: property?.bedrooms || null,
      bathrooms: property?.bathrooms || null,
      property_type: property?.property_type || null,
      amenities: property?.amenities ? (Array.isArray(property.amenities) ? property.amenities : (() => { try { return typeof property.amenities === 'string' ? JSON.parse(property.amenities) : []; } catch { return []; } })()) : [],
      owner_name: owner?.name || null,
      owner_email: owner?.email || null
    };

    return res.json({ booking: formattedBooking });
  } catch (error) {
    console.error('Get booking details error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/:id/cancel', ensureAuth, async (req, res) => {
  try {
    let bookingId, travelerId;
    try {
      bookingId = new ObjectId(req.params.id);
      travelerId = new ObjectId(req.session.traveler.id);
    } catch {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const db = await getDB();
    const bookingsCollection = db.collection('bookings');

    const booking = await bookingsCollection.findOne({ _id: bookingId, traveler_id: travelerId });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

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

    await bookingsCollection.updateOne(
      { _id: bookingId },
      { $set: { status: 'CANCELLED', updated_at: new Date() } }
    );

    // Get property and owner info for Kafka event
    const propertiesCollection = db.collection('properties');
    const ownersCollection = db.collection('owners');
    const property = booking.property_id ? await propertiesCollection.findOne({ _id: booking.property_id }) : null;
    const owner = property?.owner_id ? await ownersCollection.findOne({ _id: property.owner_id }) : null;

    // Send Kafka event for booking cancellation
    try {
      await sendEvent(TOPICS.BOOKING_CANCELLED, {
        type: 'booking-cancelled',
        booking_id: bookingId.toString(),
        property_id: booking.property_id ? (typeof booking.property_id === 'object' ? booking.property_id.toString() : booking.property_id) : null,
        owner_id: property?.owner_id ? (typeof property.owner_id === 'object' ? property.owner_id.toString() : property.owner_id) : null,
        traveler_id: travelerId,
        traveler_name: booking.traveler_name,
        traveler_email: booking.traveler_email,
        cancelled_by: 'TRAVELER',
        start_date: booking.start_date.toISOString ? booking.start_date.toISOString() : new Date(booking.start_date).toISOString(),
        end_date: booking.end_date.toISOString ? booking.end_date.toISOString() : new Date(booking.end_date).toISOString(),
        guests: booking.guests,
        total_price: booking.total_price,
        status: 'CANCELLED'
      }, bookingId.toString());
    } catch (kafkaError) {
      // Log error but don't fail the booking cancellation
      console.error('Failed to send Kafka event for booking cancellation:', kafkaError);
    }

    return res.json({
      message: 'Booking cancelled successfully',
      booking_id: bookingId.toString()
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Internal API endpoint for AI Agent (no auth required)
// This endpoint is specifically for the AI Agent backend to fetch bookings
router.get('/internal/traveler/:id/upcoming', async (req, res) => {
  try {
    let travelerId;
    try {
      travelerId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid traveler ID' });
    }

    const db = await getDB();
    const bookingsCollection = db.collection('bookings');
    const propertiesCollection = db.collection('properties');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = await bookingsCollection.aggregate([
      {
        $match: {
          traveler_id: travelerId,
          status: 'ACCEPTED',
          start_date: { $gte: today }
        }
      },
      {
        $lookup: {
          from: 'properties',
          localField: 'property_id',
          foreignField: '_id',
          as: 'property'
        }
      },
      { $unwind: { path: '$property', preserveNullAndEmptyArrays: true } },
      { $sort: { start_date: 1 } }
    ]).toArray();

    const formattedBookings = bookings.map(booking => ({
      id: booking._id.toString(),
      property_id: booking.property_id ? (typeof booking.property_id === 'object' ? booking.property_id.toString() : booking.property_id) : null,
      traveler_id: booking.traveler_id ? (typeof booking.traveler_id === 'object' ? booking.traveler_id.toString() : booking.traveler_id) : null,
      traveler_name: booking.traveler_name,
      traveler_email: booking.traveler_email,
      start_date: booking.start_date,
      end_date: booking.end_date,
      guests: booking.guests,
      status: booking.status,
      total_price: booking.total_price,
      special_requests: booking.special_requests,
      created_at: booking.created_at,
      property_name: booking.property?.name || null,
      property_location: booking.property?.location || null,
      city: booking.property?.city || null,
      state: booking.property?.state || null,
      country: booking.property?.country || null,
      price_per_night: booking.property?.price_per_night || null,
      bedrooms: booking.property?.bedrooms || null,
      bathrooms: booking.property?.bathrooms || null,
      property_type: booking.property?.property_type || null
    }));

    return res.json({ bookings: formattedBookings });
  } catch (error) {
    console.error('Get internal upcoming bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
