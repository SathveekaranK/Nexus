import { Request, Response } from 'express';

export const uploadFile = (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Construct public URL
        // Assumes 'uploads' is served statically from root
        const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
