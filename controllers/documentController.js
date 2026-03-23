import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

// Helper function to upload file to Cloudinary
const uploadToCloudinary = async (fileBuffer, fileName, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: `kyc/${folder}`,
                public_id: `${Date.now()}_${fileName}`,
                overwrite: true
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        Readable.from(fileBuffer).pipe(stream);
    });
};

// Upload PAN Card
export const uploadPANCard = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'PAN card image is required' });
        }

        const userId = req.user.id;
        const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            `pan_${userId}`,
            'pan_cards'
        );

        // Delete old file from Cloudinary if exists
        const user = await User.findById(userId);
        if (user.documents?.panCard?.fileId) {
            try {
                await cloudinary.uploader.destroy(user.documents.panCard.fileId);
            } catch (err) {
                console.log('Error deleting old file:', err);
            }
        }

        // Update user document
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                'documents.panCard': {
                    fileUrl: uploadResult.secure_url,
                    fileId: uploadResult.public_id,
                    uploadedAt: new Date(),
                    verified: false
                }
            },
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'PAN card uploaded successfully',
            document: uploadResult.secure_url,
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload PAN card error:', error);
        res.status(500).json({ error: 'Failed to upload PAN card' });
    }
};

// Upload Aadhaar Card (Front and Back)
export const uploadAadhaarCard = async (req, res) => {
    try {
        const { side } = req.body; // 'front' or 'back'

        if (!req.file) {
            return res.status(400).json({ error: 'Aadhaar card image is required' });
        }

        if (!side || !['front', 'back'].includes(side)) {
            return res.status(400).json({ error: 'Side must be either "front" or "back"' });
        }

        const userId = req.user.id;
        const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            `aadhaar_${side}_${userId}`,
            'aadhaar_cards'
        );

        // Get current user data
        const user = await User.findById(userId);
        const aadhaarData = {
            front: user.documents?.aadhaarCard?.front || {},
            back: user.documents?.aadhaarCard?.back || {}
        };

        // Delete old file if exists
        if (aadhaarData[side]?.fileId) {
            try {
                await cloudinary.uploader.destroy(aadhaarData[side].fileId);
            } catch (err) {
                console.log('Error deleting old file:', err);
            }
        }

        // Update the specific side
        aadhaarData[side] = {
            fileUrl: uploadResult.secure_url,
            fileId: uploadResult.public_id,
            uploadedAt: new Date()
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                'documents.aadhaarCard': aadhaarData
            },
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: `Aadhaar card ${side} uploaded successfully`,
            document: uploadResult.secure_url,
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload Aadhaar card error:', error);
        res.status(500).json({ error: 'Failed to upload Aadhaar card' });
    }
};

// Upload GST Certificate
export const uploadGSTCertificate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'GST certificate is required' });
        }

        const userId = req.user.id;
        const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            `gst_${userId}`,
            'gst_certificates'
        );

        const user = await User.findById(userId);
        if (user.documents?.gstCertificate?.fileId) {
            try {
                await cloudinary.uploader.destroy(user.documents.gstCertificate.fileId);
            } catch (err) {
                console.log('Error deleting old file:', err);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                'documents.gstCertificate': {
                    fileUrl: uploadResult.secure_url,
                    fileId: uploadResult.public_id,
                    uploadedAt: new Date(),
                    verified: false
                }
            },
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'GST certificate uploaded successfully',
            document: uploadResult.secure_url,
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload GST certificate error:', error);
        res.status(500).json({ error: 'Failed to upload GST certificate' });
    }
};

// Upload Business Proof
export const uploadBusinessProof = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Business proof is required' });
        }

        const userId = req.user.id;
        const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            `business_proof_${userId}`,
            'business_proofs'
        );

        const user = await User.findById(userId);
        if (user.documents?.businessProof?.fileId) {
            try {
                await cloudinary.uploader.destroy(user.documents.businessProof.fileId);
            } catch (err) {
                console.log('Error deleting old file:', err);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                'documents.businessProof': {
                    fileUrl: uploadResult.secure_url,
                    fileId: uploadResult.public_id,
                    uploadedAt: new Date(),
                    verified: false
                }
            },
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'Business proof uploaded successfully',
            document: uploadResult.secure_url,
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload business proof error:', error);
        res.status(500).json({ error: 'Failed to upload business proof' });
    }
};

