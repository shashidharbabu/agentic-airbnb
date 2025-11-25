const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { ObjectId } = require('mongodb');
const { getDB } = require('../db-mongodb');
const fs = require('fs');
const path = require('path');

// Load Google OAuth config (from project root) - optional
let oauthConfig = null;
const oauthConfigPath = path.join(__dirname, '../../../../OAuthConfig.json');
try {
  if (fs.existsSync(oauthConfigPath)) {
    oauthConfig = JSON.parse(fs.readFileSync(oauthConfigPath, 'utf8'));
  }
} catch (error) {
  console.warn('OAuthConfig.json not found or invalid. OAuth will be disabled.');
}

// Configure Google OAuth Strategy (only if config exists)
if (oauthConfig && oauthConfig.web) {
  passport.use(new GoogleStrategy({
    clientID: oauthConfig.web.client_id,
    clientSecret: oauthConfig.web.client_secret,
    callbackURL: oauthConfig.web.redirect_uris[0],
    passReqToCallback: true
  },
async (req, accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;

    const db = await getDB();
    const ownersCollection = db.collection('owners');

    // Check if user exists by google_id or email
    let ownerDoc = await ownersCollection.findOne({
      $or: [
        { google_id: googleId },
        { email: email }
      ]
    });

    let owner;
    if (ownerDoc) {
      // User exists - update google_id if needed
      if (!ownerDoc.google_id) {
        await ownersCollection.updateOne(
          { _id: ownerDoc._id },
          { $set: { google_id: googleId, auth_provider: 'google', updated_at: new Date() } }
        );
        ownerDoc.google_id = googleId;
        ownerDoc.auth_provider = 'google';
      }
      owner = {
        id: ownerDoc._id.toString(),
        email: ownerDoc.email,
        name: ownerDoc.name,
        google_id: ownerDoc.google_id,
        auth_provider: ownerDoc.auth_provider
      };
    } else {
      // Create new user
      const result = await ownersCollection.insertOne({
        email,
        google_id: googleId,
        name,
        auth_provider: 'google',
        created_at: new Date(),
        updated_at: new Date()
      });
      owner = {
        id: result.insertedId.toString(),
        email,
        name,
        google_id: googleId,
        auth_provider: 'google'
      };
    }

    return done(null, owner);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}
  ));
} else {
  console.warn('Google OAuth not configured. OAuth endpoints will not work.');
}

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const db = await getDB();
    const ownersCollection = db.collection('owners');

    const ownerDoc = await ownersCollection.findOne({ _id: new ObjectId(id) });
    if (ownerDoc) {
      done(null, {
        id: ownerDoc._id.toString(),
        email: ownerDoc.email,
        name: ownerDoc.name,
        google_id: ownerDoc.google_id,
        auth_provider: ownerDoc.auth_provider
      });
    } else {
      done(new Error('User not found'), null);
    }
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

