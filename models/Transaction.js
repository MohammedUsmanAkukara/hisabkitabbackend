import mongoose from 'mongoose';

const transactionItemSchema = new mongoose.Schema({
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

const transactionSchema = new mongoose.Schema({
  syncId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  partyType: {
    type: String,
    enum: ['customer', 'vendor'],
    required: true,
    index: true
  },
  partySyncId: {
    type: String,
    required: true,
    index: true
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
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['jama', 'udhar', 'payment', 'sale', 'purchase'],
    required: true
  },
  particulars: {
    type: String,
    default: ''
  },
  items: [transactionItemSchema],
  subtotal: {
    type: Number,
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
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'bank', 'credit', 'cheque'],
    default: 'cash'
  },
  billNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  isSynced: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Transaction', transactionSchema);

