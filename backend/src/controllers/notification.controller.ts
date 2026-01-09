import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *     responses:
 *       200:
 *         description: List of notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const { read } = req.query;

        const filter: any = { userId };
        if (read !== undefined) {
            filter.read = read === 'true';
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ userId, read: false });

        res.json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(
            id,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, data: notification });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        await Notification.updateMany(
            { userId, read: false },
            { read: true }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: any
) => {
    try {
        const notification = new Notification({
            userId,
            type,
            title,
            message,
            ...metadata
        });
        await notification.save();

        // Emit real-time event
        const { socketEvents } = require('../services/socketEvents');
        socketEvents.emit('notification:new', { userId, notification });

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};
