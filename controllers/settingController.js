import { SettingRepo } from '../storage/dbAdapter.js';

export const getSettings = async (req, res) => {
  try {
    const setting = await SettingRepo.get();
    return res.status(200).json({ success: true, settings: setting });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.', error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const updatableFields = [
      'businessName',
      'tagline',
      'logoType',
      'customLogoUrl',
      'initialsBgColor',
      'initialsTextColor',
      'phone',
      'email',
      'address',
      'gstin',
      'upiId',
      'paymentQrUrl',
      'currencySymbol',
      'terms',
      'require2FA',
      'nextBillNumber'
    ];

    const payload = {};
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    });

    const updated = await SettingRepo.update(payload);
    return res.status(200).json({ success: true, settings: updated, message: 'Settings updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.', error: error.message });
  }
};
