import User from '../models/User.js';

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password -verificationCode -verificationCodeExpiry');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile retrieved successfully',
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update basic profile information
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { phone, address, isCompany, companyName, gstNumber, businessType } = req.body;

        // Validation
        if (phone && !/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({ error: 'Phone number must be 10 digits' });
        }

        if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
            return res.status(400).json({ error: 'Invalid GST number format' });
        }

        if (isCompany && !companyName) {
            return res.status(400).json({ error: 'Company name is required when isCompany is true' });
        }

        // Update user profile
        const updateData = {
            profile: {
                phone: phone || undefined,
                address: address || undefined,
                isCompany: isCompany !== undefined ? isCompany : undefined,
                companyName: companyName || undefined,
                gstNumber: gstNumber || undefined,
                businessType: businessType || undefined
            }
        };

        // Remove undefined values
        Object.keys(updateData.profile).forEach(key => {
            if (updateData.profile[key] === undefined) {
                delete updateData.profile[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            userId,
            {
                'profile': { ...req.body.currentProfile, ...updateData.profile }
            },
            { new: true, runValidators: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get KYC status
export const getKYCStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('kycStatus kycRejectionReason documents');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const documentsStatus = {
            panCard: user.documents?.panCard?.verified || false,
            aadhaarCard: user.documents?.aadhaarCard?.verified || false,
            gstCertificate: user.documents?.gstCertificate?.verified || false,
            businessProof: user.documents?.businessProof?.verified || false,
            bankStatement: user.documents?.bankStatement?.verified || false,
            electricityBill: user.documents?.electricityBill?.verified || false,
            addressProof: user.documents?.addressProof?.verified || false,
            photographs: (user.documents?.photographs?.length || 0) > 0
        };

        res.status(200).json({
            message: 'KYC status retrieved successfully',
            kycStatus: user.kycStatus,
            kycRejectionReason: user.kycRejectionReason,
            documentsStatus
        });
    } catch (error) {
        console.error('Get KYC status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete user profile (soft delete - set to null/default)
export const deleteProfileData = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findByIdAndUpdate(
            userId,
            {
                profile: {
                    phone: null,
                    address: null,
                    isCompany: false,
                    companyName: null,
                    gstNumber: null,
                    businessType: null
                },
                kycStatus: 'pending',
                kycRejectionReason: null
            },
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'Profile data deleted successfully',
            user
        });
    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
