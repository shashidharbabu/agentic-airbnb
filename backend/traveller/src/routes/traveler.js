const express = require('express');
const Joi = require('joi');
const { pool } = require('../config/database');
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

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `
        SELECT
          u.id, u.email, u.name, u.created_at,
          tp.phone, tp.about, tp.city, tp.country, tp.state_abbr,
          tp.languages, tp.gender, tp.profile_image_url, tp.updated_at
        FROM users u
        LEFT JOIN traveler_profiles tp ON u.id = tp.traveler_id
        WHERE u.id = ? AND u.role = 'TRAVELER'
        `,
        [travelerId]
      );

      if (!rows.length) return res.status(404).json({ error: 'Traveler not found' });

      const traveler = rows[0];
      if (traveler.languages) {
        traveler.languages = traveler.languages.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        traveler.languages = [];
      }

      return res.json({ traveler });
    } finally {
      conn.release();
    }
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

    const fieldMapping = {
      about_me: 'about',
      state: 'state_abbr',
      profile_picture: 'profile_image_url'
    };

    const profileUpdates = [];
    const profileParams = [];

    Object.keys(value).forEach((key) => {
      if (key === 'name') return; 
      const dbField = fieldMapping[key] || key;

      let v = value[key];
      if (key === 'languages') {
        v = Array.isArray(v) ? v.join(',') : v;
      }
      if (key === 'profile_picture' && v === null) {
        profileUpdates.push(`${dbField} = NULL`);
      } else {
        profileUpdates.push(`${dbField} = ?`);
        profileParams.push(v);
      }
    });

    const conn = await pool.getConnection();
    try {
      await conn.execute('INSERT IGNORE INTO traveler_profiles (traveler_id) VALUES (?)', [travelerId]);

      if (value.name !== undefined) {
        await conn.execute('UPDATE users SET name = ? WHERE id = ? AND role = "TRAVELER"', [
          value.name,
          travelerId
        ]);
      }

      if (profileUpdates.length > 0) {
        const sql = `UPDATE traveler_profiles SET ${profileUpdates.join(', ')} WHERE traveler_id = ?`;
        await conn.execute(sql, [...profileParams, travelerId]);
      }

      const [rows] = await conn.execute(
        `
        SELECT
          u.id, u.email, u.name, u.created_at,
          tp.phone, tp.about, tp.city, tp.country, tp.state_abbr,
          tp.languages, tp.gender, tp.profile_image_url, tp.updated_at
        FROM users u
        LEFT JOIN traveler_profiles tp ON u.id = tp.traveler_id
        WHERE u.id = ? AND u.role = 'TRAVELER'
        `,
        [travelerId]
      );

      const traveler = rows[0];
      traveler.languages = traveler.languages
        ? traveler.languages.split(',').map(s => s.trim()).filter(Boolean)
        : [];

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
    } finally {
      conn.release();
    }
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

    const conn = await pool.getConnection();
    try {
      await conn.execute('INSERT IGNORE INTO traveler_profiles (traveler_id) VALUES (?)', [travelerId]);

      await conn.execute(
        'UPDATE traveler_profiles SET profile_image_url = ? WHERE traveler_id = ?',
        [profilePicturePath, travelerId]
      );

      return res.json({
        message: 'Profile picture uploaded successfully',
        profile_picture: profilePicturePath
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Upload profile picture error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const travelerId = req.params.id;

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `
        SELECT
          u.id,
          u.name,
          tp.about       AS about_me,
          tp.city,
          tp.state_abbr  AS state,
          tp.country,
          tp.languages,
          tp.gender,
          tp.profile_image_url AS profile_picture,
          u.created_at
        FROM users u
        LEFT JOIN traveler_profiles tp ON u.id = tp.traveler_id
        WHERE u.id = ? AND u.role = 'TRAVELER'
        `,
        [travelerId]
      );

      if (!rows.length) return res.status(404).json({ error: 'Traveler not found' });

      const traveler = rows[0];
      traveler.languages = traveler.languages
        ? traveler.languages.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      return res.json({ traveler });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Get public profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
