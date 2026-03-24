import News from '../models/News.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const uploadToCloudinary = async (fileBuffer, fileName, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: `news/${folder}`,
                public_id: `${Date.now()}_${fileName}`,
                overwrite: true
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        Readable.from(fileBuffer).pipe(stream);
    });
};

export const createNews = async (req, res) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'News image is required.' });
        }

        const uploadResult = await uploadToCloudinary(req.file.buffer, `news_${Date.now()}`, 'images');

        const news = new News({
            title,
            description,
            category: category || 'updates',
            imageUrl: uploadResult.secure_url,
            imageId: uploadResult.public_id,
            createdBy: req.user.id
        });

        await news.save();

        res.status(201).json({ message: 'News created successfully', data: news });
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllNews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const category = req.query.category;

        const query = { isPublished: true };
        if (category) {
            query.category = category;
        }

        const total = await News.countDocuments(query);
        const news = await News.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-imageId -createdBy');

        res.json({
            count: news.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: news
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findById(id).select('-imageId -createdBy');

        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }

        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getNewsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const validCategories = ['technology', 'business', 'updates', 'announcement', 'other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const total = await News.countDocuments({ category, isPublished: true });
        const news = await News.find({ category, isPublished: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-imageId -createdBy');

        res.json({
            category,
            count: news.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: news
        });
    } catch (error) {
        console.error('Error fetching news by category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, isPublished } = req.body;

        const news = await News.findById(id);
        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }

        if (title) news.title = title;
        if (description) news.description = description;
        if (category) news.category = category;
        if (typeof isPublished !== 'undefined') news.isPublished = isPublished;

        if (req.file) {
            // Upload new image, delete old one
            const uploadResult = await uploadToCloudinary(req.file.buffer, `news_${Date.now()}`, 'images');
            try {
                if (news.imageId) await cloudinary.uploader.destroy(news.imageId);
            } catch (err) {
                console.warn('Failed to delete old news image from Cloudinary:', err);
            }
            news.imageUrl = uploadResult.secure_url;
            news.imageId = uploadResult.public_id;
        }

        await news.save();

        res.json({ message: 'News updated successfully', data: news });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;

        const news = await News.findById(id);
        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }

        if (news.imageId) {
            try {
                await cloudinary.uploader.destroy(news.imageId);
            } catch (err) {
                console.warn('Failed to remove image from Cloudinary:', err);
            }
        }

        await News.findByIdAndDelete(id);

        res.json({ message: 'News deleted successfully', data: news });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllNewsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const category = req.query.category;

        const query = {};
        if (category) {
            query.category = category;
        }

        const total = await News.countDocuments(query);
        const news = await News.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            count: news.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: news
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
