import mongoose from 'mongoose';

const pendingRegistrationSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        enum: ['individual', 'business', 'lawyer'],
        required: true
    },
    businessName: {
        type: String,
        default: null
    },
    verificationCode: {
        type: String,
        required: true
    },
    verificationCodeExpiry: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 24 * 60 * 60 // Auto-delete after 24 hours
    }
});

const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);

export default PendingRegistration;