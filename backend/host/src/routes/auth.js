const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db-mongodb');
const passport = require('../middleware/passport');
const admin = require('../middleware/firebase');
const { ensureAuth } = require('../middleware/auth');
const { uploadProfilePicture } = require('../middleware/upload');

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
  email: Joi.string().email().allow(null, '').optional(),
  phone: Joi.string().min(7).max(20).required(),
  location: Joi.string().min(2).max(255).required(),
  bio: Joi.string().max(1000).allow('').optional()
});

router.post('/signup', async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      console.error('Signup validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    const email = value.email.toLowerCase().trim();
    const name = value.name.trim();
    const phone = value.phone.trim();
    const location = value.location.trim();
    console.log('Signup attempt for email:', email);

    let db;
    try {
      db = await getDB();
    } catch (dbError) {
      console.error('Database connection error during signup:', dbError);
      return res.status(500).json({ error: 'database_connection_failed' });
    }

    const passwordHash = await bcrypt.hash(value.password, 10);
    const ownersCollection = db.collection('owners');

    // Check if email exists
    const existingEmail = await ownersCollection.findOne({ email });
    if (existingEmail) {
      console.log('Signup failed: Email already exists:', email);
      return res.status(409).json({ error: 'email_in_use' });
    }

    // Check if phone exists
    const existingPhone = await ownersCollection.findOne({ phone });
    if (existingPhone) {
      console.log('Signup failed: Phone already exists:', phone);
      return res.status(409).json({ error: 'phone_in_use' });
    }

    // Insert new owner
    const result = await ownersCollection.insertOne({
      email,
      password_hash: passwordHash,
      name,
      phone,
      location,
      about: '',
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('User created successfully, ID:', result.insertedId);

    const owner = {
      id: result.insertedId.toString(),
      email,
      name,
      phone,
      location,
      bio: ''
    };
    
    console.log('Setting session for new user:', owner.email);
    
    // Set session and explicitly save
    req.session.owner = owner;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error during signup:', err);
        return res.status(500).json({ error: 'session_save_failed', details: err.message });
      }
      console.log('Session saved successfully for new user:', owner.email);
      return res.json({ owner });
    });
  } catch (e) {
    console.error('Signup error:', e);
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      console.error('Login validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    const email = value.email.toLowerCase().trim();
    console.log('Login attempt for email:', email);

    let db;
    try {
      db = await getDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ error: 'database_connection_failed' });
    }

    const ownersCollection = db.collection('owners');

    const ownerDoc = await ownersCollection.findOne({ email });
    if (!ownerDoc) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    
    console.log('Owner found in MongoDB:');
    console.log('  _id:', ownerDoc._id.toString());
    console.log('  email:', ownerDoc.email);
    console.log('  name:', ownerDoc.name);

    if (!ownerDoc.password_hash) {
      console.log('Login failed: No password hash for user:', email);
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const ok = await bcrypt.compare(value.password, ownerDoc.password_hash);
    if (!ok) {
      console.log('Login failed: Invalid password for email:', email);
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const owner = {
      id: ownerDoc._id.toString(),
      email: ownerDoc.email,
      name: ownerDoc.name,
      phone: ownerDoc.phone || '',
      location: ownerDoc.location || '',
      bio: ownerDoc.about || ''
    };
    
    console.log('Login successful for user:', owner.email);
    console.log('Session ID before:', req.sessionID);
    console.log('Session store:', req.sessionStore ? 'exists' : 'MISSING');
    
    // Regenerate session to ensure new session ID and proper cookie
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regenerate error:', err);
        return res.status(500).json({ error: 'session_regenerate_failed', details: err.message });
      }
      
      console.log('Session regenerated, new ID:', req.sessionID);
      
      // Set session data
      req.session.owner = owner;
      
      // Save session
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'session_save_failed', details: err.message });
        }
        
        console.log('✅ Session saved successfully');
        console.log('Final session ID:', req.sessionID);
        console.log('Cookie name:', SESSION_COOKIE_NAME);
        
        // Verify session was saved
        if (req.session.owner && req.session.owner.email === owner.email) {
          console.log('✅ Session data verified in memory');
        } else {
          console.error('❌ Session data NOT in memory!');
        }
        
        return res.json({ owner });
      });
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'internal_error', details: e.message });
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

