import { BillRepo, SettingRepo, CustomerRepo, TransactionRepo } from '../storage/dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

export const getBills = async (req, res) => {
  try {
    const { search, partySyncId, status } = req.query;
    let bills = await BillRepo.getAll({ partySyncId, status });

    if (search) {
      const q = search.toLowerCase();
      bills = bills.filter(b =>
        b.billNumber.toLowerCase().includes(q) ||
        b.partyName.toLowerCase().includes(q) ||
        (b.partyPhone && b.partyPhone.includes(q))
      );
    }

    return res.status(200).json({ success: true, bills });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch bills.', error: error.message });
  }
};

export const getBillByNumber = async (req, res) => {
  try {
    const { billNumber } = req.params;
    const bill = await BillRepo.getByNumber(billNumber);

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    return res.status(200).json({ success: true, bill });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching bill.', error: error.message });
  }
};

export const createBill = async (req, res) => {
  try {
    const {
      syncId,
      billNumber: customBillNumber,
      partyType = 'customer',
      partySyncId,
      partyName,
      partyPhone,
      partyAddress,
      partyGstin,
      date,
      items = [],
      subtotal,
      discount = 0,
      tax = 0,
      grandTotal,
      previousBalance = 0,
      totalPayable,
      amountReceived = 0,
      closingBalance,
      paymentMode = 'cash',
      notes,
      terms,
      createLedgerEntry = true
    } = req.body;

    if (!partyName || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer name and at least one item are required.' });
    }

    let finalBillNumber = customBillNumber;
    if (!finalBillNumber) {
      const setting = await SettingRepo.get();
      const nextNum = setting.nextBillNumber || 1001;
      finalBillNumber = `PARCHI-${nextNum}`;
      await SettingRepo.update({ nextBillNumber: nextNum + 1 });
    }

    const processedItems = items.map(item => ({
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'pcs',
      rate: Number(item.rate) || 0,
      lineTotal: Number(item.lineTotal) || ((Number(item.quantity) || 1) * (Number(item.rate) || 0))
    }));

    const calcSubtotal = subtotal !== undefined ? Number(subtotal) : processedItems.reduce((acc, i) => acc + i.lineTotal, 0);
    const calcGrandTotal = grandTotal !== undefined ? Number(grandTotal) : (calcSubtotal - (Number(discount) || 0) + (Number(tax) || 0));
    const calcPrevBal = Number(previousBalance) || 0;
    const calcTotalPayable = totalPayable !== undefined ? Number(totalPayable) : (calcGrandTotal + calcPrevBal);
    const calcRecv = Number(amountReceived) || 0;
    const calcClosing = closingBalance !== undefined ? Number(closingBalance) : (calcTotalPayable - calcRecv);

    let status = 'unpaid';
    if (calcRecv >= calcTotalPayable && calcTotalPayable > 0) {
      status = 'paid';
    } else if (calcRecv > 0) {
      status = 'partial';
    }

    const newBill = {
      billNumber: finalBillNumber,
      syncId: syncId || `bill-${Date.now()}-${uuidv4().slice(0, 4)}`,
      partyType,
      partySyncId: partySyncId || '',
      partyName: partyName.trim(),
      partyPhone: partyPhone || '',
      partyAddress: partyAddress || '',
      partyGstin: partyGstin || '',
      date: date || new Date().toISOString().split('T')[0],
      items: processedItems,
      subtotal: calcSubtotal,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      grandTotal: calcGrandTotal,
      previousBalance: calcPrevBal,
      totalPayable: calcTotalPayable,
      amountReceived: calcRecv,
      closingBalance: calcClosing,
      paymentMode,
      notes: notes || '',
      terms: terms || '',
      status,
      updatedAt: new Date().toISOString()
    };

    const savedBill = await BillRepo.save(newBill);

    if (createLedgerEntry && partySyncId) {
      await TransactionRepo.save({
        syncId: `tx-${Date.now()}-sale-${uuidv4().slice(0, 4)}`,
        partyType,
        partySyncId,
        partyName: partyName.trim(),
        partyPhone: partyPhone || '',
        date: savedBill.date,
        type: 'sale',
        particulars: `Bill #${savedBill.billNumber} (${processedItems.map(i => `${i.description} × ${i.quantity}`).join(', ')})`,
        items: processedItems,
        subtotal: calcSubtotal,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        grandTotal: calcGrandTotal,
        paymentMode: calcRecv > 0 ? paymentMode : 'credit',
        billNumber: savedBill.billNumber,
        isSynced: true,
        updatedAt: new Date().toISOString()
      });

      if (calcRecv > 0) {
        await TransactionRepo.save({
          syncId: `tx-${Date.now()}-pay-${uuidv4().slice(0, 4)}`,
          partyType,
          partySyncId,
          partyName: partyName.trim(),
          partyPhone: partyPhone || '',
          date: savedBill.date,
          type: 'jama',
          particulars: `Payment received against Bill #${savedBill.billNumber}`,
          grandTotal: calcRecv,
          paymentMode,
          billNumber: savedBill.billNumber,
          isSynced: true,
          updatedAt: new Date().toISOString()
        });
      }

      const customer = await CustomerRepo.getBySyncId(partySyncId);
      if (customer) {
        const newBal = (Number(customer.currentBalance) || 0) + calcGrandTotal - calcRecv;
        await CustomerRepo.save({ ...customer, currentBalance: newBal });
      }
    }

    return res.status(201).json({ success: true, bill: savedBill });
  } catch (error) {
    console.error('Create bill error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create bill.', error: error.message });
  }
};

export const deleteBill = async (req, res) => {
  try {
    const { syncId } = req.params;
    const deleted = await BillRepo.delete(syncId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    return res.status(200).json({ success: true, message: 'Bill deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete bill.', error: error.message });
  }
};
