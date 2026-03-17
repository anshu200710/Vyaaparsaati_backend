import express from 'express';
import { 
    searchTrademarks, 
    getAllTrademarks, 
    getTrademarkById, 
    createTrademark, 
    updateTrademark, 
    deleteTrademark,
    checkTrademark,
    getStats,
    getHealth
} from '../controllers/trademarkController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/check', checkTrademark);
router.get('/stats', getStats);
router.get('/health', getHealth);
router.get('/search', searchTrademarks);
router.get('/', getAllTrademarks);
router.get('/:id', getTrademarkById);

// Protected routes (requires authentication)
router.post('/', verifyToken, createTrademark);
router.put('/:id', verifyToken, updateTrademark);
router.delete('/:id', verifyAdmin, deleteTrademark);

export default router;
