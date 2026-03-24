import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import { singleFileUpload } from '../middleware/multer.js';
import {
    createNews,
    getAllNews,
    getNewsById,
    getNewsByCategory,
    updateNews,
    deleteNews,
    getAllNewsAdmin
} from '../controllers/newsController.js';

const router = express.Router();

// Public routes
router.get('/', getAllNews);
router.get('/:id', getNewsById);
router.get('/category/:category', getNewsByCategory);

// Admin-only routes
router.post('/', verifyAdmin, singleFileUpload, createNews);
router.put('/:id', verifyAdmin, singleFileUpload, updateNews);
router.delete('/:id', verifyAdmin, deleteNews);
router.get('/admin/all', verifyAdmin, getAllNewsAdmin);

export default router;
