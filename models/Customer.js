import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
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
    default: 0 // positive: customer owes business (Debit / Udhar), negative: customer in credit (Advance / Jama)
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

export default mongoose.model('Customer', customerSchema);

