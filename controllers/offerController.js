import Offer from '../models/Offer.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const uploadToCloudinary = async (fileBuffer, fileName, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: `offers/${folder}`,
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

export const createOffer = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Banner image is required.' });
        }

        const uploadResult = await uploadToCloudinary(req.file.buffer, `offer_${Date.now()}`, 'banners');

        const offer = new Offer({
            title,
            description,
            bannerUrl: uploadResult.secure_url,
            bannerId: uploadResult.public_id,
            createdBy: req.user.id
        });

        await offer.save();

        res.status(201).json({ message: 'Offer created successfully', data: offer });
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllOffers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { isActive: true };
        const total = await Offer.countDocuments(query);
        const offers = await Offer.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            count: offers.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: offers
        });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getOfferById = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id);

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        res.json(offer);
    } catch (error) {
        console.error('Error fetching offer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, isActive } = req.body;

        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        if (title) offer.title = title;
        if (description) offer.description = description;
        if (typeof isActive !== 'undefined') offer.isActive = isActive;

        if (req.file) {
            // Upload new banner, delete old one
            const uploadResult = await uploadToCloudinary(req.file.buffer, `offer_${Date.now()}`, 'banners');
            try {
                if (offer.bannerId) await cloudinary.uploader.destroy(offer.bannerId);
            } catch (err) {
                console.warn('Failed to delete old offer banner from Cloudinary:', err);
            }
            offer.bannerUrl = uploadResult.secure_url;
            offer.bannerId = uploadResult.public_id;
        }

        await offer.save();

        res.json({ message: 'Offer updated successfully', data: offer });
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;

        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        if (offer.bannerId) {
            try {
                await cloudinary.uploader.destroy(offer.bannerId);
            } catch (err) {
                console.warn('Failed to remove banner from Cloudinary:', err);
            }
        }

        await Offer.findByIdAndDelete(id);

        res.json({ message: 'Offer deleted successfully', data: offer });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
