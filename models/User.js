import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
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
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null
    },
    verificationCodeExpiry: {
        type: Date,
        default: null
    },
    // Profile Information
    profile: {
        phone: {
            type: String,
            default: null,
            match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
        },
        address: {
            type: String,
            default: null
        },
        isCompany: {
            type: Boolean,
            default: false
        },
        companyName: {
            type: String,
            default: null
        },
        gstNumber: {
            type: String,
            default: null,
            match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please provide a valid GST number']
        },
        businessType: {
            type: String,
            enum: ['sole_proprietor', 'partnership', 'pvt_ltd', 'llp', 'individual', null],
            default: null
        }
    },
    // Documents
    documents: {
        panCard: {
            fileUrl: String,
            fileId: String,  // Cloudinary public_id
            uploadedAt: Date,
            verified: {
                type: Boolean,
                default: false
            }
        },
        aadhaarCard: {
            front: {
                fileUrl: String,
                fileId: String,
                uploadedAt: Date
            },
            back: {
                fileUrl: String,
                fileId: String,
                uploadedAt: Date
            },
            verified: {
                type: Boolean,
                default: false
            }
        },
        gstCertificate: {
            fileUrl: String,
            fileId: String,
            uploadedAt: Date,
            verified: {
                type: Boolean,
                default: false
            }
        },
        businessProof: {
            fileUrl: String,
            fileId: String,
            uploadedAt: Date,
            verified: {
                type: Boolean,
                default: false
            }
        },
        bankStatement: {
            fileUrl: String,
            fileId: String,
            uploadedAt: Date,
            verified: {
                type: Boolean,
                default: false
            }
        },
        electricityBill: {
            fileUrl: String,
            fileId: String,
            uploadedAt: Date,
            verified: {
                type: Boolean,
                default: false
            }
        },
        addressProof: {
            fileUrl: String,
            fileId: String,
            uploadedAt: Date,
            verified: {
                type: Boolean,
                default: false
            }
        },
        photographs: [{
            fileUrl: String,
            fileId: String,
            uploadedAt: Date
        }]
    },
    // KYC Status
    kycStatus: {
        type: String,
        enum: ['pending', 'under_review', 'verified', 'rejected'],
        default: 'pending'
    },
    kycRejectionReason: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        this.updatedAt = new Date();
        return;
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
