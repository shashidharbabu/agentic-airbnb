function ensureAuth(req, res, next) {
  if (req.session && req.session.traveler) {
    return next();
  }
  return res.status(401).json({ error: 'unauthorized' });
}

function optionalAuth(req, res, next) {
  next();
}

module.exports = { ensureAuth, optionalAuth };
