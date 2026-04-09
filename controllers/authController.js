import User from '../models/User.js';
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

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already registered',
                error: 'Email exists'
            });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user
        const user = new User({
            firstName,
            lastName,
            email,
            password,
            accountType,
            phoneNumber,
            businessName: accountType === 'business' ? businessName : undefined,
            role: 'user',
            isEmailVerified: false,
            verificationCode,
            verificationCodeExpiry
        });

        await user.save();

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

        // Send verification email
        const emailSent = await sendVerificationEmail(email, verificationCode);

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Verification code sent to email.',
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

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found',
                error: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already verified',
                error: 'Already verified'
            });
        }

        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid verification code',
                error: 'Invalid code'
            });
        }

        if (new Date() > user.verificationCodeExpiry) {
            return res.status(400).json({ 
                success: false,
                message: 'Verification code has expired',
                error: 'Code expired'
            });
        }

        user.isEmailVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpiry = null;
        await user.save();

        // Generate tokens after verification
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
            message: 'Email verified successfully',
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

        if (!user.isEmailVerified) {
            return res.status(403).json({ 
                success: false,
                message: 'Please verify your email first',
                error: 'Email not verified'
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

        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required',
                error: 'Missing email'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found',
                error: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already verified',
                error: 'Already verified'
            });
        }

        const verificationCode = generateVerificationCode();
        const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = verificationCodeExpiry;
        await user.save();

        const emailSent = await sendVerificationEmail(email, verificationCode);

        if (!emailSent) {
            return res.status(500).json({ 
                success: false,
                message: 'Failed to send verification email',
                error: 'Email send failed'
            });
        }

        res.json({ 
            success: true,
            message: 'Verification code resent to email'
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
