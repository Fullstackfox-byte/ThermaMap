/**
 * Embedded user store with pre-seeded role-based accounts (Admin & Citizen).
 * Supports seamless swap for a Mongoose User model when MongoDB is connected.
 */
const bcrypt = require('bcryptjs');

const users = new Map(); // email -> user

function publicUser(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

function generateId(prefix = 'usr') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser({ name, email, password, role = 'citizen' }) {
  const key = String(email || '').trim().toLowerCase();
  if (users.has(key)) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: generateId('usr'),
    name: String(name || '').trim(),
    email: key,
    passwordHash,
    role: role === 'admin' ? 'admin' : 'citizen',
    createdAt: new Date().toISOString()
  };
  users.set(key, user);
  return user;
}

function findByEmail(email) {
  return users.get(String(email || '').trim().toLowerCase()) || null;
}

function findById(id) {
  for (const u of users.values()) {
    if (u.id === id) return u;
  }
  return null;
}

function listUsers() {
  return [...users.values()].map(publicUser);
}

async function verifyPassword(user, password) {
  if (!user || !user.passwordHash || !password) return false;
  return bcrypt.compare(password, user.passwordHash);
}

// Pre-seed default Admin & Citizen accounts for immediate Viva / Defense testing
async function seedDefaultUsers() {
  try {
    if (!users.has('admin@aurauhi.gov')) {
      const adminHash = await bcrypt.hash('Admin@12345', 12);
      users.set('admin@aurauhi.gov', {
        id: 'usr-admin-default',
        name: 'Municipal Climate Administrator',
        email: 'admin@aurauhi.gov',
        passwordHash: adminHash,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
    }

    if (!users.has('citizen@aurauhi.gov')) {
      const citizenHash = await bcrypt.hash('Citizen@12345', 12);
      users.set('citizen@aurauhi.gov', {
        id: 'usr-citizen-default',
        name: 'Civic Environmentalist',
        email: 'citizen@aurauhi.gov',
        passwordHash: citizenHash,
        role: 'citizen',
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('[UserStore] Error seeding default users:', err.message);
  }
}

seedDefaultUsers();

module.exports = {
  createUser,
  findByEmail,
  findById,
  listUsers,
  verifyPassword,
  publicUser,
  generateId
};
