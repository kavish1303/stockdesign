import express from 'express';
import db from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin dashboard stats
router.get('/dashboard', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalDesigns = db.prepare('SELECT COUNT(*) as count FROM designs').get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('customer').count;
    const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('pending').count;

    const totalRevenue = db.prepare(
      'SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status != ?'
    ).get('cancelled').total;

    // Low stock designs (< 5 pieces)
    const lowStockDesigns = db.prepare(
      'SELECT * FROM designs WHERE stock < 5 ORDER BY stock ASC'
    ).all();

    // Most in-demand designs (most ordered)
    const topDesigns = db.prepare(`
      SELECT d.id, d.title, d.image_path, d.stock, d.price,
             COALESCE(SUM(o.quantity), 0) as total_ordered,
             COUNT(o.id) as order_count
      FROM designs d
      LEFT JOIN orders o ON d.id = o.design_id AND o.status != 'cancelled'
      GROUP BY d.id
      ORDER BY total_ordered DESC
      LIMIT 10
    `).all();

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, d.title as design_title, d.image_path as design_image, 
             u.name as user_name, u.email as user_email
      FROM orders o
      JOIN designs d ON o.design_id = d.id
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();

    // Orders by status
    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `).all();

    // Stock overview
    const totalStock = db.prepare('SELECT COALESCE(SUM(stock), 0) as total FROM designs').get().total;
    const outOfStock = db.prepare('SELECT COUNT(*) as count FROM designs WHERE stock = 0').get().count;

    res.json({
      stats: {
        totalDesigns,
        totalOrders,
        totalUsers,
        pendingOrders,
        totalRevenue,
        totalStock,
        outOfStock
      },
      lowStockDesigns,
      topDesigns,
      recentOrders,
      ordersByStatus
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(
      'SELECT id, name, email, role, approved, created_at FROM users ORDER BY created_at DESC'
    ).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Get pending users (admin only)
router.get('/users/pending', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(
      'SELECT id, name, email, role, approved, created_at FROM users WHERE approved = 0 ORDER BY created_at DESC'
    ).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending users.' });
  }
});

// Approve a user (admin only)
router.put('/users/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    db.prepare('UPDATE users SET approved = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: `User ${user.name} has been approved.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve user.' });
  }
});

// Reject (delete) a user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete an admin user.' });
    }
    // Delete user's orders first
    db.prepare('DELETE FROM orders WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: `User ${user.name} has been rejected and removed.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject user.' });
  }
});

export default router;
