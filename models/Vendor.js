import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  syncId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  gstin: {
    type: String,
    trim: true,
    default: ''
  },
  openingBalance: {
    type: Number,
    default: 0 // positive: business owes vendor, negative: advance paid to vendor
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Vendor', vendorSchema);

