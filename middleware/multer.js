import multer from 'multer';
import path from 'path';

// Configure storage (in memory for direct Cloudinary upload)
const storage = multer.memoryStorage();

// File filter to validate document types
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

export const singleFileUpload = upload.single('document');
export const multipleFilesUpload = upload.array('documents', 5);
export default upload;
