const { ObjectId } = require('mongodb');
const { getDB } = require('../db-mongodb');

async function ensureAuth(req, res, next) {
  // First, check session-based auth (preferred)
  if (req.session && req.session.owner) {
    return next();
  }
  
  // Fallback: Check for X-User-ID header (for cross-origin scenarios where cookies don't work)
  const userId = req.headers['x-user-id'];
  if (userId) {
    try {
      const db = await getDB();
      const ownersCollection = db.collection('owners');
      const ownerDoc = await ownersCollection.findOne({ _id: new ObjectId(userId) });
      
      if (ownerDoc) {
        // Reconstruct the owner object and attach to session
        req.session.owner = {
          id: ownerDoc._id.toString(),
          email: ownerDoc.email,
          name: ownerDoc.name,
          phone: ownerDoc.phone || '',
          location: ownerDoc.location || '',
          bio: ownerDoc.about || ''
        };
        return next();
      }
    } catch (error) {
      console.error('Error validating X-User-ID header:', error);
    }
  }
  
  return res.status(401).json({ error: 'unauthorized' });
}

module.exports = { ensureAuth };