// Upload Bank Statement
export const uploadBankStatement = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Bank statement is required' });
        }

        const userId = req.user.id;
        const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            `bank_statement_${userId}`,
            'bank_statements'
        );

        const user = await User.findById(userId);
        if (user.documents?.bankStatement?.fileId) {
            try {
                await cloudinary.uploader.destroy(user.documents.bankStatement.fileId);
            } catch (err) {
                console.log('Error deleting old file:', err);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                'documents.bankStatement': {
                    fileUrl: uploadResult.secure_url,
                    fileId: uploadResult.public_id,
                    uploadedAt: new Date(),
                    verified: false
                }
            },
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'Bank statement uploaded successfully',
            document: uploadResult.secure_url,
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload bank statement error:', error);
        res.status(500).json({ error: 'Failed to upload bank statement' });
    }
};

// Upload Electricity Bill
export const uploadElectricityBill = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Electricity bill is required' });
        }

        const userId = req.user.id;
        const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            `electricity_bill_${userId}`,
            'electricity_bills'
        );

        const user = await User.findById(userId);
        if (user.documents?.electricityBill?.fileId) {
            try {
                await cloudinary.uploader.destroy(user.documents.electricityBill.fileId);
            } catch (err) {
                console.log('Error deleting old file:', err);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                'documents.electricityBill': {
                    fileUrl: uploadResult.secure_url,
                    fileId: uploadResult.public_id,
                    uploadedAt: new Date(),
                    verified: false
                }
            },
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'Electricity bill uploaded successfully',
            document: uploadResult.secure_url,
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload electricity bill error:', error);
        res.status(500).json({ error: 'Failed to upload electricity bill' });
    }
};

// Upload Address Proof
export const uploadAddressProof = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Address proof is required' });
        }

        const userId = req.user.id;
        const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            `address_proof_${userId}`,
            'address_proofs'
        );

        const user = await User.findById(userId);
        if (user.documents?.addressProof?.fileId) {
            try {
                await cloudinary.uploader.destroy(user.documents.addressProof.fileId);
            } catch (err) {
                console.log('Error deleting old file:', err);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                'documents.addressProof': {
                    fileUrl: uploadResult.secure_url,
                    fileId: uploadResult.public_id,
                    uploadedAt: new Date(),
                    verified: false
                }
            },
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'Address proof uploaded successfully',
            document: uploadResult.secure_url,
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload address proof error:', error);
        res.status(500).json({ error: 'Failed to upload address proof' });
    }
};

// Upload Photographs (multiple)
export const uploadPhotographs = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'At least one photograph is required' });
        }

        if (req.files.length > 5) {
            return res.status(400).json({ error: 'Maximum 5 photographs allowed' });
        }

        const userId = req.user.id;
        const uploadPromises = req.files.map((file) =>
            uploadToCloudinary(
                file.buffer,
                `photo_${userId}_${Date.now()}`,
                'photographs'
            )
        );

        const uploadResults = await Promise.all(uploadPromises);

        const photographData = uploadResults.map(result => ({
            fileUrl: result.secure_url,
            fileId: result.public_id,
            uploadedAt: new Date()
        }));

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                'documents.photographs': photographData
            },
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'Photographs uploaded successfully',
            documents: photographData,
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload photographs error:', error);
        res.status(500).json({ error: 'Failed to upload photographs' });
    }
};

// Delete a document
export const deleteDocument = async (req, res) => {
    try {
        const { documentType } = req.body;
        const userId = req.user.id;

        if (!documentType) {
            return res.status(400).json({ error: 'Document type is required' });
        }

        const user = await User.findById(userId);
        const docPath = `documents.${documentType}`;
        const doc = eval(`user.${docPath}`);

        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from Cloudinary
        if (doc.fileId) {
            try {
                await cloudinary.uploader.destroy(doc.fileId);
            } catch (err) {
                console.log('Error deleting file from Cloudinary:', err);
            }
        }

        // Delete from database
        const updateObj = {};
        updateObj[docPath] = null;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateObj,
            { new: true }
        ).select('-password -verificationCode -verificationCodeExpiry');

        res.status(200).json({
            message: 'Document deleted successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};

// Get all documents for user
export const getAllDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('documents');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'Documents retrieved successfully',
            documents: user.documents
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to retrieve documents' });
    }
};
