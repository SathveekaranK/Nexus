import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

console.log('S3 Config:', {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});

// Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION || 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow Images, Videos, Audio, PDFs, Text, Excel/Word
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/webm',
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, videos, audio, and documents are allowed.'));
    }
};

// Initialize S3 Storage if credentials exist, otherwise fallback to Disk
const useS3 = process.env.USE_S3 === 'true' && !!process.env.AWS_ACCESS_KEY_ID;

let storage;

if (useS3) {
    console.log('Using S3 Storage for uploads');
    storage = multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME || 'nexusapp-storage',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        // acl: 'public-read', // Removed: Bucket has ACLs disabled (Bucket Owner Enforced)
        key: (req, file, cb) => {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueName = `uploads/${Date.now()}-${uuidv4()}-${safeName}`;
            cb(null, uniqueName);
        },
    });
} else {
    console.log('Using Local Disk Storage for uploads');
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueName = `${Date.now()}-${uuidv4()}-${safeName}`;
            cb(null, uniqueName);
        }
    });
}

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: fileFilter
});