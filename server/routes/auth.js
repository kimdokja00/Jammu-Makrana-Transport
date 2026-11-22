import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { connectDb, isDbConfigured } from '../lib/db.js';
import User from '../models/User.js';
import { generateToken, authMiddleware } from '../lib/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory fallback if MongoDB Atlas is not yet connected
const memoryUsers = globalThis.__jmtUsers || (globalThis.__jmtUsers = []);

/**
 * POST /api/auth/register
 * Body: { fullName, email, phone, password, companyName? }
 * Role is strictly locked to 'customer'
 */
router.post('/register', async (req, res) => {
  const { fullName, email, phone, password, companyName } = req.body ?? {};

  const errors = {};
  if (!fullName?.trim()) errors.fullName = 'Full name is required';
  if (!phone?.trim()) errors.phone = 'Phone number is required';
  if (!email?.trim() || !EMAIL_RE.test(email.trim())) errors.email = 'A valid email is required';
  if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (isDbConfigured()) {
      try {
        await connectDb();
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const user = await User.create({
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          password, // Pre-save hook hashes it
          companyName: companyName?.trim() || '',
          role: 'customer',
        });

        const token = generateToken(user);
        return res.status(201).json({
          token,
          user: {
            id: user.id || user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            companyName: user.companyName,
            role: user.role,
          },
        });
      } catch (dbErr) {
        console.warn('[auth/register] MongoDB connect failed, using memory fallback:', dbErr.message);
      }
    }

    // Memory fallback
    const existsInMemory = memoryUsers.find((u) => u.email === cleanEmail);
    if (existsInMemory) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const memoryUser = {
      id: `local-user-${memoryUsers.length + 1}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password: hashedPassword,
      companyName: companyName?.trim() || '',
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
    memoryUsers.push(memoryUser);

    const token = generateToken(memoryUser);
    return res.status(201).json({
      token,
      user: {
        id: memoryUser.id,
        fullName: memoryUser.fullName,
        email: memoryUser.email,
        phone: memoryUser.phone,
        companyName: memoryUser.companyName,
        role: memoryUser.role,
      },
    });
  } catch (err) {
    console.error('[auth/register] Error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (isDbConfigured()) {
      try {
        await connectDb();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.isActive === false) {
          return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user);
        return res.json({
          token,
          user: {
            id: user.id || user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            companyName: user.companyName,
            role: user.role,
          },
        });
      } catch (dbErr) {
        console.warn('[auth/login] MongoDB connect failed, using memory fallback:', dbErr.message);
      }
    }

    // Memory fallback
    let user = memoryUsers.find((u) => u.email === cleanEmail);

    // Provide default memory admin if credentials match
    if (!user && cleanEmail === 'admin@jmtransport.com' && password === 'Admin@1985') {
      user = {
        id: 'local-admin-1',
        fullName: 'Ramakishan Prajapat (Admin)',
        email: cleanEmail,
        phone: '9829575967',
        role: 'admin',
        companyName: 'Jammu Makrana Transport Co.',
      };
      memoryUsers.push(user);
      const token = generateToken(user);
      return res.json({ token, user });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        companyName: user.companyName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[auth/login] Error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * POST /api/auth/google
 * Body: { credential }
 * Google Identity Services ID Token (JWT)
 */
router.post('/google', async (req, res) => {
  const { credential } = req.body ?? {};

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required' });
  }

  let googleUser;

  // Support demo / test credential when developing without real Google OAuth credentials
  if (credential === 'demo-google-token' || credential.startsWith('demo-google:')) {
    const demoEmail = credential.startsWith('demo-google:')
      ? credential.split('demo-google:')[1].trim().toLowerCase()
      : 'demo.customer@gmail.com';
    googleUser = {
      sub: `demo-google-${Date.now()}`,
      email: demoEmail,
      name: 'Google Customer',
      picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    };
  } else {
    try {
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
      const googleRes = await fetch(verifyUrl);
      if (!googleRes.ok) {
        const errBody = await googleRes.json().catch(() => ({}));
        return res.status(401).json({
          error: 'Invalid Google credential',
          details: errBody.error_description || 'Token verification failed',
        });
      }
      googleUser = await googleRes.json();
    } catch (netErr) {
      console.error('[auth/google] Failed to verify token with Google:', netErr);
      return res.status(503).json({ error: 'Google authentication service unreachable' });
    }
  }

  const {
    sub: googleId,
    email,
    name: fullName,
    picture: avatar,
  } = googleUser;

  if (!email) {
    return res.status(400).json({ error: 'Google account did not provide an email address' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (isDbConfigured()) {
      try {
        await connectDb();
        let user = await User.findOne({
          $or: [{ googleId }, { email: cleanEmail }],
        });

        if (user) {
          if (user.isActive === false) {
            return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
          }
          let dirty = false;
          if (!user.googleId) {
            user.googleId = googleId;
            dirty = true;
          }
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            dirty = true;
          }
          if (dirty) await user.save();
        } else {
          user = await User.create({
            fullName: fullName?.trim() || cleanEmail.split('@')[0],
            email: cleanEmail,
            googleId,
            avatar: avatar || '',
            phone: '',
            role: 'customer',
          });
        }

        const token = generateToken(user);
        return res.json({
          token,
          user: {
            id: user.id || user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || '',
            companyName: user.companyName || '',
            role: user.role,
            avatar: user.avatar || '',
          },
        });
      } catch (dbErr) {
        console.warn('[auth/google] MongoDB error, falling back to memory:', dbErr.message);
      }
    }

    // Memory fallback
    let user = memoryUsers.find((u) => u.googleId === googleId || u.email === cleanEmail);
    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && avatar) user.avatar = avatar;
    } else {
      user = {
        id: `local-google-user-${memoryUsers.length + 1}`,
        fullName: fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
        googleId,
        avatar: avatar || '',
        phone: '',
        role: 'customer',
        companyName: '',
      };
      memoryUsers.push(user);
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        companyName: user.companyName || '',
        role: user.role,
        avatar: user.avatar || '',
      },
    });
  } catch (err) {
    console.error('[auth/google] Error:', err);
    return res.status(500).json({ error: 'Google sign-in failed. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 * Protected: returns current user details
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (isDbConfigured()) {
      await connectDb();
      const user = await User.findById(req.user.id).lean();
      if (!user) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      return res.json({
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          companyName: user.companyName,
          role: user.role,
          avatar: user.avatar || '',
        },
      });
    }

    // In-memory fallback
    const memUser = memoryUsers.find((u) => u.id === req.user.id || u.email === req.user.email);
    if (!memUser) {
      return res.json({ user: req.user });
    }
    return res.json({
      user: {
        id: memUser.id,
        fullName: memUser.fullName,
        email: memUser.email,
        phone: memUser.phone,
        companyName: memUser.companyName,
        role: memUser.role,
        avatar: memUser.avatar || '',
      },
    });
  } catch (err) {
    console.error('[auth/me] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch user session' });
  }
});

export default router;
