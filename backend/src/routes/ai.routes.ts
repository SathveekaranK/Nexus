import { Router } from 'express';
import { chat, getHistory } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/chat', authMiddleware, chat);
router.get('/history', authMiddleware, getHistory);

export default router;
