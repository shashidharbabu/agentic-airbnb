const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

// Load Google OAuth config (from project root)
const oauthConfigPath = path.join(__dirname, '../../../../OAuthConfig.json');
const oauthConfig = JSON.parse(fs.readFileSync(oauthConfigPath, 'utf8'));

// Configure Google OAuth Strategy
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

    const conn = await pool.getConnection();
    try {
      // Check if user exists by google_id or email
      const [rows] = await conn.execute(
        'SELECT id, email, name, google_id, auth_provider FROM owners WHERE google_id = ? OR email = ?',
        [googleId, email]
      );

      let owner;
      if (rows.length > 0) {
        // User exists - update google_id if needed
        owner = rows[0];
        if (!owner.google_id) {
          await conn.execute(
            'UPDATE owners SET google_id = ?, auth_provider = ? WHERE id = ?',
            [googleId, 'google', owner.id]
          );
          owner.google_id = googleId;
          owner.auth_provider = 'google';
        }
      } else {
        // Create new user
        const [result] = await conn.execute(
          'INSERT INTO owners (email, google_id, name, auth_provider) VALUES (?, ?, ?, ?)',
          [email, googleId, name, 'google']
        );
        owner = { id: result.insertId, email, name, google_id: googleId, auth_provider: 'google' };
      }

      return done(null, owner);
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}
));

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id, email, name, google_id, auth_provider FROM owners WHERE id = ?',
        [id]
      );
      if (rows.length > 0) {
        done(null, rows[0]);
      } else {
        done(new Error('User not found'), null);
      }
    } finally {
      conn.release();
    }
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

