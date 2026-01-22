import { Router } from 'express';
import { chat, getHistory, generateSmartReplies, summarizeChat } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/chat', authMiddleware, chat);
router.get('/history', authMiddleware, getHistory);
router.post('/smart-reply', authMiddleware, generateSmartReplies);
router.post('/summarize', authMiddleware, summarizeChat); // [NEW]

export default router;
