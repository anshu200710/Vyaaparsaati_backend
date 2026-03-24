import Conversation from '../models/Conversation.js';
import { askGemini } from '../config/gemini.js';

// Start a new conversation
export const startConversation = async (req, res) => {
    try {
        const { subject } = req.body;
        const userId = req.user.id;

        // For now, assign to first admin (in production, use assignment logic)
        const adminId = req.body.adminId; // Should be provided or system-assigned

        if (!adminId) {
            return res.status(400).json({ error: 'Admin ID is required' });
        }

        const conversation = new Conversation({
            userId,
            adminId,
            subject: subject || `Conversation with ${req.user.name}`,
            messages: []
        });

        await conversation.save();
        await conversation.populate('userId adminId', 'name email');

        res.status(201).json({ 
            message: 'Conversation started successfully', 
            data: conversation 
        });
    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user is part of this conversation
        if (conversation.userId.toString() !== userId && conversation.adminId.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to this conversation' });
        }

        // Determine sender role
        const isAdmin = conversation.adminId.toString() === userId;
        const sender = isAdmin ? 'admin' : 'user';

        // Add message
        conversation.messages.push({
            sender,
            senderName: req.user.name,
            senderId: userId,
            message: message.trim(),
            timestamp: new Date()
        });

        // If AI chat is enabled and sender is user, generate bot response
        if (conversation.aiChatEnabled && sender === 'user') {
            try {
                const aiResponse = await askGemini(message);

                conversation.messages.push({
                    sender: 'bot',
                    senderName: 'ChatBot',
                    message: aiResponse,
                    timestamp: new Date()
                });
            } catch (aiError) {
                console.warn('AI response generation failed:', aiError.message);
                // Continue without AI response
            }
        }

        conversation.updatedAt = new Date();
        await conversation.save();
        await conversation.populate('userId adminId', 'name email');

        res.json({ 
            message: 'Message sent successfully', 
            data: conversation 
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get conversation by ID
export const getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId)
            .populate('userId', 'name email')
            .populate('adminId', 'name email');

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check authorization
        if (conversation.userId._id.toString() !== userId && conversation.adminId._id.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List conversations for current user
export const listUserConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Conversation.countDocuments({
            $or: [{ userId }, { adminId: userId }]
        });

        const conversations = await Conversation.find({
            $or: [{ userId }, { adminId: userId }]
        })
            .populate('userId', 'name email')
            .populate('adminId', 'name email')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            count: conversations.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: conversations
        });
    } catch (error) {
        console.error('Error listing conversations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: List all conversations
export const listAllConversations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        const query = {};
        if (status) query.status = status;

        const total = await Conversation.countDocuments(query);
        const conversations = await Conversation.find(query)
            .populate('userId', 'name email')
            .populate('adminId', 'name email')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            count: conversations.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: conversations
        });
    } catch (error) {
        console.error('Error listing conversations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Enable AI chat
export const enableAiChat = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Only admin or conversation owner can enable AI
        if (conversation.adminId.toString() !== userId && conversation.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        conversation.aiChatEnabled = true;
        await conversation.save();

        res.json({ 
            message: 'AI chat enabled successfully', 
            data: conversation 
        });
    } catch (error) {
        console.error('Error enabling AI chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Disable AI chat
export const disableAiChat = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Only admin or conversation owner can disable AI
        if (conversation.adminId.toString() !== userId && conversation.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        conversation.aiChatEnabled = false;
        await conversation.save();

        res.json({ 
            message: 'AI chat disabled successfully', 
            data: conversation 
        });
    } catch (error) {
        console.error('Error disabling AI chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Close conversation
export const closeConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Only admin can close
        if (conversation.adminId.toString() !== userId) {
            return res.status(403).json({ error: 'Only admin can close conversation' });
        }

        conversation.status = 'closed';
        await conversation.save();

        res.json({ 
            message: 'Conversation closed successfully', 
            data: conversation 
        });
    } catch (error) {
        console.error('Error closing conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
