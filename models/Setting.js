import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  businessName: {
    type: String,
    default: ''
  },
  tagline: {
    type: String,
    default: ''
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
    default: '#1e3a8a'
  },
  initialsTextColor: {
    type: String,
    default: '#ffffff'
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  gstin: {
    type: String,
    default: ''
  },
  upiId: {
    type: String,
    default: ''
  },
  paymentQrUrl: {
    type: String,
    default: ''
  },
  currencySymbol: {
    type: String,
    default: '₹'
  },
  terms: {
    type: String,
    default: ''
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
