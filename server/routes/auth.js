// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { generateToken } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordReset,
  validatePasswordUpdate,
  validateProfileUpdate
} = require('../utils/validators');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const { handleAvatarUpload } = require('../middleware/upload');
const { uploadToCloudinary } = require('../config/cloudinary');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const router = express.Router();

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = validateUserRegistration(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, email, password, phone, role } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'citizen'
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send welcome email
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.sendWelcomeNotification(user);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          stats: user.stats,
          preferences: user.preferences
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { error, value } = validateUserLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          stats: user.stats,
          preferences: user.preferences,
          lastLoginAt: user.lastLoginAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('address');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          address: user.address,
          isVerified: user.isVerified,
          stats: user.stats,
          preferences: user.preferences,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    // Validate input
    const { error, value } = validateProfileUpdate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const allowedUpdates = ['name', 'phone', 'address', 'preferences', 'email'];
    const updates = {};

    // Filter allowed updates
    Object.keys(value).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = value[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          // bio: user.bio,
          // location: user.location,
          role: user.role,
          avatar: user.avatar,
          address: user.address,
          preferences: user.preferences,
          stats: user.stats
        }
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: error.message
    });
  }
});

// @desc    Upload/Update user avatar
// @route   POST /api/auth/avatar
// @access  Private
router.post('/avatar', protect, handleAvatarUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an avatar image'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer, 
      req.file.originalname, 
      'image'
    );

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: result.url },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: {
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Avatar upload failed',
      error: error.message
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    // Validate input
    const { error, value } = validatePasswordUpdate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { currentPassword, newPassword } = value;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed',
      error: error.message
    });
  }
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    // Validate input
    const { error, value } = validatePasswordReset(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash and store reset token (in production, store this with expiration)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // In a real implementation, you'd store this in the database with expiration
    // For now, we'll use a simple approach
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed',
      error: error.message
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      data: { token }
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
});

// @desc    Logout user (invalidate token on client side)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  // In a JWT implementation, logout is typically handled on the client side
  // by removing the token from storage. Server-side logout would require
  // a token blacklist or shorter token expiration times.
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Verify account (placeholder for email verification)
// @route   GET /api/auth/verify/:token
// @access  Public
router.get('/verify/:token', async (req, res) => {
  try {
    // This would verify email verification token in a real implementation
    res.json({
      success: true,
      message: 'Account verification feature will be implemented'
    });

  } catch (error) {
    console.error('Account verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Account verification failed',
      error: error.message
    });
  }
});

router.post('/2fa/setup', protect, async (req, res) => {
  try {
    console.log('2FA Setup - User ID:', req.user.id);
    
    const user = await User.findById(req.user.id).select('+twoFactorEnabled +twoFactorSecret');

    console.log('2FA Setup - User found:', !!user);
    console.log('2FA Setup - Current 2FA status:', user?.twoFactorEnabled);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-Factor Authentication is already enabled'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Voice2Action (${user.email})`,
      issuer: 'Voice2Action',
      length: 32
    });

    console.log('2FA Setup - Secret generated');
    console.log('2FA Setup - Secret base32:', secret.base32.substring(0, 10) + '...');

    // Store temporary secret (not enabled yet)
    user.twoFactorTempSecret = secret.base32;
    await user.save({ validateBeforeSave: false });

    console.log('2FA Setup - Temp secret saved to user');

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    console.log('2FA Setup - QR code generated');

    res.json({
      success: true,
      message: 'Scan QR code with your authenticator app',
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl
      }
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup Two-Factor Authentication',
      error: error.message
    });
  }
});

