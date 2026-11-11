const express = require('express');
const router = express.Router();
const userStore = require('server/src/db/userStore');
const { signToken, requireAuth, requireRole } = require('server/src/middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'uhi-admin-secret-2026';

function validateRegister({ name, email, password }) {
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 80) {
    return 'Name must be 2-80 characters';
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 120) {
    return 'A valid email is required';
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 100) {
    return 'Password must be 8-100 characters';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return null;
}

// POST /api/auth/register (supports admin creation via adminSecret)
router.post('/register', async (req, res) => {
  try {
    const error = validateRegister(req.body || {});
    if (error) return res.status(400).json({ success: false, error });

    const role = (req.body.adminSecret && req.body.adminSecret === ADMIN_SECRET) ? 'admin' : 'citizen';

    const user = await userStore.createUser({
      name: req.body.name.trim(),
      email: req.body.email,
      password: req.body.password,
      role
    });
    res.status(201).json({ success: true, token: signToken(user), user: userStore.publicUser(user) });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    const user = userStore.findByEmail(email);
    const ok = user && (await userStore.verifyPassword(user, password));
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid email or password' });
    res.json({ success: true, token: signToken(user), user: userStore.publicUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// GET /api/auth/users (admin only)
router.get('/users', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ success: true, data: userStore.listUsers() });
});

module.exports = router;
