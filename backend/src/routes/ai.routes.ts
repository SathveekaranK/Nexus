import { Router } from 'express';
import { chat } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/chat', authMiddleware, chat);

export default router;
