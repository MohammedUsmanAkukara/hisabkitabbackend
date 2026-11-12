import { CustomerRepo, TransactionRepo } from '../storage/dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

export const getCustomers = async (req, res) => {
  try {
    const customers = await CustomerRepo.getAll();
    return res.status(200).json({ success: true, customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customers.', error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { syncId } = req.params;
    const customer = await CustomerRepo.getBySyncId(syncId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const transactions = await TransactionRepo.getAll({ partySyncId: syncId });
    return res.status(200).json({ success: true, customer, transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving customer.', error: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, gstin, openingBalance, notes, syncId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }

    const opBal = Number(openingBalance) || 0;
    const newCust = {
      syncId: syncId || `cust-${Date.now()}-${uuidv4().slice(0, 4)}`,
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

    const saved = await CustomerRepo.save(newCust);
    return res.status(201).json({ success: true, customer: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create customer.', error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { syncId } = req.params;
    const existing = await CustomerRepo.getBySyncId(syncId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const updated = await CustomerRepo.save({
      ...existing,
      ...req.body,
      syncId,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ success: true, customer: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update customer.', error: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { syncId } = req.params;
    const deleted = await CustomerRepo.delete(syncId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    return res.status(200).json({ success: true, message: 'Customer deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete customer.', error: error.message });
  }
};