// @desc    Verify and Enable Two-Factor Authentication
// @route   POST /api/auth/2fa/verify
// @access  Private
router.post('/2fa/verify', protect, async (req, res) => {
  try {
    const { token } = req.body;

    console.log('2FA Verify - Received token:', token);
    console.log('2FA Verify - User ID:', req.user.id);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }

    // Clean the token (remove any spaces or special characters)
    const cleanToken = token.toString().trim().replace(/\s/g, '');
    
    if (!/^\d{6}$/.test(cleanToken)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be 6 digits'
      });
    }

    const user = await User.findById(req.user.id).select('+twoFactorTempSecret');

    console.log('2FA Verify - User found:', !!user);
    console.log('2FA Verify - Has temp secret:', !!user?.twoFactorTempSecret);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorTempSecret) {
      return res.status(400).json({
        success: false,
        message: 'No 2FA setup in progress. Please start setup first.'
      });
    }

    // Verify token
    console.log('2FA Verify - Attempting verification with secret');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token: cleanToken,
      window: 2 // Allow 2 time steps before/after for clock skew
    });

    console.log('2FA Verify - Verification result:', verified);

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your authenticator app and try again.'
      });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
    }

    // Hash backup codes before storing
    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save({ validateBeforeSave: false });

    console.log('2FA Verify - Success! 2FA enabled for user:', user.email);

    res.json({
      success: true,
      message: 'Two-Factor Authentication enabled successfully',
      data: {
        backupCodes // Return unhashed codes once for user to save
      }
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify Two-Factor Authentication',
      error: error.message
    });
  }
});

// @desc    Disable Two-Factor Authentication
// @route   POST /api/auth/2fa/disable
// @access  Private
router.post('/2fa/disable', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-Factor Authentication is not enabled'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Two-Factor Authentication disabled successfully'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable Two-Factor Authentication',
      error: error.message
    });
  }
});

// @desc    Get Backup Codes
// @route   GET /api/auth/2fa/backup-codes
// @access  Private
router.get('/2fa/backup-codes', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-Factor Authentication is not enabled'
      });
    }

    // Return masked backup codes (can't show original)
    const maskedCodes = (user.twoFactorBackupCodes || []).map((_, index) => 
      `****-****-${index + 1}`
    );

    res.json({
      success: true,
      data: {
        backupCodes: maskedCodes,
        count: user.twoFactorBackupCodes?.length || 0
      }
    });

  } catch (error) {
    console.error('Get backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backup codes',
      error: error.message
    });
  }
});

// @desc    Regenerate Backup Codes
// @route   POST /api/auth/2fa/regenerate-backup-codes
// @access  Private
router.post('/2fa/regenerate-backup-codes', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-Factor Authentication is not enabled'
      });
    }

    // Generate new backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
    }

    // Hash backup codes before storing
    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes // Return unhashed codes once for user to save
      }
    });

  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate backup codes',
      error: error.message
    });
  }
});

// @desc    Verify 2FA Token (for login)
// @route   POST /api/auth/2fa/verify-login
// @access  Public (but requires valid login session)
router.post('/2fa/verify-login', async (req, res) => {
  try {
    const { email, token, isBackupCode } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: 'Email and token are required'
      });
    }

    const user = await User.findOne({ email }).select('+password +twoFactorSecret +twoFactorBackupCodes');

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    let verified = false;

    if (isBackupCode) {
      // Verify backup code
      const hashedCode = crypto.createHash('sha256').update(token.toUpperCase()).digest('hex');
      const codeIndex = user.twoFactorBackupCodes.indexOf(hashedCode);
      
      if (codeIndex !== -1) {
        verified = true;
        // Remove used backup code
        user.twoFactorBackupCodes.splice(codeIndex, 1);
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
    }

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Generate JWT token (2FA verified)
    const authToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Two-Factor Authentication verified',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          twoFactorEnabled: user.twoFactorEnabled
        },
        token: authToken
      }
    });

  } catch (error) {
    console.error('2FA login verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

router.get('/2fa/test-verify', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorTempSecret +twoFactorSecret');
    
    if (!user) {
      return res.json({ error: 'User not found' });
    }

    // Get current time-based token
    const currentToken = speakeasy.totp({
      secret: user.twoFactorTempSecret || user.twoFactorSecret,
      encoding: 'base32'
    });

    res.json({
      userId: user._id,
      email: user.email,
      hasTempSecret: !!user.twoFactorTempSecret,
      hasSecret: !!user.twoFactorSecret,
      twoFactorEnabled: user.twoFactorEnabled,
      tempSecretPreview: user.twoFactorTempSecret ? user.twoFactorTempSecret.substring(0, 10) + '...' : null,
      secretPreview: user.twoFactorSecret ? user.twoFactorSecret.substring(0, 10) + '...' : null,
      currentValidToken: currentToken,
      note: 'This is the token that should work right now from your authenticator app'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;