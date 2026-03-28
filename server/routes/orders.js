import express from 'express';
import db from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Place an order
router.post('/', authenticateToken, (req, res) => {
  try {
    const { design_id, quantity, notes } = req.body;

    if (!design_id || !quantity || quantity < 0.1) {
      return res.status(400).json({ error: 'Design ID and valid quantity (min 0.1 kg) are required.' });
    }

    const design = db.prepare('SELECT * FROM designs WHERE id = ?').get(design_id);
    if (!design) {
      return res.status(404).json({ error: 'Design not found.' });
    }

    if (design.stock < quantity) {
      return res.status(400).json({ 
        error: `Insufficient stock. Only ${design.stock} kg available.` 
      });
    }

    const totalPrice = design.price * quantity;

    // Use transaction for atomic stock decrease + order creation
    const placeOrder = db.transaction(() => {
      db.prepare('UPDATE designs SET stock = stock - ? WHERE id = ?').run(quantity, design_id);
      
      const result = db.prepare(
        'INSERT INTO orders (user_id, design_id, quantity, total_price, notes) VALUES (?, ?, ?, ?, ?)'
      ).run(req.user.id, design_id, quantity, totalPrice, notes || '');

      return result.lastInsertRowid;
    });

    const orderId = placeOrder();

    const order = db.prepare(`
      SELECT o.*, d.title as design_title, d.image_path as design_image, u.name as user_name
      FROM orders o
      JOIN designs d ON o.design_id = d.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(orderId);

    res.status(201).json(order);
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

// Get orders (user sees own, admin sees all)
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT o.*, d.title as design_title, d.image_path as design_image, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN designs d ON o.design_id = d.id
      JOIN users u ON o.user_id = u.id
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' WHERE o.user_id = ?';
      params.push(req.user.id);
    }

    const { status } = req.query;
    if (status && status !== 'all') {
      query += params.length > 0 ? ' AND' : ' WHERE';
      query += ' o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // If cancelling, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      db.prepare('UPDATE designs SET stock = stock + ? WHERE id = ?').run(order.quantity, order.design_id);
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

    const updated = db.prepare(`
      SELECT o.*, d.title as design_title, d.image_path as design_image, u.name as user_name
      FROM orders o
      JOIN designs d ON o.design_id = d.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

export default router;
