import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    addParticipant,
    removeParticipant
} from '../controllers/event.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Calendar events and meetings management
 */

router.post('/', authMiddleware, createEvent);
router.get('/', authMiddleware, getEvents);
router.get('/:id', authMiddleware, getEventById);
router.put('/:id', authMiddleware, updateEvent);
router.delete('/:id', authMiddleware, deleteEvent);
router.post('/:id/participants', authMiddleware, addParticipant);
router.delete('/:id/participants/:userId', authMiddleware, removeParticipant);

export default router;
