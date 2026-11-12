import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unit: {
    type: String,
    default: 'pcs'
  },
  rate: {
    type: Number,
    required: true,
    default: 0
  },
  lineTotal: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  syncId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  partyType: {
    type: String,
    enum: ['customer', 'vendor'],
    default: 'customer'
  },
  partySyncId: {
    type: String,
    default: ''
  },
  partyName: {
    type: String,
    required: true,
    trim: true
  },
  partyPhone: {
    type: String,
    default: ''
  },
  partyAddress: {
    type: String,
    default: ''
  },
  partyGstin: {
    type: String,
    default: ''
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  items: [billItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    default: 0
  },
  previousBalance: {
    type: Number,
    default: 0
  },
  totalPayable: {
    type: Number,
    default: 0
  },
  amountReceived: {
    type: Number,
    default: 0
  },
  closingBalance: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'bank', 'credit', 'cheque'],
    default: 'cash'
  },
  notes: {
    type: String,
    default: ''
  },
  terms: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['paid', 'partial', 'unpaid'],
    default: 'unpaid'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Bill', billSchema);

