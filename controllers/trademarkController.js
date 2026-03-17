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

// Check trademark availability with advanced search
export const checkTrademark = async (req, res) => {
    const { name, class: tmClass } = req.query;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Provide at least 2 characters in "name".' });
    }

    const query = name.trim();

    try {
        // Build shared filter
        const classFilter = tmClass ? { class: tmClass } : {};

        // 1. Full-text search
        const textResults = await Trademark.find(
            { $text: { $search: query }, ...classFilter },
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .limit(50)
            .lean();

        // 2. Regex search (case-insensitive)
        const regexResults = await Trademark.find({
            brand_name: { $regex: query, $options: 'i' },
            ...classFilter,
        })
            .limit(50)
            .lean();

        // Merge & de-duplicate
        const seen = new Set();
        const merged = [];

        for (const r of [...textResults, ...regexResults]) {
            if (!seen.has(r.application_number)) {
                seen.add(r.application_number);
                merged.push(r);
            }
        }

        // Exact match check
        const exactMatches = merged.filter(
            r => r.brand_name.toLowerCase() === query.toLowerCase()
        );

        const available = merged.length === 0;
        const hasExact = exactMatches.length > 0;

        // Clean up mongoose _id fields for the response
        const results = merged.slice(0, 20).map(({ _id, __v, score, ...rest }) => rest);

        return res.json({
            query,
            available,
            has_exact_match: hasExact,
            count: merged.length,
            results,
        });

    } catch (err) {
        console.error('[ERROR] /api/check:', err.message);
        return res.status(500).json({ error: 'Database query failed: ' + err.message });
    }
};

// Get trademark statistics
export const getStats = async (req, res) => {
    try {
        const total = await Trademark.countDocuments();
        const statuses = await Trademark.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        return res.json({ total_trademarks: total, by_status: statuses });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Health check endpoint
export const getHealth = (req, res) => {
    res.json({ ok: true });
};
