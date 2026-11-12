import { TransactionRepo, CustomerRepo, VendorRepo } from '../storage/dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

const recalculatePartyBalance = async (partyType, partySyncId) => {
  const transactions = await TransactionRepo.getAll({ partySyncId });
  let balance = 0;

  if (partyType === 'customer') {
    const customer = await CustomerRepo.getBySyncId(partySyncId);
    if (!customer) return;
    balance = Number(customer.openingBalance) || 0;

    for (const t of transactions) {
      if (t.type === 'udhar' || t.type === 'sale') {
        balance += Number(t.grandTotal) || 0;
      } else if (t.type === 'jama' || t.type === 'payment') {
        balance -= Number(t.grandTotal) || 0;
      }
    }
    await CustomerRepo.save({ ...customer, currentBalance: balance });
  } else if (partyType === 'vendor') {
    const vendor = await VendorRepo.getBySyncId(partySyncId);
    if (!vendor) return;
    balance = Number(vendor.openingBalance) || 0;

    for (const t of transactions) {
      if (t.type === 'purchase' || t.type === 'udhar') {
        balance += Number(t.grandTotal) || 0;
      } else if (t.type === 'payment' || t.type === 'jama') {
        balance -= Number(t.grandTotal) || 0;
      }
    }
    await VendorRepo.save({ ...vendor, currentBalance: balance });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { partySyncId, partyType, startDate, endDate, type, search } = req.query;
    const transactions = await TransactionRepo.getAll({
      partySyncId,
      partyType,
      startDate,
      endDate,
      type,
      search
    });

    let totalJama = 0;
    let totalUdhar = 0;

    transactions.forEach(t => {
      if (t.type === 'jama' || t.type === 'payment') {
        totalJama += Number(t.grandTotal) || 0;
      } else {
        totalUdhar += Number(t.grandTotal) || 0;
      }
    });

    return res.status(200).json({
      success: true,
      transactions,
      summary: {
        totalJama,
        totalUdhar,
        netBalance: totalUdhar - totalJama,
        count: transactions.length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions.', error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const {
      syncId,
      partyType,
      partySyncId,
      partyName,
      partyPhone,
      date,
      type,
      particulars,
      items = [],
      subtotal,
      discount = 0,
      tax = 0,
      grandTotal,
      paymentMode,
      billNumber,
      notes
    } = req.body;

    if (!partyType || !partySyncId || !partyName || !date || !type) {
      return res.status(400).json({ success: false, message: 'Missing required transaction fields.' });
    }

    const processedItems = items.map(item => ({
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'pcs',
      rate: Number(item.rate) || 0,
      lineTotal: Number(item.lineTotal) || ((Number(item.quantity) || 1) * (Number(item.rate) || 0))
    }));

    let computedSubtotal = subtotal;
    if (computedSubtotal === undefined && processedItems.length > 0) {
      computedSubtotal = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    } else if (computedSubtotal === undefined) {
      computedSubtotal = Number(grandTotal) || 0;
    }

    const computedGrandTotal = grandTotal !== undefined
      ? Number(grandTotal)
      : (computedSubtotal - (Number(discount) || 0) + (Number(tax) || 0));

    const newTx = {
      syncId: syncId || `tx-${Date.now()}-${uuidv4().slice(0, 4)}`,
      partyType,
      partySyncId,
      partyName: partyName.trim(),
      partyPhone: partyPhone || '',
      date,
      type,
      particulars: particulars || (processedItems.length > 0 ? processedItems.map(i => `${i.description} (${i.quantity} ${i.unit} @ ₹${i.rate})`).join(', ') : ''),
      items: processedItems,
      subtotal: computedSubtotal,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      grandTotal: computedGrandTotal,
      paymentMode: paymentMode || 'cash',
      billNumber: billNumber || '',
      notes: notes || '',
      isSynced: true,
      updatedAt: new Date().toISOString()
    };

    const saved = await TransactionRepo.save(newTx);
    await recalculatePartyBalance(partyType, partySyncId);

    return res.status(201).json({ success: true, transaction: saved });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create transaction.', error: error.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { syncId } = req.params;
    const existing = (await TransactionRepo.getAll({ syncId }))[0];
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const updated = await TransactionRepo.save({
      ...existing,
      ...req.body,
      syncId,
      updatedAt: new Date().toISOString()
    });

    await recalculatePartyBalance(updated.partyType, updated.partySyncId);
    if (existing.partySyncId !== updated.partySyncId) {
      await recalculatePartyBalance(existing.partyType, existing.partySyncId);
    }

    return res.status(200).json({ success: true, transaction: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update transaction.', error: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { syncId } = req.params;
    const existing = (await TransactionRepo.getAll({ syncId }))[0];
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    await TransactionRepo.delete(syncId);
    await recalculatePartyBalance(existing.partyType, existing.partySyncId);

    return res.status(200).json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete transaction.', error: error.message });
  }
};
