import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import { generateVerificationCode, sendVerificationEmail } from '../utils/emailService.js';
import jwt from 'jsonwebtoken';

// Register user
export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, accountType, phoneNumber, businessName } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password || !confirmPassword || !accountType || !phoneNumber) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required',
                error: 'Missing required fields'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ 
                success: false,
                message: 'Passwords do not match',
                error: 'Password mismatch'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters',
                error: 'Weak password'
            });
        }

        // Check if user already exists in main User collection
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already registered',
                error: 'Email exists'
            });
        }

        // Check if there's already a pending registration
        const existingPending = await PendingRegistration.findOne({ email });
        if (existingPending) {
            return res.status(400).json({ 
                success: false,
                message: 'A verification code has already been sent. Please verify or try again later.',
                error: 'Pending registration exists'
            });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

        // Save to PENDING collection (NOT in User collection yet)
        const pendingUser = new PendingRegistration({
            firstName,
            lastName,
            email,
            password,
            accountType,
            phoneNumber,
            businessName: accountType === 'business' ? businessName : undefined,
            verificationCode,
            verificationCodeExpiry
        });

        await pendingUser.save();

        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationCode);
        // Check if email was sent successfully
        if (!emailResult.success) {
            console.warn('Email failed to send, but continuing with registration for testing');
            // In production, you might want to return an error here
            // return res.status(500).json({ success: false, message: 'Failed to send verification email' });
        }
        // Return response - user is in pending state
        // Include verification code for testing (remove in production)
        res.status(201).json({
            success: true,
            message: 'Registration initiated. Please verify your email to complete registration.',
            data: {
                pendingUser: {
                    id: pendingUser._id,
                    firstName: pendingUser.firstName,
                    lastName: pendingUser.lastName,
                    email: pendingUser.email,
                    accountType: pendingUser.accountType
                }
            },
            requiresVerification: true,
            verificationCode: emailResult?.code // For testing - remove in production
        });

        return;
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// Verify email
export const verifyEmail = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;

        if (!email || !verificationCode) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and verification code are required',
                error: 'Missing fields'
            });
        }

        // Trim the verification code to remove any whitespace
        const trimmedCode = verificationCode.trim();

        // Look in PENDING collection (not User collection)
        const pendingUser = await PendingRegistration.findOne({ email });

        if (!pendingUser) {
            return res.status(404).json({ 
                success: false,
                message: 'No pending registration found. Please sign up first.',
                error: 'User not found'
            });
        }

        // Check if already verified (shouldn't happen but check anyway)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Clean up pending and return error
            await PendingRegistration.deleteOne({ email });
            return res.status(400).json({ 
                success: false,
                message: 'Email already verified. Please login.',
                error: 'Already verified'
            });
        }

        // Check verification code - must match either trimmed or original
        const codeMatches = pendingUser.verificationCode === trimmedCode || 
                           pendingUser.verificationCode === verificationCode;
        if (!codeMatches) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid verification code',
                error: 'Invalid code'
            });
        }

        // Check expiry
        if (new Date() > pendingUser.verificationCodeExpiry) {
            // Delete expired pending registration
            await PendingRegistration.deleteOne({ email });
            return res.status(400).json({ 
                success: false,
                message: 'Verification code has expired. Please sign up again.',
                error: 'Code expired'
            });
        }

        // Create the actual user in User collection
        const user = new User({
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            email: pendingUser.email,
            password: pendingUser.password, // Will be hashed by pre-save hook
            accountType: pendingUser.accountType,
            phoneNumber: pendingUser.phoneNumber,
            businessName: pendingUser.businessName,
            role: 'user',
            isEmailVerified: true,
            isActive: true,
            verificationCode: null,
            verificationCodeExpiry: null
        });

        await user.save();

        // Delete from pending collection
        await PendingRegistration.deleteOne({ email });

        // Generate tokens
        const accessToken = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Email verified successfully. Your account has been created!',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    accountType: user.accountType,
                    verified: user.isEmailVerified,
                    createdAt: user.createdAt
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required',
                error: 'Missing credentials'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password',
                error: 'Auth failed'
            });
        }

        if (!user.isEmailVerified && user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Please verify your email first',
                error: 'Email not verified'
            });
        }

        if (!user.isActive && user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Your account is not active. Please verify your email.',
                error: 'Account not active'
            });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password',
                error: 'Auth failed'
            });
        }

        // Generate JWT tokens
        const accessToken = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    accountType: user.accountType,
                    role: user.role,
                    verified: user.isEmailVerified,
                    createdAt: user.createdAt
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Resend verification code
export const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        console.log('Resend verification request for:', email);

        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required',
                error: 'Missing email'
            });
        }

        // Check in PENDING collection (not User collection)
        const pendingUser = await PendingRegistration.findOne({ email });

        if (!pendingUser) {
            // Check if already in User collection (verified)
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Email already verified. Please login.',
                    error: 'Already verified'
                });
            }
            return res.status(404).json({ 
                success: false,
                message: 'No pending registration found. Please sign up first.',
                error: 'User not found'
            });
        }

        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

        pendingUser.verificationCode = verificationCode;
        pendingUser.verificationCodeExpiry = verificationCodeExpiry;
        await pendingUser.save();

        console.log('New verification code generated:', verificationCode);

        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationCode);
        
        console.log('Email sent result:', emailResult);

        // Check if email was sent successfully
        if (!emailResult.success) {
            console.warn('Email failed to send, but continuing with resend for testing');
            // In production, you might want to return an error here
            // return res.status(500).json({ 
            //     success: false,
            //     message: 'Failed to send verification email. Please try again.',
            //     error: 'Email send failed'
            // });
        }

        // Return the code in response for testing (remove in production)
        res.json({ 
            success: true,
            message: 'Verification code resent to email',
            verificationCode: emailResult.code // For testing - remove in production
        });
    } catch (error) {
        console.error('Resend verification code error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Logout user (client-side token removal, server just confirms)
export const logout = async (req, res) => {
    try {
        // JWT tokens are stateless - client removes them
        // This endpoint just confirms logout success
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Refresh token
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ 
                success: false,
                message: 'Refresh token is required',
                error: 'Missing token'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken, 
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
        );

        // Find user
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found',
                error: 'User not found'
            });
        }

        // Generate new tokens
        const newAccessToken = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        const newRefreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            data: {
                tokens: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Invalid or expired refresh token',
            error: 'Token expired'
        });
    }
};
