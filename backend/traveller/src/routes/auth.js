const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database-mongodb');

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
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase().trim();
    const name = value.name.trim();
    const passwordHash = await bcrypt.hash(value.password, 10);

    const db = await getDB();
    const usersCollection = db.collection('users');
    const travelerProfilesCollection = db.collection('traveler_profiles');

    // Check if email exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Insert new user
    const userResult = await usersCollection.insertOne({
      email,
      password_hash: passwordHash,
      name,
      role: 'TRAVELER',
      created_at: new Date(),
      updated_at: new Date()
    });

    const userId = userResult.insertedId;

    // Create traveler profile
    await travelerProfilesCollection.insertOne({
      traveler_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    });

    const traveler = {
      id: userId.toString(),
      email: email,
      name: name,
      role: 'TRAVELER'
    };

    req.session.traveler = traveler;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      return res.status(201).json({ 
        message: 'Traveler created successfully',
        traveler: traveler
      });
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('🔐 [Traveller Login] Incoming login request body:', {
      email: req.body?.email,
      hasPassword: !!req.body?.password
    });

    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      console.warn('🔐 [Traveller Login] Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase().trim();
    console.log('🔐 [Traveller Login] Normalized email:', email);

    const db = await getDB();
    const usersCollection = db.collection('users');

    const userDoc = await usersCollection.findOne({ email, role: 'TRAVELER' });
    if (!userDoc) {
      console.warn('🔐 [Traveller Login] No TRAVELER user found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔐 [Traveller Login] Found user, checking password. User ID:', userDoc._id.toString());
    const isValidPassword = await bcrypt.compare(value.password, userDoc.password_hash);
    if (!isValidPassword) {
      console.warn('🔐 [Traveller Login] Invalid password for user ID:', userDoc._id.toString());
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const traveler = {
      id: userDoc._id.toString(),
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role
    };

    console.log('🔐 [Traveller Login] Authenticated traveler, saving session. Traveler:', traveler);
    req.session.traveler = traveler;
    req.session.save((err) => {
      if (err) {
        console.error('🔐 [Traveller Login] Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      console.log('🔐 [Traveller Login] Session saved successfully. Session ID:', req.sessionID);
      return res.json({ 
        message: 'Login successful',
        traveler: traveler
      });
    });
  } catch (error) {
    console.error('🔐 [Traveller Login] Unexpected login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    
    res.clearCookie('airbnb_traveller.sid');
    return res.json({ message: 'Logout successful' });
  });
});

router.get('/me', (req, res) => {
  const traveler = req.session.traveler || null;
  return res.json({ traveler });
});

router.get('/check', (req, res) => {
  const isAuthenticated = !!(req.session && req.session.traveler);
  return res.json({ 
    authenticated: isAuthenticated,
    traveler: req.session.traveler || null
  });
});

module.exports = router;
