import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import { singleFileUpload } from '../middleware/multer.js';
import {
    createOffer,
    getAllOffers,
    getOfferById,
    updateOffer,
    deleteOffer
} from '../controllers/offerController.js';

const router = express.Router();

// Public route for listing and viewing offers
router.get('/', getAllOffers);
router.get('/:id', getOfferById);

// Admin-only CRUD routes
router.post('/', verifyAdmin, singleFileUpload, createOffer);
router.put('/:id', verifyAdmin, singleFileUpload, updateOffer);
router.delete('/:id', verifyAdmin, deleteOffer);

export default router;
