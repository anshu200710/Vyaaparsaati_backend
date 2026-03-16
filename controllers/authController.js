import User from '../models/User.js';
import { generateVerificationCode, sendVerificationEmail } from '../utils/emailService.js';
import jwt from 'jsonwebtoken';

// Register user
export const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ 
                error: 'Passwords do not match' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'Email already registered' 
            });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user with default role 'user'
        const user = new User({
            name,
            email,
            password,
            role: 'user', // Default role
            verificationCode,
            verificationCodeExpiry
        });

        await user.save();

        // Send verification email
        const emailSent = await sendVerificationEmail(email, verificationCode);

        if (!emailSent) {
            return res.status(500).json({ 
                error: 'Failed to send verification email' 
            });
        }

        res.status(201).json({
            message: 'User registered. Verification code sent to email.',
            email: email
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Verify email
export const verifyEmail = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;

        if (!email || !verificationCode) {
            return res.status(400).json({ 
                error: 'Email and verification code are required' 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ 
                error: 'Email already verified' 
            });
        }

        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({ 
                error: 'Invalid verification code' 
            });
        }

        if (new Date() > user.verificationCodeExpiry) {
            return res.status(400).json({ 
                error: 'Verification code has expired' 
            });
        }

        user.isEmailVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpiry = null;
        await user.save();

        res.json({ 
            message: 'Email verified successfully' 
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({ 
                error: 'Please verify your email first' 
            });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Resend verification code
export const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                error: 'Email is required' 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ 
                error: 'Email already verified' 
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
                error: 'Failed to send verification email' 
            });
        }

        res.json({ 
            message: 'Verification code resent to email' 
        });
    } catch (error) {
        console.error('Resend verification code error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};
