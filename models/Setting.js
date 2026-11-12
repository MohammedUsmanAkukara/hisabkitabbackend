import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  businessName: {
    type: String,
    default: 'Moon Udhyog'
  },
  tagline: {
    type: String,
    default: 'Wholesale & Retail Traders'
  },
  logoType: {
    type: String,
    enum: ['custom', 'initials'],
    default: 'initials'
  },
  customLogoUrl: {
    type: String,
    default: ''
  },
  initialsBgColor: {
    type: String,
    default: '#1e3a8a' // Royal Navy Blue
  },
  initialsTextColor: {
    type: String,
    default: '#ffffff'
  },
  phone: {
    type: String,
    default: '+91 98765 43210'
  },
  email: {
    type: String,
    default: 'contact@moonudhyog.com'
  },
  address: {
    type: String,
    default: 'Shop No. 12, Grain Market, Delhi - 110006'
  },
  gstin: {
    type: String,
    default: '07AAAAA1234A1Z5'
  },
  upiId: {
    type: String,
    default: 'moonudhyog@okaxis'
  },
  currencySymbol: {
    type: String,
    default: '₹'
  },
  terms: {
    type: String,
    default: '1. Goods once sold will not be returned.\n2. Please clear payments within 15 days.'
  },
  require2FA: {
    type: Boolean,
    default: false
  },
  nextBillNumber: {
    type: Number,
    default: 1001
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Setting', settingSchema);

