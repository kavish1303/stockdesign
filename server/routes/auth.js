import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'kevi-fabric-default-secret-2026';

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // First user gets admin role
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const role = userCount.count === 0 ? 'admin' : 'customer';
    const approved = role === 'admin' ? 1 : 0;

    const result = db.prepare(
      'INSERT INTO users (name, email, password, role, approved) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, hashedPassword, role, approved);

    if (!approved) {
      // Customer needs admin approval — don't issue a token
      return res.status(201).json({
        pending: true,
        message: 'Account created! Please wait for admin approval before you can log in.'
      });
    }

    const user = { id: result.lastInsertRowid, name, email, role, approved };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.approved) {
      return res.status(403).json({ error: 'Your account is pending admin approval. Please try again later.' });
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, approved: user.approved };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: payload, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, approved, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json(user);
});

export default router;
