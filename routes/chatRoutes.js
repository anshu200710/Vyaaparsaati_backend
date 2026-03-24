import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import {
    startConversation,
    sendMessage,
    getConversation,
    listUserConversations,
    listAllConversations,
    enableAiChat,
    disableAiChat,
    closeConversation
} from '../controllers/chatController.js';

const router = express.Router();

// Protected routes (authenticated users)
router.post('/start', verifyToken, startConversation);
router.post('/:conversationId/message', verifyToken, sendMessage);
router.get('/:conversationId', verifyToken, getConversation);
router.get('/', verifyToken, listUserConversations);
router.put('/:conversationId/enable-bot', verifyToken, enableAiChat);
router.put('/:conversationId/disable-bot', verifyToken, disableAiChat);

// Admin routes
router.get('/admin/all', verifyAdmin, listAllConversations);
router.put('/:conversationId/close', verifyAdmin, closeConversation);

export default router;
