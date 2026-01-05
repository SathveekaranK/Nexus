import express from 'express';
import { createChannel, getUserChannels, addMember, leaveChannel, markRead } from '../controllers/channel.controller';

const router = express.Router();

/**
 * @swagger
 * /api/channels:
 *   post:
 *     summary: Create a new channel based on channel creation system
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Channel created successfully
 *       500:
 *         description: Server error
 */
router.post('/', createChannel);

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: Get all channels the user is a member of
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of channels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Channel'
 */
router.get('/', getUserChannels);

/**
 * @swagger
 * /api/channels/{channelId}/members:
 *   post:
 *     summary: Add a member to a channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member added successfully
 *       500:
 *         description: Server error
 */
router.post('/:channelId/members', addMember);

/**
 * @swagger
 * /api/channels/{channelId}/leave:
 *   post:
 *     summary: Leave a channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left the channel
 *       500:
 *         description: Server error
 */
router.post('/:channelId/leave', leaveChannel);
router.post('/:channelId/read', markRead);

export default router;
