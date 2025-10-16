function ensureAuth(req, res, next) {
  if (req.session && req.session.owner) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

module.exports = { ensureAuth };
