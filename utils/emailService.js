import nodemailer from 'nodemailer';

// Generate random 6-digit verification code
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send verification email
export const sendVerificationEmail = async (email, verificationCode) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification Code - VYAAPAAR',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1E4FA3;">Email Verification</h2>
                <p>Your verification code is:</p>
                <h1 style="color: #2ECC71; font-size: 36px; letter-spacing: 5px;">${verificationCode}</h1>
                <p>This code will expire in <strong>1 minute</strong>.</p>
                <p style="color: #666;">Do not share this code with anyone.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}`);
        return { success: true, code: verificationCode };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        console.error('Email config:', {
            user: process.env.EMAIL_USER,
            hasPassword: !!process.env.EMAIL_PASSWORD
        });
        // Return code in response for testing (remove in production)
        return { success: false, code: verificationCode, error: error.message };
    }
};

// Send password reset email (optional)
export const sendPasswordResetEmail = async (email, resetToken) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset',
        html: `
            <h2>Password Reset</h2>
            <p>Your password reset token is:</p>
            <h1>${resetToken}</h1>
            <p>This token will expire in 1 hour.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};
