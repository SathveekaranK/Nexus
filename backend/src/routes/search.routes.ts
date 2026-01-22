import express from 'express';
import { globalSearch } from '../controllers/search.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/global', authMiddleware, globalSearch);

export default router;
