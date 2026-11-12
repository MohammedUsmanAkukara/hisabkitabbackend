import { VendorRepo, TransactionRepo } from '../storage/dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

export const getVendors = async (req, res) => {
  try {
    const vendors = await VendorRepo.getAll();
    return res.status(200).json({ success: true, vendors });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch vendors.', error: error.message });
  }
};

export const getVendorById = async (req, res) => {
  try {
    const { syncId } = req.params;
    const vendor = await VendorRepo.getBySyncId(syncId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const transactions = await TransactionRepo.getAll({ partySyncId: syncId });
    return res.status(200).json({ success: true, vendor, transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving vendor.', error: error.message });
  }
};

export const createVendor = async (req, res) => {
  try {
    const { name, phone, email, address, gstin, openingBalance, notes, syncId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Vendor name is required.' });
    }

    const opBal = Number(openingBalance) || 0;
    const newVend = {
      syncId: syncId || `vend-${Date.now()}-${uuidv4().slice(0, 4)}`,
      name: name.trim(),
      phone: phone || '',
      email: email || '',
      address: address || '',
      gstin: gstin || '',
      openingBalance: opBal,
      currentBalance: opBal,
      notes: notes || '',
      isActive: true,
      updatedAt: new Date().toISOString()
    };

    const saved = await VendorRepo.save(newVend);
    return res.status(201).json({ success: true, vendor: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create vendor.', error: error.message });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { syncId } = req.params;
    const existing = await VendorRepo.getBySyncId(syncId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const updated = await VendorRepo.save({
      ...existing,
      ...req.body,
      syncId,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ success: true, vendor: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update vendor.', error: error.message });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const { syncId } = req.params;
    const deleted = await VendorRepo.delete(syncId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }
    return res.status(200).json({ success: true, message: 'Vendor deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete vendor.', error: error.message });
  }
};
