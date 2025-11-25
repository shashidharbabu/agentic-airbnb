const express = require('express');
const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db-mongodb');
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
    const db = await getDB();
    const ownersCollection = db.collection('owners');

    const owner = await ownersCollection.findOne({ _id: new ObjectId(id) });
    if (!owner) return res.status(404).json({ error: 'not_found' });

    const formattedOwner = {
      id: owner._id.toString(),
      email: owner.email,
      name: owner.name,
      location: owner.location,
      phone: owner.phone,
      about: owner.about,
      avatar_url: owner.avatar_url,
      street: owner.street,
      unit: owner.unit,
      city: owner.city,
      state: owner.state,
      zip: owner.zip,
      country: owner.country,
      created_at: owner.created_at
    };

    return res.json({ owner: formattedOwner });
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

    updates.updated_at = new Date();

    const db = await getDB();
    const ownersCollection = db.collection('owners');

    await ownersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    const owner = await ownersCollection.findOne({ _id: new ObjectId(id) });
    const formattedOwner = {
      id: owner._id.toString(),
      email: owner.email,
      name: owner.name,
      location: owner.location,
      phone: owner.phone,
      about: owner.about,
      avatar_url: owner.avatar_url,
      street: owner.street,
      unit: owner.unit,
      city: owner.city,
      state: owner.state,
      zip: owner.zip,
      country: owner.country,
      created_at: owner.created_at
    };

    return res.json({ owner: formattedOwner });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
