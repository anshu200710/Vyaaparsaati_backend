import Trademark from '../models/Trademark.js';

// Search trademarks
export const searchTrademarks = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({ 
                error: 'Search query parameter "q" is required' 
            });
        }

        const trademarks = await Trademark.find({
            brand_name: { $regex: q, $options: 'i' }
        }).limit(20);

        res.json({
            count: trademarks.length,
            data: trademarks
        });
    } catch (error) {
        console.error('Error searching trademarks:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Get all trademarks (with pagination)
export const getAllTrademarks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const trademarks = await Trademark.find()
            .skip(skip)
            .limit(limit);

        const total = await Trademark.countDocuments();

        res.json({
            count: trademarks.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: trademarks
        });
    } catch (error) {
        console.error('Error fetching trademarks:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Get single trademark by ID
export const getTrademarkById = async (req, res) => {
    try {
        const { id } = req.params;

        const trademark = await Trademark.findById(id);

        if (!trademark) {
            return res.status(404).json({ 
                error: 'Trademark not found' 
            });
        }

        res.json(trademark);
    } catch (error) {
        console.error('Error fetching trademark:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Create trademark
export const createTrademark = async (req, res) => {
    try {
        const { application_number, brand_name, owner, class: trademarkClass, status, filed_date } = req.body;

        // Validation
        if (!application_number || !brand_name || !owner || !trademarkClass || !status || !filed_date) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }

        // Check if trademark already exists
        const existingTrademark = await Trademark.findOne({ application_number });
        if (existingTrademark) {
            return res.status(400).json({ 
                error: 'Trademark with this application number already exists' 
            });
        }

        const trademark = new Trademark({
            application_number,
            brand_name,
            owner,
            class: trademarkClass,
            status,
            filed_date
        });

        await trademark.save();

        res.status(201).json({
            message: 'Trademark created successfully',
            data: trademark
        });
    } catch (error) {
        console.error('Error creating trademark:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Update trademark
export const updateTrademark = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand_name, owner, class: trademarkClass, status, filed_date } = req.body;

        const trademark = await Trademark.findById(id);

        if (!trademark) {
            return res.status(404).json({ 
                error: 'Trademark not found' 
            });
        }

        // Update fields if provided
        if (brand_name) trademark.brand_name = brand_name;
        if (owner) trademark.owner = owner;
        if (trademarkClass) trademark.class = trademarkClass;
        if (status) trademark.status = status;
        if (filed_date) trademark.filed_date = filed_date;

        await trademark.save();

        res.json({
            message: 'Trademark updated successfully',
            data: trademark
        });
    } catch (error) {
        console.error('Error updating trademark:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Delete trademark
export const deleteTrademark = async (req, res) => {
    try {
        const { id } = req.params;

        const trademark = await Trademark.findByIdAndDelete(id);

        if (!trademark) {
            return res.status(404).json({ 
                error: 'Trademark not found' 
            });
        }

        res.json({
            message: 'Trademark deleted successfully',
            data: trademark
        });
    } catch (error) {
        console.error('Error deleting trademark:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};
