import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jmt-makrana-transport-secret-key-2026';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id?.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      companyName: user.companyName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.get('x-access-token');
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || req.get('x-access-token');
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // Ignore token failure for optional endpoints
    }
  }
  next();
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required for this action.' });
  }
  next();
}

export default {
  generateToken,
  authMiddleware,
  optionalAuth,
  adminOnly,
};
