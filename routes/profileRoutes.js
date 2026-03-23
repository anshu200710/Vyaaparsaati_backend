import express from 'express';
import { 
    getProfile, 
    updateProfile, 
    getKYCStatus, 
    deleteProfileData 
} from '../controllers/profileController.js';
import { 
    uploadPANCard, 
    uploadAadhaarCard, 
    uploadGSTCertificate, 
    uploadBusinessProof, 
    uploadBankStatement, 
    uploadElectricityBill, 
    uploadAddressProof, 
    uploadPhotographs, 
    deleteDocument, 
    getAllDocuments 
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { singleFileUpload, multipleFilesUpload } from '../middleware/multer.js';

const router = express.Router();

// Profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/kyc-status', authenticate, getKYCStatus);
router.delete('/profile', authenticate, deleteProfileData);

// Document upload routes
router.post('/documents/pan', authenticate, singleFileUpload, uploadPANCard);
router.post('/documents/aadhaar', authenticate, singleFileUpload, uploadAadhaarCard);
router.post('/documents/gst', authenticate, singleFileUpload, uploadGSTCertificate);
router.post('/documents/business-proof', authenticate, singleFileUpload, uploadBusinessProof);
router.post('/documents/bank-statement', authenticate, singleFileUpload, uploadBankStatement);
router.post('/documents/electricity-bill', authenticate, singleFileUpload, uploadElectricityBill);
router.post('/documents/address-proof', authenticate, singleFileUpload, uploadAddressProof);
router.post('/documents/photographs', authenticate, multipleFilesUpload, uploadPhotographs);

// Get and delete documents
router.get('/documents', authenticate, getAllDocuments);
router.delete('/documents', authenticate, deleteDocument);

export default router;
