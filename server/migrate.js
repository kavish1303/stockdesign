import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'database.sqlite'));

// Add approved column if it doesn't exist
try {
  db.exec('ALTER TABLE users ADD COLUMN approved INTEGER DEFAULT 0');
  console.log('✅ Added approved column to users table');
} catch (e) {
  console.log('ℹ️  Column already exists:', e.message);
}

// Auto-approve admin users
db.exec("UPDATE users SET approved = 1 WHERE role = 'admin'");
console.log('✅ Admin users auto-approved');

// Set existing customer@test.com to NOT approved (for testing)
db.exec("UPDATE users SET approved = 0 WHERE role = 'customer'");
console.log('✅ Customer accounts set to pending approval');

// Show current users
const users = db.prepare('SELECT id, name, email, role, approved FROM users').all();
console.log('\nCurrent users:');
users.forEach(u => {
  console.log(`  ${u.id}: ${u.name} (${u.email}) - ${u.role} - ${u.approved ? 'APPROVED' : 'PENDING'}`);
});

db.close();
