import { CustomerRepo, VendorRepo, TransactionRepo, BillRepo, SettingRepo } from '../storage/dbAdapter.js';

export const pushSyncBatch = async (req, res) => {
  try {
    const { transactions = [], customers = [], vendors = [], bills = [] } = req.body;

    const results = {
      transactions: [],
      customers: [],
      vendors: [],
      bills: []
    };

    // 1. Sync Customers
    for (const c of customers) {
      if (!c.syncId) continue;
      if (c.isActive === false) {
        await CustomerRepo.delete(c.syncId);
      } else {
        await CustomerRepo.save(c);
      }
      results.customers.push(c.syncId);
    }

    // 2. Sync Vendors
    for (const v of vendors) {
      if (!v.syncId) continue;
      if (v.isActive === false) {
        await VendorRepo.delete(v.syncId);
      } else {
        await VendorRepo.save(v);
      }
      results.vendors.push(v.syncId);
    }

    // 3. Sync Transactions
    for (const t of transactions) {
      if (!t.syncId) continue;
      await TransactionRepo.save(t);
      results.transactions.push(t.syncId);
    }

    // 4. Sync Bills
    for (const b of bills) {
      if (!b.syncId) continue;
      await BillRepo.save(b);
      results.bills.push(b.syncId);
    }

    return res.status(200).json({
      success: true,
      message: 'Sync batch processed successfully.',
      syncedAt: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error('Push sync error:', error);
    return res.status(500).json({ success: false, message: 'Sync failed.', error: error.message });
  }
};

export const pullSyncData = async (req, res) => {
  try {
    const { since } = req.query;
    const sinceDate = since ? new Date(since) : new Date(0);

    const [allCustomers, allVendors, allTransactions, allBills, settings] = await Promise.all([
      CustomerRepo.getAll(),
      VendorRepo.getAll(),
      TransactionRepo.getAll(),
      BillRepo.getAll(),
      SettingRepo.get()
    ]);

    const filterSince = (list) => {
      if (!since) return list;
      return list.filter(item => !item.updatedAt || new Date(item.updatedAt) > sinceDate);
    };

    return res.status(200).json({
      success: true,
      serverTime: new Date().toISOString(),
      data: {
        customers: filterSince(allCustomers),
        vendors: filterSince(allVendors),
        transactions: filterSince(allTransactions),
        bills: filterSince(allBills),
        settings
      }
    });
  } catch (error) {
    console.error('Pull sync error:', error);
    return res.status(500).json({ success: false, message: 'Failed to pull sync data.', error: error.message });
  }
};
