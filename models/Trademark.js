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
        required: true
    },
    class: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    filed_date: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Trademark', trademarkSchema);
