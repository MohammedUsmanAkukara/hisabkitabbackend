import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'hisab-kitab-data')
  : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create local data directory:', err.message);
}

// Initial clean state (no demo business, customers, vendors, or transactions)
const defaultState = {
  users: [],
  customers: [],
  vendors: [],
  transactions: [],
  bills: [],
  settings: {
    businessName: '',
    tagline: '',
    logoType: 'initials',
    customLogoUrl: '',
    initialsBgColor: '#1e3a8a',
    initialsTextColor: '#ffffff',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    upiId: '',
    paymentQrUrl: '',
    currencySymbol: '₹',
    terms: '',
    require2FA: false,
    nextBillNumber: 1001,
    updatedAt: new Date().toISOString()
  }
};

class DBStore {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading db.json, using clean state:', e);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing db.json:', e);
    }
  }

  async seed() {
    let admin = this.data.users.find(u => u.username === 'admin');
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = {
        _id: 'user-admin-001',
        username: 'admin',
        email: 'admin@hisabkitab.local',
        fullName: 'Super Admin',
        password: hashedPassword,
        role: 'superadmin',
        is2FAEnabled: false,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      this.data.users.push(admin);
      this.save();
      console.log('✅ Default Super Admin initialized in JSON store.');
    }
  }
}

export const dbStore = new DBStore();
