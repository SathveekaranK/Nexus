import express from 'express';
import { getMessages, sendMessage } from '../controllers/message.controller';

const router = express.Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get messages between current user and another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the other user
 *     responses:
 *       200:
 *         description: List of messages
 *       500:
 *         description: Server error
 */
router.get('/', getMessages);

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       500:
 *         description: Server error
 */
router.post('/', sendMessage);

export default router;