router.get('/me', ensureAuth, async (req, res) => {
  try {
    const ownerId = req.session.owner?.id;
    if (!ownerId) return res.status(401).json({ error: 'unauthorized' });

    const db = await getDB();
    const ownersCollection = db.collection('owners');

    const ownerDoc = await ownersCollection.findOne({ _id: new ObjectId(ownerId) });
    if (!ownerDoc) {
      return res.status(404).json({ error: 'owner_not_found' });
    }

    const owner = {
      id: ownerDoc._id.toString(),
      email: ownerDoc.email,
      name: ownerDoc.name,
      phone: ownerDoc.phone,
      location: ownerDoc.location,
      bio: ownerDoc.about || '',
      avatar_url: ownerDoc.avatar_url || null
    };

    return res.json({ owner });
  } catch (e) {
    console.error('Get /me error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/profile', ensureAuth, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const ownerId = req.session.owner?.id;
    if (!ownerId) return res.status(401).json({ error: 'unauthorized' });

    const name = value.name.trim();
    const email = typeof value.email === 'string' && value.email.trim().length > 0 ? value.email.trim().toLowerCase() : null;
    const phone = value.phone.trim();
    const location = value.location.trim();
    const bio = typeof value.bio === 'string' ? value.bio.trim() : '';

    const db = await getDB();
    const ownersCollection = db.collection('owners');
    const ownerObjectId = new ObjectId(ownerId);

    // Check if phone is in use by another owner
    const existingPhone = await ownersCollection.findOne({ phone, _id: { $ne: ownerObjectId } });
    if (existingPhone) {
      return res.status(409).json({ error: 'phone_in_use' });
    }

    // If email provided, ensure unique among other owners
    if (email) {
      const existingEmail = await ownersCollection.findOne({ email, _id: { $ne: ownerObjectId } });
      if (existingEmail) {
        return res.status(409).json({ error: 'email_in_use' });
      }
    }

    // Build update object
    const updateData = {
      name,
      phone,
      location,
      about: bio,
      updated_at: new Date()
    };
    if (email !== null) {
      updateData.email = email;
    }

    await ownersCollection.updateOne(
      { _id: ownerObjectId },
      { $set: updateData }
    );

    // Fetch updated owner
    const updatedOwnerDoc = await ownersCollection.findOne({ _id: ownerObjectId });

    const updatedOwner = {
      id: updatedOwnerDoc._id.toString(),
      email: updatedOwnerDoc.email,
      name,
      phone,
      location,
      bio,
      avatar_url: updatedOwnerDoc.avatar_url || null
    };

    req.session.owner = updatedOwner;
    return res.json({ owner: updatedOwner });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Upload profile picture
router.post('/profile/picture', ensureAuth, uploadProfilePicture.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ownerId = req.session.owner?.id;
    if (!ownerId) return res.status(401).json({ error: 'unauthorized' });

    const avatarUrl = `/uploads/profile-pictures/${req.file.filename}`;

    const db = await getDB();
    const ownersCollection = db.collection('owners');

    await ownersCollection.updateOne(
      { _id: new ObjectId(ownerId) },
      { $set: { avatar_url: avatarUrl, updated_at: new Date() } }
    );

    // Update session
    if (req.session.owner) {
      req.session.owner.avatar_url = avatarUrl;
    }

    return res.json({ 
      message: 'Profile picture uploaded successfully',
      avatar_url: avatarUrl
    });
  } catch (e) {
    console.error('Upload profile picture error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Delete profile picture
router.delete('/profile/picture', ensureAuth, async (req, res) => {
  try {
    const ownerId = req.session.owner?.id;
    if (!ownerId) return res.status(401).json({ error: 'unauthorized' });

    const db = await getDB();
    const ownersCollection = db.collection('owners');

    await ownersCollection.updateOne(
      { _id: new ObjectId(ownerId) },
      { $set: { avatar_url: null, updated_at: new Date() } }
    );

    // Update session
    if (req.session.owner) {
      req.session.owner.avatar_url = null;
    }

    return res.json({ message: 'Profile picture deleted successfully' });
  } catch (e) {
    console.error('Delete profile picture error:', e);
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
    const owner = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      phone: req.user.phone || '',
      location: req.user.location || '',
      bio: req.user.bio || ''
    };
    
    req.session.owner = owner;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        const redirectUrl = process.env.WEB_ORIGIN || 'http://localhost:5174';
        return res.redirect(`${redirectUrl}/login?error=session_error`);
      }
      // Redirect to frontend dashboard
      const redirectUrl = process.env.WEB_ORIGIN || 'http://localhost:5174';
      res.redirect(`${redirectUrl}/dashboard`);
    });
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
      if (!admin.isInitialized) {
        return res.status(503).json({ error: 'Firebase authentication is not configured' });
      }
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

    const db = await getDB();
    const ownersCollection = db.collection('owners');

    // Check if user exists by firebase_uid or phone
    let ownerDoc = await ownersCollection.findOne({
      $or: [
        { firebase_uid: firebaseUid },
        { phone: phoneNumber }
      ]
    });

    if (ownerDoc) {
      // User exists - update firebase_uid if needed
      if (!ownerDoc.firebase_uid) {
        await ownersCollection.updateOne(
          { _id: ownerDoc._id },
          { $set: { firebase_uid: firebaseUid, auth_provider: 'phone', phone: phoneNumber, updated_at: new Date() } }
        );
        ownerDoc.firebase_uid = firebaseUid;
        ownerDoc.auth_provider = 'phone';
        ownerDoc.phone = phoneNumber;
      }
    } else {
      // Create new user
      const userName = name || 'Host';
      const result = await ownersCollection.insertOne({
        firebase_uid: firebaseUid,
        phone: phoneNumber,
        name: userName,
        auth_provider: 'phone',
        created_at: new Date(),
        updated_at: new Date()
      });
      ownerDoc = {
        _id: result.insertedId,
        phone: phoneNumber,
        name: userName,
        firebase_uid: firebaseUid,
        auth_provider: 'phone'
      };
    }

    // Store user in session
    const owner = {
      id: ownerDoc._id.toString(),
      email: ownerDoc.email || null,
      name: ownerDoc.name,
      phone: ownerDoc.phone,
      location: ownerDoc.location || '',
      bio: ownerDoc.about || ''
    };
    
    req.session.owner = owner;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'internal_error' });
      }
      return res.json({ owner });
    });
  } catch (e) {
    console.error('Phone auth error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
