import { Request, Response } from 'express';
import { Event } from '../models/Event';
import { AuthRequest } from '../middleware/auth.middleware';
import { createNotification } from './notification.controller';

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [meeting, event, planning]
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *               meetingUrl:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 */
export const createEvent = async (req: AuthRequest, res: Response) => {
    try {
        const creatorId = req.user.userId;
        const { title, description, startDate, endDate, type, participants, meetingUrl, location } = req.body;

        const event = new Event({
            title,
            description,
            startDate,
            endDate,
            type,
            participants: participants || [],
            creatorId,
            meetingUrl,
            location,
            reminders: [
                { time: 15, sent: false },
                { time: 60, sent: false },
                { time: 1440, sent: false }
            ]
        });

        await event.save();

        if (participants && participants.length > 0) {
            for (const participantId of participants) {
                await createNotification(
                    participantId,
                    'event_created',
                    'New Event Invitation',
                    `You've been invited to: ${title}`,
                    { relatedEventId: event._id }
                );
            }
        }

        res.status(201).json({ success: true, data: event });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filter by month (YYYY-MM format)
 *     responses:
 *       200:
 *         description: List of events
 */
export const getEvents = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const { month } = req.query;

        let filter: any = {
            $or: [
                { creatorId: userId },
                { participants: userId }
            ]
        };

        if (month) {
            const [year, monthNum] = (month as string).split('-');
            const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
            filter.startDate = { $gte: startDate, $lte: endDate };
        }

        const events = await Event.find(filter)
            .populate('creatorId', 'name email avatar')
            .populate('participants', 'name email avatar')
            .sort({ startDate: 1 });

        res.json({ success: true, data: events });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 */
export const getEventById = async (req: Request, res: Response) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('creatorId', 'name email avatar')
            .populate('participants', 'name email avatar');

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, data: event });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event updated
 */
export const updateEvent = async (req: AuthRequest, res: Response) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.creatorId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Only creator can update event' });
        }

        Object.assign(event, req.body);
        await event.save();

        res.json({ success: true, data: event });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 */
export const deleteEvent = async (req: AuthRequest, res: Response) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.creatorId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Only creator can delete event' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/events/{id}/participants:
 *   post:
 *     summary: Add participant to event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Participant added
 */
export const addParticipant = async (req: AuthRequest, res: Response) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const { userId } = req.body;
        if (!event.participants.includes(userId)) {
            event.participants.push(userId);
            await event.save();

            await createNotification(
                userId,
                'event_created',
                'Event Invitation',
                `You've been added to: ${event.title}`,
                { relatedEventId: event._id }
            );
        }

        res.json({ success: true, data: event });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/events/{id}/participants/{userId}:
 *   delete:
 *     summary: Remove participant from event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participant removed
 */
export const removeParticipant = async (req: AuthRequest, res: Response) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        event.participants = event.participants.filter(
            (p: any) => p.toString() !== req.params.userId
        );
        await event.save();

        res.json({ success: true, data: event });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
