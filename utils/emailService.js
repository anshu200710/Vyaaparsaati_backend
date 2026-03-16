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
        subject: 'Email Verification Code',
        html: `
            <h2>Email Verification</h2>
            <p>Your verification code is:</p>
            <h1>${verificationCode}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>Do not share this code with anyone.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
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
