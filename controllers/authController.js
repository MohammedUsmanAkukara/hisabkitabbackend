import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepo, SettingRepo } from '../storage/dbAdapter.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hisab_kitab_ultra_secure_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  const userId = user._id || user.id;
  return jwt.sign(
    { id: userId, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const generateTempToken = (user) => {
  const userId = user._id || user.id;
  return jwt.sign(
    { id: userId, type: '2fa_pending' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and password are required.' });
    }

    const user = await UserRepo.findByIdentifier(identifier);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User does not exist.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Super Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const settings = await SettingRepo.get();
    const global2FA = settings ? settings.require2FA : false;
    const is2FARequired = user.is2FAEnabled || global2FA;

    if (is2FARequired) {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user.tempOTP = { code: otp, expiresAt };
      if (user.save) await user.save();
      else await UserRepo.update(user._id || user.id, { tempOTP: { code: otp, expiresAt } });

      const tempToken = generateTempToken(user);
      console.log(`🔐 [2FA OTP] For user ${user.username} (${user.email}): ${otp}`);

      return res.status(200).json({
        success: true,
        requires2FA: true,
        tempToken,
        message: `Two-Factor verification code sent to ${user.email}.`,
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    user.lastLogin = new Date();
    if (user.save) await user.save();
    else await UserRepo.update(user._id || user.id, { lastLogin: new Date() });

    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        is2FAEnabled: user.is2FAEnabled
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { tempToken, otp } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({ success: false, message: 'Temporary token and OTP are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
      if (decoded.type !== '2fa_pending') {
        return res.status(400).json({ success: false, message: 'Invalid token type for 2FA.' });
      }
    } catch {
      return res.status(401).json({ success: false, message: '2FA session expired. Please log in again.' });
    }

    const user = await UserRepo.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.tempOTP || !user.tempOTP.code || new Date() > new Date(user.tempOTP.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.tempOTP.code !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP code.' });
    }

    user.tempOTP = undefined;
    user.lastLogin = new Date();
    if (user.save) await user.save();
    else await UserRepo.update(user._id || user.id, { tempOTP: null, lastLogin: new Date() });

    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        is2FAEnabled: user.is2FAEnabled
      }
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    return res.status(500).json({ success: false, message: 'Error verifying OTP.', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Username or registered email is required.' });
    }

    const user = await UserRepo.findByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with that email/username.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.tempOTP = { code: otp, expiresAt };
    if (user.save) await user.save();
    else await UserRepo.update(user._id || user.id, { tempOTP: { code: otp, expiresAt } });

    console.log(`🔑 [Password Reset OTP] For user ${user.username} (${user.email}): ${otp}`);

    return res.status(200).json({
      success: true,
      message: `Password reset OTP has been sent to ${user.email}.`,
      email: user.email,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing request.', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Identifier, OTP, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const user = await UserRepo.findByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.tempOTP || !user.tempOTP.code || new Date() > new Date(user.tempOTP.expiresAt)) {
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new OTP.' });
    }

    if (user.tempOTP.code !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.tempOTP = undefined;
    if (user.save) await user.save();
    else await UserRepo.update(user._id || user.id, { password: hashedPassword, tempOTP: null });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error resetting password.', error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await UserRepo.listAll();
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching users.', error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, fullName, password, role, is2FAEnabled } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required.' });
    }

    const existingUser = await UserRepo.findByIdentifier(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists in system.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserRepo.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      fullName: fullName ? fullName.trim() : username.trim(),
      password: hashedPassword,
      role: role || 'admin',
      is2FAEnabled: !!is2FAEnabled
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: newUser._id || newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        is2FAEnabled: newUser.is2FAEnabled,
        status: newUser.status
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating user.', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, role, status, is2FAEnabled, newPassword } = req.body;

    const user = await UserRepo.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updatePayload = {};
    if (fullName) updatePayload.fullName = fullName;
    if (role) updatePayload.role = role;
    if (status) updatePayload.status = status;
    if (typeof is2FAEnabled === 'boolean') updatePayload.is2FAEnabled = is2FAEnabled;

    if (newPassword && newPassword.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.password = await bcrypt.hash(newPassword.trim(), salt);
    }

    const updated = await UserRepo.update(id, updatePayload);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: {
        id: updated._id || updated.id,
        username: updated.username,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        is2FAEnabled: updated.is2FAEnabled,
        status: updated.status
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating user.', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentId = req.user._id || req.user.id;

    if (currentId === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own Super Admin account.' });
    }

    const deleted = await UserRepo.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting user.', error: error.message });
  }
};