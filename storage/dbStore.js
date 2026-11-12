import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial structure
const defaultState = {
  users: [],
  customers: [],
  vendors: [],
  transactions: [],
  bills: [],
  settings: {
    businessName: 'Moon Udhyog',
    tagline: 'Wholesale & Retail Corrugated Boxes & Packaging',
    logoType: 'initials',
    customLogoUrl: '',
    initialsBgColor: '#1e3a8a',
    initialsTextColor: '#ffffff',
    phone: '+91 98765 43210',
    email: 'contact@moonudhyog.com',
    address: 'Plot No. 45, Industrial Area, Phase-1, New Delhi - 110020',
    gstin: '07AAAAA1234A1Z5',
    upiId: 'moonudhyog@okaxis',
    currencySymbol: '₹',
    terms: '1. Goods once sold will not be taken back.\n2. Payment due within 15 days.\n3. Interest @18% p.a. on overdue bills.',
    require2FA: false,
    nextBillNumber: 1004,
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
      console.error('Error loading db.json, resetting to defaults:', e);
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
    // 1. Super Admin
    let admin = this.data.users.find(u => u.username === 'admin');
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = {
        _id: 'user-admin-001',
        username: 'admin',
        email: 'admin@moonudhyog.com',
        fullName: 'Super Admin',
        password: hashedPassword,
        role: 'superadmin',
        is2FAEnabled: false,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      this.data.users.push(admin);
      console.log('✅ Default Super Admin seeded: username [admin] | password [admin123]');
    }

    // 2. Customers
    if (this.data.customers.length === 0) {
      this.data.customers = [
        {
          _id: 'cust-id-101',
          syncId: 'cust-uuid-101',
          name: 'Ramesh Kumar & Sons',
          phone: '+91 98100 12345',
          email: 'ramesh.kumar@gmail.com',
          address: 'Shop 14, Sadar Bazar, Delhi',
          gstin: '07ABCPR1234E1Z1',
          openingBalance: 12500,
          currentBalance: 18900,
          notes: 'Regular box customer',
          isActive: true,
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'cust-id-102',
          syncId: 'cust-uuid-102',
          name: 'Gupta Traders & Suppliers',
          phone: '+91 98100 54321',
          email: 'guptatraders@yahoo.com',
          address: 'B-24, Gandhi Nagar, Delhi',
          gstin: '07BCDEG5678F1Z8',
          openingBalance: 5000,
          currentBalance: 9800,
          notes: 'Prompt payer',
          isActive: true,
          updatedAt: new Date().toISOString()
        }
      ];
      console.log('✅ Default Customers seeded in JSON store.');
    }

    // 3. Vendors
    if (this.data.vendors.length === 0) {
      this.data.vendors = [
        {
          _id: 'vend-id-201',
          syncId: 'vend-uuid-201',
          name: 'Aggarwal Paper & Board Mills',
          phone: '+91 98711 22334',
          email: 'sales@aggarwalmills.com',
          address: 'Site-4 Industrial Area, Sahibabad, Ghaziabad',
          gstin: '09AAACA4321A1Z9',
          openingBalance: 24000,
          currentBalance: 42000,
          notes: 'Raw kraft paper supplier',
          isActive: true,
          updatedAt: new Date().toISOString()
        }
      ];
      console.log('✅ Default Vendors seeded in JSON store.');
    }

    // 4. Transactions
    if (this.data.transactions.length === 0) {
      this.data.transactions = [
        {
          _id: 'tx-id-001',
          syncId: 'tx-uuid-001',
          partyType: 'customer',
          partySyncId: 'cust-uuid-101',
          partyName: 'Ramesh Kumar & Sons',
          partyPhone: '+91 98100 12345',
          date: '2026-11-09',
          type: 'udhar',
          particulars: 'Jumbo Box 5-Ply Heavy Duty, BABA 3-Ply Special Cartons',
          items: [
            { description: 'Jumbo Box 5-Ply Heavy Duty', quantity: 200, unit: 'pcs', rate: 25, lineTotal: 5000 },
            { description: 'BABA 3-Ply Special White Box', quantity: 150, unit: 'pcs', rate: 16, lineTotal: 2400 }
          ],
          subtotal: 7400,
          discount: 0,
          tax: 0,
          grandTotal: 7400,
          paymentMode: 'credit',
          billNumber: 'PARCHI-1001',
          notes: 'Dispatched via tempo DL-1L-4421',
          isSynced: true,
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'tx-id-002',
          syncId: 'tx-uuid-002',
          partyType: 'customer',
          partySyncId: 'cust-uuid-101',
          partyName: 'Ramesh Kumar & Sons',
          partyPhone: '+91 98100 12345',
          date: '2026-11-10',
          type: 'jama',
          particulars: 'UPI Payment received against balance',
          items: [],
          subtotal: 5000,
          discount: 0,
          tax: 0,
          grandTotal: 5000,
          paymentMode: 'upi',
          billNumber: '',
          notes: 'Ref: UPI/26111009841',
          isSynced: true,
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'tx-id-003',
          syncId: 'tx-uuid-003',
          partyType: 'customer',
          partySyncId: 'cust-uuid-102',
          partyName: 'Gupta Traders & Suppliers',
          partyPhone: '+91 98100 54321',
          date: '2026-11-11',
          type: 'udhar',
          particulars: '500 pcs Standard Corrugated Shipping Box',
          items: [
            { description: '500 pcs Standard Corrugated Shipping Box', quantity: 500, unit: 'pcs', rate: 12, lineTotal: 6000 },
            { description: 'Packaging BOPP Tape 2-inch Brown', quantity: 24, unit: 'rolls', rate: 50, lineTotal: 1200 }
          ],
          subtotal: 7200,
          discount: 200,
          tax: 0,
          grandTotal: 7000,
          paymentMode: 'credit',
          billNumber: 'PARCHI-1002',
          notes: 'Delivered at shop',
          isSynced: true,
          updatedAt: new Date().toISOString()
        }
      ];
      console.log('✅ Default Transactions seeded in JSON store.');
    }

    // 5. Bills
    if (this.data.bills.length === 0) {
      this.data.bills = [
        {
          _id: 'bill-id-001',
          billNumber: 'PARCHI-1001',
          syncId: 'bill-uuid-001',
          partyType: 'customer',
          partySyncId: 'cust-uuid-101',
          partyName: 'Ramesh Kumar & Sons',
          partyPhone: '+91 98100 12345',
          partyAddress: 'Shop 14, Sadar Bazar, Delhi',
          partyGstin: '07ABCPR1234E1Z1',
          date: '2026-11-09',
          items: [
            { description: 'Jumbo Box 5-Ply Heavy Duty', quantity: 200, unit: 'pcs', rate: 25, lineTotal: 5000 },
            { description: 'BABA 3-Ply Special White Box', quantity: 150, unit: 'pcs', rate: 16, lineTotal: 2400 }
          ],
          subtotal: 7400,
          discount: 0,
          tax: 0,
          grandTotal: 7400,
          previousBalance: 12500,
          totalPayable: 19900,
          amountReceived: 1000,
          closingBalance: 18900,
          paymentMode: 'cash',
          notes: 'Thank you for your business!',
          terms: '1. Goods once sold will not be taken back.\n2. Please clear payments within 15 days.',
          status: 'partial',
          updatedAt: new Date().toISOString()
        }
      ];
      console.log('✅ Default Bills seeded in JSON store.');
    }

    this.save();
  }
}

export const dbStore = new DBStore();

