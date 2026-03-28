import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_path TEXT NOT NULL,
    stock REAL NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'General',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    design_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    total_price REAL NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (design_id) REFERENCES designs(id)
  );
`);

// Create admin user
const hashedPassword = bcrypt.hashSync('admin123', 10);
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@kevi.com');
if (!existingAdmin) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin User', 'admin@kevi.com', hashedPassword, 'admin'
  );
  console.log('✅ Admin user created (admin@kevi.com / admin123)');
}

// Uploads dir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Image files in the root project folder
const projectRoot = path.join(__dirname, '..');
const imageFiles = fs.readdirSync(projectRoot)
  .filter(f => f.startsWith('WhatsApp Image') && (f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png')))
  .sort();

console.log(`\nFound ${imageFiles.length} design images to upload.\n`);

// Design names based on visual inspection of the images (ordered by timestamp)
const designData = [
  {
    title: 'Blossom Mauve',
    description: 'Delicate scattered floral motifs on a soft mauve base. Pastel-toned flowers with mint green stems create a gentle, feminine aesthetic.',
    category: 'Printed',
  },
  {
    title: 'Indigo Leaf Branch',
    description: 'Minimalist white leaf branch pattern on a deep navy-blue fabric. Clean botanical design with a contemporary feel.',
    category: 'Printed',
  },
  {
    title: 'Dark Forest Leaf',
    description: 'Dense scattered leaf pattern in white and grey on a charcoal base. Bold botanical print with a sophisticated monochrome palette.',
    category: 'Printed',
  },
  {
    title: 'Midnight Tree Circle',
    description: 'Artistic circular tree motifs with coral and sage accents on a dark charcoal background. Whimsical and modern design.',
    category: 'Printed',
  },
  {
    title: 'Rainbow Shell Navy',
    description: 'Vibrant multicolored seashell pattern on navy blue base. Playful mix of pink, yellow, blue, and white shell motifs in two colorways.',
    category: 'Printed',
  },
  {
    title: 'Olive Abstract Cut',
    description: 'Bold abstract cutout shapes in olive green, charcoal, and white. Large-scale contemporary design with strong visual impact.',
    category: 'Printed',
  },
  {
    title: 'Plum Seashell Coast',
    description: 'Coastal-themed pattern featuring seashells, starfish, and conch motifs in white on a rich plum-purple background.',
    category: 'Printed',
  },
  {
    title: 'Lilac Fruit Garden',
    description: 'Charming fruit illustrations — pears, apples, and berries — in pastel blue, yellow, and pink on a muted lavender-mauve base.',
    category: 'Printed',
  },
  {
    title: 'Navy Floral Circle Duo',
    description: 'Elegant circular floral wreath motifs in two colourways — navy with pink accents and black with gold accents. Features delicate flowers and leaves within brush-stroke circles.',
    category: 'Printed',
  },
  {
    title: 'Retro Geo Honeycomb',
    description: 'Retro-inspired geometric pattern with honeycomb rectangles in pink and gold on a black background. Features sweeping accent curves for dynamic movement.',
    category: 'Printed',
  },
];

// Copy images and create DB entries
const insertDesign = db.prepare(
  'INSERT INTO designs (title, description, image_path, stock, price, category) VALUES (?, ?, ?, ?, ?, ?)'
);

const seedAll = db.transaction(() => {
  // Clear existing designs
  db.exec('DELETE FROM designs');
  db.exec('DELETE FROM orders');

  for (let i = 0; i < imageFiles.length; i++) {
    const srcFile = path.join(projectRoot, imageFiles[i]);
    const ext = path.extname(imageFiles[i]);
    const destFilename = `design_${Date.now()}_${i}${ext}`;
    const destFile = path.join(uploadsDir, destFilename);

    // Copy image to uploads
    fs.copyFileSync(srcFile, destFile);

    const design = designData[i] || {
      title: `Design ${i + 1}`,
      description: 'Beautiful fabric pattern',
      category: 'General',
    };

    insertDesign.run(
      design.title,
      design.description,
      destFilename,
      10, // 10 kg stock for each
      0,  // Price is 0 (non-mandatory, set later)
      design.category
    );

    console.log(`  ✅ Uploaded: ${design.title} (10 kg, ${design.category})`);
  }
});

seedAll();

console.log(`\n🎉 Successfully seeded ${imageFiles.length} designs with 10 kg stock each!`);
console.log('📝 No price set — admin can add prices later.\n');

db.close();
