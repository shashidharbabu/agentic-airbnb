const express = require('express');
const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database-mongodb');
const { ensureAuth } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();


const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),          
  phone: Joi.string().max(50).optional().allow(''),
  about_me: Joi.string().max(1000).optional().allow(''),   
  city: Joi.string().max(120).optional().allow(''),
  state: Joi.string().max(80).optional().allow(''),        
  country: Joi.string().max(80).optional().allow(''),
  languages: Joi.array().items(Joi.string()).optional(),   
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional().allow(''),
  profile_picture: Joi.string().allow(null).optional()     
});


router.get('/profile', ensureAuth, async (req, res) => {
  try {
    console.log('Profile request - Session:', req.session);
    console.log('Profile request - Traveler:', req.session.traveler);
    const travelerId = req.session.traveler.id;

    const db = await getDB();
    const usersCollection = db.collection('users');
    const travelerProfilesCollection = db.collection('traveler_profiles');

    const user = await usersCollection.findOne({ _id: new ObjectId(travelerId), role: 'TRAVELER' });
    if (!user) return res.status(404).json({ error: 'Traveler not found' });

    const profile = await travelerProfilesCollection.findOne({ traveler_id: new ObjectId(travelerId) });

    const traveler = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      phone: profile?.phone || null,
      about: profile?.about || null,
      city: profile?.city || null,
      country: profile?.country || null,
      state_abbr: profile?.state_abbr || null,
      languages: profile?.languages ? (Array.isArray(profile.languages) ? profile.languages : profile.languages.split(',').map(s => s.trim()).filter(Boolean)) : [],
      gender: profile?.gender || null,
      profile_image_url: profile?.profile_image_url || null,
      updated_at: profile?.updated_at || null
    };

    return res.json({ traveler });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/profile', ensureAuth, async (req, res) => {
  try {
    console.log('Profile update request body:', req.body);
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details);
      return res.status(400).json({ error: error.details[0].message });
    }

    const travelerId = req.session.traveler.id;
    const db = await getDB();
    const usersCollection = db.collection('users');
    const travelerProfilesCollection = db.collection('traveler_profiles');
    const travelerObjectId = new ObjectId(travelerId);

    // Update user name if provided
    if (value.name !== undefined) {
      await usersCollection.updateOne(
        { _id: travelerObjectId, role: 'TRAVELER' },
        { $set: { name: value.name, updated_at: new Date() } }
      );
    }

    // Prepare profile updates
    const profileUpdates = {};
    const fieldMapping = {
      about_me: 'about',
      state: 'state_abbr',
      profile_picture: 'profile_image_url'
    };

    Object.keys(value).forEach((key) => {
      if (key === 'name') return;
      const dbField = fieldMapping[key] || key;
      let v = value[key];
      
      if (key === 'languages') {
        v = Array.isArray(v) ? v : (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []);
      }
      
      if (key === 'profile_picture' && v === null) {
        profileUpdates[dbField] = null;
      } else if (v !== undefined) {
        profileUpdates[dbField] = v;
      }
    });

    // Ensure profile exists, then update
    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date();
      await travelerProfilesCollection.updateOne(
        { traveler_id: travelerObjectId },
        { $set: profileUpdates },
        { upsert: true }
      );
    } else {
      // Ensure profile exists even if no updates
      await travelerProfilesCollection.updateOne(
        { traveler_id: travelerObjectId },
        { $setOnInsert: { traveler_id: travelerObjectId, created_at: new Date() } },
        { upsert: true }
      );
    }

    // Fetch updated data
    const user = await usersCollection.findOne({ _id: travelerObjectId, role: 'TRAVELER' });
    const profile = await travelerProfilesCollection.findOne({ traveler_id: travelerObjectId });

    const traveler = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      phone: profile?.phone || null,
      about: profile?.about || null,
      city: profile?.city || null,
      country: profile?.country || null,
      state_abbr: profile?.state_abbr || null,
      languages: profile?.languages ? (Array.isArray(profile.languages) ? profile.languages : profile.languages.split(',').map(s => s.trim()).filter(Boolean)) : [],
      gender: profile?.gender || null,
      profile_image_url: profile?.profile_image_url || null,
      updated_at: profile?.updated_at || null
    };

    req.session.traveler = {
      id: traveler.id,
      email: traveler.email,
      name: traveler.name,
      role: 'TRAVELER'
    };

    return res.json({
      message: 'Profile updated successfully',
      traveler
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/profile/picture', ensureAuth, uploadSingle('profile_picture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const travelerId = req.session.traveler.id;
    const profilePicturePath = `/uploads/${req.file.filename}`;

    const db = await getDB();
    const travelerProfilesCollection = db.collection('traveler_profiles');

    await travelerProfilesCollection.updateOne(
      { traveler_id: new ObjectId(travelerId) },
      { 
        $set: { 
          profile_image_url: profilePicturePath,
          updated_at: new Date()
        },
        $setOnInsert: {
          traveler_id: new ObjectId(travelerId),
          created_at: new Date()
        }
      },
      { upsert: true }
    );

    return res.json({
      message: 'Profile picture uploaded successfully',
      profile_picture: profilePicturePath
    });
  } catch (err) {
    console.error('Upload profile picture error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    let travelerId;
    try {
      travelerId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid traveler ID' });
    }

    const db = await getDB();
    const usersCollection = db.collection('users');
    const travelerProfilesCollection = db.collection('traveler_profiles');

    const user = await usersCollection.findOne({ _id: travelerId, role: 'TRAVELER' });
    if (!user) return res.status(404).json({ error: 'Traveler not found' });

    const profile = await travelerProfilesCollection.findOne({ traveler_id: travelerId });

    const traveler = {
      id: user._id.toString(),
      name: user.name,
      about_me: profile?.about || null,
      city: profile?.city || null,
      state: profile?.state_abbr || null,
      country: profile?.country || null,
      languages: profile?.languages ? (Array.isArray(profile.languages) ? profile.languages : profile.languages.split(',').map(s => s.trim()).filter(Boolean)) : [],
      gender: profile?.gender || null,
      profile_picture: profile?.profile_image_url || null,
      created_at: user.created_at
    };

    return res.json({ traveler });
  } catch (err) {
    console.error('Get public profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
