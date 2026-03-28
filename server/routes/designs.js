import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed.'));
  }
});

// Get all designs (authenticated users)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM designs';
    const params = [];
    const conditions = [];

    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const designs = db.prepare(query).all(...params);
    res.json(designs);
  } catch (err) {
    console.error('Get designs error:', err);
    res.status(500).json({ error: 'Failed to fetch designs.' });
  }
});

// Get single design
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const design = db.prepare('SELECT * FROM designs WHERE id = ?').get(req.params.id);
    if (!design) {
      return res.status(404).json({ error: 'Design not found.' });
    }
    res.json(design);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch design.' });
  }
});

// Create design (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { title, description, stock, price, category } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ error: 'Title and image are required.' });
    }

    const result = db.prepare(
      'INSERT INTO designs (title, description, image_path, stock, price, category) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      title,
      description || '',
      req.file.filename,
      parseFloat(stock) || 0,
      parseFloat(price) || 0,
      category || 'General'
    );

    const design = db.prepare('SELECT * FROM designs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(design);
  } catch (err) {
    console.error('Create design error:', err);
    res.status(500).json({ error: 'Failed to create design.' });
  }
});

// Update design (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { title, description, stock, price, category } = req.body;
    const design = db.prepare('SELECT * FROM designs WHERE id = ?').get(req.params.id);

    if (!design) {
      return res.status(404).json({ error: 'Design not found.' });
    }

    const imagePath = req.file ? req.file.filename : design.image_path;

    db.prepare(
      'UPDATE designs SET title = ?, description = ?, image_path = ?, stock = ?, price = ?, category = ? WHERE id = ?'
    ).run(
      title || design.title,
      description !== undefined ? description : design.description,
      imagePath,
      stock !== undefined ? parseFloat(stock) : design.stock,
      price !== undefined ? parseFloat(price) : design.price,
      category || design.category,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM designs WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update design error:', err);
    res.status(500).json({ error: 'Failed to update design.' });
  }
});

// Delete design (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const design = db.prepare('SELECT * FROM designs WHERE id = ?').get(req.params.id);
    if (!design) {
      return res.status(404).json({ error: 'Design not found.' });
    }

    // Delete image file
    const imagePath = path.join(uploadsDir, design.image_path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    db.prepare('DELETE FROM designs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Design deleted successfully.' });
  } catch (err) {
    console.error('Delete design error:', err);
    res.status(500).json({ error: 'Failed to delete design.' });
  }
});

// Get categories
router.get('/meta/categories', authenticateToken, (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM designs ORDER BY category').all();
    res.json(categories.map(c => c.category));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

export default router;
