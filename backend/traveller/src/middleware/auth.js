const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database-mongodb');

async function ensureAuth(req, res, next) {
  console.log('[ensureAuth] Checking authentication');
  console.log('[ensureAuth] Session exists:', !!req.session);
  console.log('[ensureAuth] Session traveler:', req.session?.traveler ? 'exists' : 'missing');
  console.log('[ensureAuth] Cookies:', req.headers.cookie);
  
  if (req.session && req.session.traveler) {
    console.log('[ensureAuth] Authenticated, traveler ID:', req.session.traveler.id);
    return next();
  }
  
  // Fallback: Check for x-user-id header (for cross-origin cookie issues)
  const userIdFromHeader = req.headers['x-user-id'];
  if (userIdFromHeader) {
    try {
      const db = await getDB();
      const travelersCollection = db.collection('travelers');
      const travelerDoc = await travelersCollection.findOne({ _id: new ObjectId(userIdFromHeader) });
      
      if (travelerDoc) {
        req.session.traveler = {
          id: travelerDoc._id.toString(),
          email: travelerDoc.email,
          name: travelerDoc.name,
          phone: travelerDoc.phone || '',
          about_me: travelerDoc.about_me || '',
          city: travelerDoc.city || '',
          country: travelerDoc.country || '',
          profile_picture_url: travelerDoc.profile_picture_url || null
        };
        await req.session.save();
        console.log('[ensureAuth] Authenticated via X-User-Id header, traveler ID:', travelerDoc._id.toString());
        return next();
      }
    } catch (e) {
      console.error('[ensureAuth] Error fetching traveler from header ID:', e);
    }
  }
  
  console.log('[ensureAuth] Unauthorized - no session or traveler');
  return res.status(401).json({ error: 'Unauthorized - Please log in to continue' });
}

function optionalAuth(req, res, next) {
  next();
}

module.exports = { ensureAuth, optionalAuth };
