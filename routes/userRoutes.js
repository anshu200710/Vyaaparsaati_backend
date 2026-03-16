import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import { 
    getAllUsers, 
    getUserById, 
    updateUserRole, 
    deleteUser,
    getCurrentUser 
} from '../controllers/userController.js';

const router = express.Router();

// Get current logged-in user profile (requires token)
router.get('/profile', verifyToken, getCurrentUser);

// Admin only routes
router.get('/all', verifyAdmin, getAllUsers);
router.get('/:id', verifyAdmin, getUserById);
router.put('/:id/role', verifyAdmin, updateUserRole);
router.delete('/:id', verifyAdmin, deleteUser);

export default router;
