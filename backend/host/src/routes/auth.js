const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { pool } = require('../db');
const passport = require('../middleware/passport');
const admin = require('../middleware/firebase');
const { ensureAuth } = require('../middleware/auth');

const router = express.Router();
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'airbnb_host.sid';

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  name: Joi.string().min(1).max(255).required(),
  phone: Joi.string().min(7).max(20).required(),
  location: Joi.string().min(2).max(255).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  phone: Joi.string().min(7).max(20).required(),
  location: Joi.string().min(2).max(255).required(),
  bio: Joi.string().max(1000).allow('').optional()
});

router.post('/signup', async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const email = value.email.toLowerCase().trim();
  const name = value.name.trim();
  const phone = value.phone.trim();
  const location = value.location.trim();
    const passwordHash = await bcrypt.hash(value.password, 10);

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute('SELECT id FROM owners WHERE email = :email', { email });
      if (rows.length > 0) return res.status(409).json({ error: 'email_in_use' });

      const [phoneRows] = await conn.execute('SELECT id FROM owners WHERE phone = :phone', { phone });
      if (phoneRows.length > 0) return res.status(409).json({ error: 'phone_in_use' });

      const [result] = await conn.execute(
        'INSERT INTO owners (email, password_hash, name, phone, location) VALUES (:email, :password_hash, :name, :phone, :location)',
        { email, password_hash: passwordHash, name, phone, location }
      );

  const owner = { id: result.insertId, email, name, phone, location, bio: '' };
      req.session.owner = owner;
      return res.json({ owner });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const email = value.email.toLowerCase().trim();

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id, email, name, phone, location, password_hash, about FROM owners WHERE email = :email',
        { email }
      );
      if (rows.length === 0) return res.status(401).json({ error: 'invalid_credentials' });
      const row = rows[0];
      const ok = await bcrypt.compare(value.password, row.password_hash);
      if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

      const owner = {
        id: row.id,
        email: row.email,
        name: row.name,
        phone: row.phone,
        location: row.location,
        bio: row.about || ''
      };
      req.session.owner = owner;
      return res.json({ owner });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.post('/logout', (req, res) => {
  const finalize = () => {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.sendStatus(204);
  };

  if (!req.session) {
    return finalize();
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session during logout:', err);
      return res.status(500).json({ error: 'internal_error' });
    }
    finalize();
  });
});

router.get('/me', ensureAuth, (req, res) => {
  const owner = req.session.owner || req.user || null;
  return res.json({ owner });
});

router.put('/profile', ensureAuth, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const ownerId = req.session.owner?.id;
    if (!ownerId) return res.status(401).json({ error: 'unauthorized' });

  const name = value.name.trim();
  const phone = value.phone.trim();
  const location = value.location.trim();
  const bio = typeof value.bio === 'string' ? value.bio.trim() : '';

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id FROM owners WHERE phone = :phone AND id != :id',
        { phone, id: ownerId }
      );
      if (rows.length > 0) {
        return res.status(409).json({ error: 'phone_in_use' });
      }

      await conn.execute(
        'UPDATE owners SET name = :name, phone = :phone, location = :location, about = :bio WHERE id = :id',
        { name, phone, location, bio, id: ownerId }
      );

      const updatedOwner = {
        ...req.session.owner,
        name,
        phone,
        location,
        bio
      };

      req.session.owner = updatedOwner;
      return res.json({ owner: updatedOwner });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ========== Google OAuth Routes ==========

// Initiate Google OAuth flow
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Always show account picker
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.WEB_ORIGIN || 'http://localhost:5174',
    session: true
  }),
  (req, res) => {
    // Store user in session for compatibility with existing code
    req.session.owner = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    };
    
    // Redirect to frontend dashboard
    const redirectUrl = process.env.WEB_ORIGIN || 'http://localhost:5174';
    res.redirect(`${redirectUrl}/dashboard`);
  }
);

// ========== Firebase Phone Auth Routes ==========

const phoneVerifySchema = Joi.object({
  idToken: Joi.string().required(),
  name: Joi.string().min(1).max(255).optional()
});

// Verify Firebase ID token and login/signup user
router.post('/phone/verify', async (req, res) => {
  try {
    const { error, value } = phoneVerifySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { idToken, name } = value;

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error('Firebase token verification failed:', err);
      return res.status(401).json({ error: 'invalid_token' });
    }

    const firebaseUid = decodedToken.uid;
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'phone_number_missing' });
    }

    const conn = await pool.getConnection();
    try {
      // Check if user exists by firebase_uid or phone
      const [rows] = await conn.execute(
        'SELECT id, email, name, phone, firebase_uid, auth_provider FROM owners WHERE firebase_uid = ? OR phone = ?',
        [firebaseUid, phoneNumber]
      );

      let owner;
      if (rows.length > 0) {
        // User exists - update firebase_uid if needed
        owner = rows[0];
        if (!owner.firebase_uid) {
          await conn.execute(
            'UPDATE owners SET firebase_uid = ?, auth_provider = ?, phone = ? WHERE id = ?',
            [firebaseUid, 'phone', phoneNumber, owner.id]
          );
          owner.firebase_uid = firebaseUid;
          owner.auth_provider = 'phone';
          owner.phone = phoneNumber;
        }
      } else {
        // Create new user
        const userName = name || 'Host';
        const [result] = await conn.execute(
          'INSERT INTO owners (firebase_uid, phone, name, auth_provider) VALUES (?, ?, ?, ?)',
          [firebaseUid, phoneNumber, userName, 'phone']
        );
        owner = { 
          id: result.insertId, 
          phone: phoneNumber, 
          name: userName, 
          firebase_uid: firebaseUid, 
          auth_provider: 'phone' 
        };
      }

      // Store user in session
      req.session.owner = {
        id: owner.id,
        email: owner.email || null,
        name: owner.name,
        phone: owner.phone
      };

      return res.json({ owner: req.session.owner });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Phone auth error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
