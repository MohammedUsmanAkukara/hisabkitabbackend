import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Setting from './models/Setting.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('🌱 Checking initial database bootstrap...');

    // 1. Ensure Super Admin exists (NO public registration, accounts managed by Super Admin)
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const superAdmin = new User({
        username: 'admin',
        email: 'admin@hisabkitab.local',
        fullName: 'Super Admin',
        password: hashedPassword,
        role: 'superadmin',
        is2FAEnabled: false,
        status: 'active'
      });

      await superAdmin.save();
      console.log('✅ Default Super Admin created: [username: admin]');
    }

    // 2. Ensure a clean Setting document exists only when empty (never overwrite existing DB settings)
    const existingSettings = await Setting.findOne();
    if (!existingSettings) {
      const cleanSettings = new Setting({
        businessName: '',
        tagline: '',
        logoType: 'initials',
        initialsBgColor: '#1e3a8a',
        initialsTextColor: '#ffffff',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        upiId: '',
        currencySymbol: '₹',
        terms: '',
        require2FA: false,
        nextBillNumber: 1001
      });
      await cleanSettings.save();
    }
  } catch (error) {
    console.error('❌ Error during database bootstrap:', error);
  }
};
