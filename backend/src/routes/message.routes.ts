import express from 'express';
import { getMessages, sendMessage, markMessageRead } from '../controllers/message.controller';
import { addReaction, updateMessage, deleteMessage } from '../controllers/message-actions.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authMiddleware); // Apply to all message routes

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get messages for a channel or DM
 *     tags: [Messages]
 */
router.get('/', getMessages);

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a new message
 *     tags: [Messages]
 */
router.post('/', sendMessage);
router.post('/:messageId/read', markMessageRead);

// Message actions
router.post('/:messageId/reactions', addReaction);
router.put('/:messageId', updateMessage);
router.delete('/:messageId', deleteMessage);

export default router;
