import { Router } from 'express';
import { upload } from '../middleware/upload';
import { uploadFile } from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/files/upload
router.post('/upload', authMiddleware, upload.single('file'), uploadFile);

export default router;
