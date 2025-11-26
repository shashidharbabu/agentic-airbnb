const express = require('express');
const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db-mongodb');

const router = express.Router();

// GET /public/properties?location=&start_date=&end_date=&guests=
router.get('/properties', async (req, res) => {
  try {
    const location = (req.query.location || '').toString();
    const db = await getDB();
    const propertiesCollection = db.collection('properties');

    const query = {};
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const properties = await propertiesCollection
      .find(query)
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    const formattedProperties = properties.map(prop => ({
      id: prop._id.toString(),
      owner_id: prop.owner_id ? (typeof prop.owner_id === 'object' ? prop.owner_id.toString() : prop.owner_id) : null,
      name: prop.name,
      description: prop.description,
      location: prop.location,
      address: prop.address,
      price_per_night: prop.price_per_night,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
      availability_start: prop.availability_start,
      availability_end: prop.availability_end,
      created_at: prop.created_at
    }));

    return res.json({ properties: formattedProperties });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

const bookingSchema = Joi.object({
  property_id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
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

    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const bookingsCollection = db.collection('bookings');

    let propertyId;
    try {
      propertyId = new ObjectId(value.property_id);
    } catch {
      return res.status(400).json({ error: 'invalid_property_id' });
    }

    const property = await propertiesCollection.findOne({ _id: propertyId });
    if (!property) return res.status(404).json({ error: 'property_not_found' });

    const result = await bookingsCollection.insertOne({
      property_id: propertyId,
      traveler_name: value.traveler_name,
      traveler_email: value.traveler_email,
      start_date: value.start_date,
      end_date: value.end_date,
      guests: value.guests,
      status: 'PENDING',
      created_at: new Date(),
      updated_at: new Date()
    });

    return res.json({ id: result.insertedId.toString() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /public/bookings/:id
router.get('/bookings/:id', async (req, res) => {
  try {
    let id;
    try {
      id = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'invalid_id' });
    }

    const db = await getDB();
    const bookingsCollection = db.collection('bookings');

    const booking = await bookingsCollection.findOne({ _id: id });
    if (!booking) return res.status(404).json({ error: 'not_found' });

    const formattedBooking = {
      id: booking._id.toString(),
      property_id: booking.property_id ? (typeof booking.property_id === 'object' ? booking.property_id.toString() : booking.property_id) : null,
      traveler_name: booking.traveler_name,
      traveler_email: booking.traveler_email,
      start_date: booking.start_date,
      end_date: booking.end_date,
      guests: booking.guests,
      status: booking.status,
      created_at: booking.created_at
    };

    return res.json({ booking: formattedBooking });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
