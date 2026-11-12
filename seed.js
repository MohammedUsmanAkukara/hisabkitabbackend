import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Customer from './models/Customer.js';
import Vendor from './models/Vendor.js';
import Transaction from './models/Transaction.js';
import Bill from './models/Bill.js';
import Setting from './models/Setting.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('🌱 Checking / Seeding Initial Database...');

    // 1. Seed Super Admin (Strict rule: NO public registration, accounts created by Super Admin)
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const superAdmin = new User({
        username: 'admin',
        email: 'admin@moonudhyog.com',
        fullName: 'Super Admin',
        password: hashedPassword,
        role: 'superadmin',
        is2FAEnabled: false,
        status: 'active'
      });

      await superAdmin.save();
      console.log('✅ Default Super Admin created: [username: admin | password: admin123]');
    }

    // 2. Seed Business Settings
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting({
        businessName: 'Moon Udhyog',
        tagline: 'Wholesale & Retail Corrugated Boxes & Packaging',
        logoType: 'initials',
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
        nextBillNumber: 1004
      });
      await settings.save();
      console.log('✅ Default Business Settings initialized for "Moon Udhyog".');
    }

    // 3. Seed Sample Customers if empty
    const customerCount = await Customer.countDocuments();
    let cust1SyncId = 'cust-uuid-101';
    let cust2SyncId = 'cust-uuid-102';

    if (customerCount === 0) {
      const cust1 = new Customer({
        syncId: cust1SyncId,
        name: 'Ramesh Kumar & Sons',
        phone: '+91 98100 12345',
        email: 'ramesh.kumar@gmail.com',
        address: 'Shop 14, Sadar Bazar, Delhi',
        gstin: '07ABCPR1234E1Z1',
        openingBalance: 12500,
        currentBalance: 18900,
        notes: 'Preferred customer for heavy boxes',
        updatedAt: new Date()
      });

      const cust2 = new Customer({
        syncId: cust2SyncId,
        name: 'Gupta Traders & Suppliers',
        phone: '+91 98100 54321',
        email: 'guptatraders@yahoo.com',
        address: 'B-24, Gandhi Nagar, Delhi',
        gstin: '07BCDEG5678F1Z8',
        openingBalance: 5000,
        currentBalance: 9800,
        notes: 'Regular prompt payer',
        updatedAt: new Date()
      });

      await cust1.save();
      await cust2.save();
      console.log('✅ Sample Customers seeded.');
    }

    // 4. Seed Sample Vendors if empty
    const vendorCount = await Vendor.countDocuments();
    let vend1SyncId = 'vend-uuid-201';
    if (vendorCount === 0) {
      const vend1 = new Vendor({
        syncId: vend1SyncId,
        name: 'Aggarwal Paper & Board Mills',
        phone: '+91 98711 22334',
        email: 'sales@aggarwalmills.com',
        address: 'Site-4 Industrial Area, Sahibabad, Ghaziabad',
        gstin: '09AAACA4321A1Z9',
        openingBalance: 24000,
        currentBalance: 42000,
        notes: 'Raw kraft paper supplier',
        updatedAt: new Date()
      });
      await vend1.save();
      console.log('✅ Sample Vendors seeded.');
    }

    // 5. Seed Sample Transactions with nested sub-rows
    const txCount = await Transaction.countDocuments();
    if (txCount === 0) {
      const tx1 = new Transaction({
        syncId: 'tx-uuid-001',
        partyType: 'customer',
        partySyncId: cust1SyncId,
        partyName: 'Ramesh Kumar & Sons',
        partyPhone: '+91 98100 12345',
        date: '2026-11-09',
        type: 'udhar',
        particulars: 'Jumbo Box 5-Ply, BABA 3-Ply Special Cartons',
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
        updatedAt: new Date()
      });

      const tx2 = new Transaction({
        syncId: 'tx-uuid-002',
        partyType: 'customer',
        partySyncId: cust1SyncId,
        partyName: 'Ramesh Kumar & Sons',
        partyPhone: '+91 98100 12345',
        date: '2026-11-10',
        type: 'jama',
        particulars: 'UPI Payment received against previous balance',
        items: [],
        subtotal: 5000,
        discount: 0,
        tax: 0,
        grandTotal: 5000,
        paymentMode: 'upi',
        billNumber: '',
        notes: 'Ref: UPI/26111009841',
        isSynced: true,
        updatedAt: new Date()
      });

      const tx3 = new Transaction({
        syncId: 'tx-uuid-003',
        partyType: 'customer',
        partySyncId: cust2SyncId,
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
        updatedAt: new Date()
      });

      await tx1.save();
      await tx2.save();
      await tx3.save();
      console.log('✅ Sample Transactions seeded.');
    }

    // 6. Seed Sample Bill
    const billCount = await Bill.countDocuments();
    if (billCount === 0) {
      const sampleBill = new Bill({
        billNumber: 'PARCHI-1001',
        syncId: 'bill-uuid-001',
        partyType: 'customer',
        partySyncId: cust1SyncId,
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
        updatedAt: new Date()
      });

      await sampleBill.save();
      console.log('✅ Sample Bill seeded.');
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
};

