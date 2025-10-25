const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { pool } = require('../config/database');

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

    const conn = await pool.getConnection();
    try {
      const [existingUsers] = await conn.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      const [result] = await conn.execute(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [email, passwordHash, name, 'TRAVELER']
      );

      const userId = result.insertId;

      await conn.execute(
        'INSERT INTO traveler_profiles (traveler_id) VALUES (?)',
        [userId]
      );

      const traveler = {
        id: userId,
        email: email,
        name: name,
        role: 'TRAVELER'
      };

      req.session.traveler = traveler;
      
      return res.status(201).json({ 
        message: 'Traveler created successfully',
        traveler: traveler
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase().trim();

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id, email, name, password_hash, role FROM users WHERE email = ? AND role = ?',
        [email, 'TRAVELER']
      );
      
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = rows[0];
      const isValidPassword = await bcrypt.compare(value.password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const traveler = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      req.session.traveler = traveler;
      
      return res.json({ 
        message: 'Login successful',
        traveler: traveler
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Login error:', error);
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
