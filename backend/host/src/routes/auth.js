const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { pool } = require('../db');
const passport = require('../middleware/passport');
const admin = require('../middleware/firebase');

const router = express.Router();

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  name: Joi.string().min(1).max(255).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required()
});

router.post('/signup', async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const email = value.email.toLowerCase().trim();
    const name = value.name.trim();
    const passwordHash = await bcrypt.hash(value.password, 10);

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute('SELECT id FROM owners WHERE email = :email', { email });
      if (rows.length > 0) return res.status(409).json({ error: 'email_in_use' });

      const [result] = await conn.execute(
        'INSERT INTO owners (email, password_hash, name) VALUES (:email, :password_hash, :name)',
        { email, password_hash: passwordHash, name }
      );

      const owner = { id: result.insertId, email, name };
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
      const [rows] = await conn.execute('SELECT id, email, name, password_hash FROM owners WHERE email = :email', { email });
      if (rows.length === 0) return res.status(401).json({ error: 'invalid_credentials' });
      const row = rows[0];
      const ok = await bcrypt.compare(value.password, row.password_hash);
      if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

      const owner = { id: row.id, email: row.email, name: row.name };
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

router.post('/logout', async (req, res) => {
  try {
    req.session.destroy(() => {
      res.clearCookie('airbnb_host.sid');
      return res.json({ ok: true });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/me', (req, res) => {
  // Support both Passport user and session owner
  const owner = req.user || req.session.owner || null;
  return res.json({ owner });
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
