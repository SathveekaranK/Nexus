import express from 'express';
import { createRoom, getRoom } from '../controllers/room.controller';

const router = express.Router();

/**
 * @swagger
 * /api/rooms/create:
 *   post:
 *     summary: Create a new music room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Room created successfully
 *       500:
 *         description: Server error
 */
router.post('/create', createRoom);

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Get room details and current song state
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room data
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get('/:roomId', getRoom);

export default router;
