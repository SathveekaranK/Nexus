import { Request, Response } from 'express';

export const uploadFile = (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // When using multer-s3, the S3 URL is available in req.file.location
        const fileUrl = (req.file as any).location || `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename: (req.file as any).key || req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl
            }
        });
    } catch (error: any) {
        console.error('Upload Controller Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'File upload failed',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
