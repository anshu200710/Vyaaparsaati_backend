import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['user', 'admin', 'bot'],
        required: true
    },
    senderName: String,
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        default: 'New Conversation'
    },
    messages: [messageSchema],
    aiChatEnabled: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'archived'],
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ adminId: 1, createdAt: -1 });
conversationSchema.index({ status: 1 });

export default mongoose.model('Conversation', conversationSchema);
