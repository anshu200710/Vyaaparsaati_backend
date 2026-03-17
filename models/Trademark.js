import mongoose from 'mongoose';

const trademarkSchema = new mongoose.Schema({
    application_number: {
        type: String,
        required: true,
        unique: true
    },
    brand_name: {
        type: String,
        required: true,
        index: true
    },
    owner: {
        type: String,
        default: ''
    },
    class: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: ''
    },
    filed_date: {
        type: String,
        default: ''
    },
    source_query: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Full-text index on brand_name for fast searches
trademarkSchema.index({ brand_name: 'text' });

// Regular indexes for class + status filters
trademarkSchema.index({ class: 1 });
trademarkSchema.index({ status: 1 });

export default mongoose.model('Trademark', trademarkSchema);
