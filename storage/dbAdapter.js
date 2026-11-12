import mongoose from 'mongoose';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Vendor from '../models/Vendor.js';
import Transaction from '../models/Transaction.js';
import Bill from '../models/Bill.js';
import Setting from '../models/Setting.js';
import { dbStore } from './dbStore.js';
import { v4 as uuidv4 } from 'uuid';

const isMongo = () => mongoose.connection.readyState === 1;

// ================= USER ADAPTER =================
export const UserRepo = {
  findByIdentifier: async (identifier) => {
    if (isMongo()) {
      return User.findOne({
        $or: [
          { username: identifier.trim() },
          { email: identifier.toLowerCase().trim() }
        ]
      });
    }
    const clean = identifier.trim().toLowerCase();
    const u = dbStore.data.users.find(
      x => x.username.toLowerCase() === clean || x.email.toLowerCase() === clean
    );
    if (!u) return null;
    return {
      ...u,
      save: async function () {
        const idx = dbStore.data.users.findIndex(x => x._id === u._id);
        if (idx !== -1) dbStore.data.users[idx] = this;
        dbStore.save();
        return this;
      }
    };
  },

  findById: async (id) => {
    if (isMongo()) {
      return User.findById(id).select('-password');
    }
    const u = dbStore.data.users.find(x => x._id === id || x.id === id);
    if (!u) return null;
    return {
      ...u,
      save: async function () {
        const idx = dbStore.data.users.findIndex(x => x._id === u._id);
        if (idx !== -1) dbStore.data.users[idx] = this;
        dbStore.save();
        return this;
      }
    };
  },

  listAll: async () => {
    if (isMongo()) {
      return User.find().select('-password -tempOTP').sort({ createdAt: -1 });
    }
    return dbStore.data.users.map(({ password, tempOTP, ...rest }) => rest);
  },

  create: async (data) => {
    if (isMongo()) {
      const user = new User(data);
      await user.save();
      return user;
    }
    const newUser = {
      _id: `user-${Date.now()}-${uuidv4().slice(0, 4)}`,
      ...data,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    dbStore.data.users.push(newUser);
    dbStore.save();
    return newUser;
  },

  update: async (id, updateData) => {
    if (isMongo()) {
      return User.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idx = dbStore.data.users.findIndex(x => x._id === id || x.id === id);
    if (idx === -1) return null;
    dbStore.data.users[idx] = { ...dbStore.data.users[idx], ...updateData };
    dbStore.save();
    return dbStore.data.users[idx];
  },

  delete: async (id) => {
    if (isMongo()) {
      return User.findByIdAndDelete(id);
    }
    const idx = dbStore.data.users.findIndex(x => x._id === id || x.id === id);
    if (idx === -1) return null;
    const deleted = dbStore.data.users.splice(idx, 1);
    dbStore.save();
    return deleted[0];
  }
};

// ================= CUSTOMER ADAPTER =================
export const CustomerRepo = {
  getAll: async () => {
    if (isMongo()) {
      return Customer.find({ isActive: true }).sort({ name: 1 });
    }
    return dbStore.data.customers
      .filter(c => c.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getBySyncId: async (syncId) => {
    if (isMongo()) {
      return Customer.findOne({ syncId, isActive: true });
    }
    return dbStore.data.customers.find(c => c.syncId === syncId && c.isActive !== false);
  },

  save: async (data) => {
    if (isMongo()) {
      return Customer.findOneAndUpdate(
        { syncId: data.syncId },
        { ...data, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    const idx = dbStore.data.customers.findIndex(c => c.syncId === data.syncId);
    if (idx !== -1) {
      dbStore.data.customers[idx] = { ...dbStore.data.customers[idx], ...data, updatedAt: new Date().toISOString() };
    } else {
      dbStore.data.customers.push({
        _id: `cust-${Date.now()}-${uuidv4().slice(0, 4)}`,
        ...data,
        isActive: data.isActive !== false,
        updatedAt: new Date().toISOString()
      });
    }
    dbStore.save();
    return data;
  },

  delete: async (syncId) => {
    if (isMongo()) {
      return Customer.findOneAndUpdate({ syncId }, { isActive: false, updatedAt: new Date() });
    }
    const cust = dbStore.data.customers.find(c => c.syncId === syncId);
    if (cust) {
      cust.isActive = false;
      cust.updatedAt = new Date().toISOString();
      dbStore.save();
    }
    return cust;
  }
};

// ================= VENDOR ADAPTER =================
export const VendorRepo = {
  getAll: async () => {
    if (isMongo()) {
      return Vendor.find({ isActive: true }).sort({ name: 1 });
    }
    return dbStore.data.vendors
      .filter(v => v.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getBySyncId: async (syncId) => {
    if (isMongo()) {
      return Vendor.findOne({ syncId, isActive: true });
    }
    return dbStore.data.vendors.find(v => v.syncId === syncId && v.isActive !== false);
  },

  save: async (data) => {
    if (isMongo()) {
      return Vendor.findOneAndUpdate(
        { syncId: data.syncId },
        { ...data, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    const idx = dbStore.data.vendors.findIndex(v => v.syncId === data.syncId);
    if (idx !== -1) {
      dbStore.data.vendors[idx] = { ...dbStore.data.vendors[idx], ...data, updatedAt: new Date().toISOString() };
    } else {
      dbStore.data.vendors.push({
        _id: `vend-${Date.now()}-${uuidv4().slice(0, 4)}`,
        ...data,
        isActive: data.isActive !== false,
        updatedAt: new Date().toISOString()
      });
    }
    dbStore.save();
    return data;
  },

  delete: async (syncId) => {
    if (isMongo()) {
      return Vendor.findOneAndUpdate({ syncId }, { isActive: false, updatedAt: new Date() });
    }
    const vend = dbStore.data.vendors.find(v => v.syncId === syncId);
    if (vend) {
      vend.isActive = false;
      vend.updatedAt = new Date().toISOString();
      dbStore.save();
    }
    return vend;
  }
};

// ================= TRANSACTION ADAPTER =================
export const TransactionRepo = {
  getAll: async (filter = {}) => {
    if (isMongo()) {
      return Transaction.find(filter).sort({ date: -1, _id: -1 });
    }
    let list = [...dbStore.data.transactions];
    if (filter.partySyncId) list = list.filter(t => t.partySyncId === filter.partySyncId);
    if (filter.partyType) list = list.filter(t => t.partyType === filter.partyType);
    if (filter.type) list = list.filter(t => t.type === filter.type);
    if (filter.startDate) list = list.filter(t => t.date >= filter.startDate);
    if (filter.endDate) list = list.filter(t => t.date <= filter.endDate);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(t =>
        t.partyName.toLowerCase().includes(q) ||
        (t.particulars && t.particulars.toLowerCase().includes(q)) ||
        (t.billNumber && t.billNumber.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  },

  save: async (data) => {
    if (isMongo()) {
      return Transaction.findOneAndUpdate(
        { syncId: data.syncId },
        { ...data, isSynced: true, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    const idx = dbStore.data.transactions.findIndex(t => t.syncId === data.syncId);
    if (idx !== -1) {
      dbStore.data.transactions[idx] = { ...dbStore.data.transactions[idx], ...data, isSynced: true, updatedAt: new Date().toISOString() };
    } else {
      dbStore.data.transactions.push({
        _id: `tx-${Date.now()}-${uuidv4().slice(0, 4)}`,
        ...data,
        isSynced: true,
        updatedAt: new Date().toISOString()
      });
    }
    dbStore.save();
    return data;
  },

  delete: async (syncId) => {
    if (isMongo()) {
      return Transaction.findOneAndDelete({ syncId });
    }
    const idx = dbStore.data.transactions.findIndex(t => t.syncId === syncId);
    if (idx === -1) return null;
    const deleted = dbStore.data.transactions.splice(idx, 1);
    dbStore.save();
    return deleted[0];
  }
};

// ================= BILL ADAPTER =================
export const BillRepo = {
  getAll: async (filter = {}) => {
    if (isMongo()) {
      return Bill.find(filter).sort({ date: -1, _id: -1 });
    }
    let list = [...dbStore.data.bills];
    if (filter.partySyncId) list = list.filter(b => b.partySyncId === filter.partySyncId);
    if (filter.status) list = list.filter(b => b.status === filter.status);
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  },

  getByNumber: async (billNumber) => {
    if (isMongo()) {
      return Bill.findOne({
        $or: [{ billNumber }, { syncId: billNumber }]
      });
    }
    return dbStore.data.bills.find(b => b.billNumber === billNumber || b.syncId === billNumber);
  },

  save: async (data) => {
    if (isMongo()) {
      return Bill.findOneAndUpdate(
        { syncId: data.syncId },
        { ...data, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    const idx = dbStore.data.bills.findIndex(b => b.syncId === data.syncId || b.billNumber === data.billNumber);
    if (idx !== -1) {
      dbStore.data.bills[idx] = { ...dbStore.data.bills[idx], ...data, updatedAt: new Date().toISOString() };
    } else {
      dbStore.data.bills.push({
        _id: `bill-${Date.now()}-${uuidv4().slice(0, 4)}`,
        ...data,
        updatedAt: new Date().toISOString()
      });
    }
    dbStore.save();
    return data;
  },

  delete: async (syncId) => {
    if (isMongo()) {
      return Bill.findOneAndDelete({ $or: [{ syncId }, { billNumber: syncId }] });
    }
    const idx = dbStore.data.bills.findIndex(b => b.syncId === syncId || b.billNumber === syncId);
    if (idx === -1) return null;
    const deleted = dbStore.data.bills.splice(idx, 1);
    dbStore.save();
    return deleted[0];
  }
};

// ================= SETTING ADAPTER =================
export const SettingRepo = {
  get: async () => {
    if (isMongo()) {
      let s = await Setting.findOne();
      if (!s) {
        s = new Setting();
        await s.save();
      }
      return s;
    }
    return dbStore.data.settings;
  },

  update: async (data) => {
    if (isMongo()) {
      let s = await Setting.findOne();
      if (!s) s = new Setting();
      Object.assign(s, data);
      s.updatedAt = new Date();
      await s.save();
      return s;
    }
    dbStore.data.settings = {
      ...dbStore.data.settings,
      ...data,
      updatedAt: new Date().toISOString()
    };
    dbStore.save();
    return dbStore.data.settings;
  }
};

