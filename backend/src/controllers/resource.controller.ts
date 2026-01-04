import { Request, Response } from 'express';
import Resource from '../models/Resource';

export const createResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, type, content, description, tags, metadata, isPublic } = req.body;

        // @ts-ignore - req.user added by middleware
        const userId = req.user?.userId;

        const newResource = new Resource({
            title,
            type,
            content,
            description,
            tags,
            metadata,
            isPublic: isPublic !== undefined ? isPublic : true,
            createdBy: userId
        });

        const savedResource = await newResource.save();

        // Populate creator info
        await savedResource.populate('createdBy', 'username name avatar');

        // Notify all users
        const io = req.app.get('io');
        if (io) {
            io.emit('notification', {
                type: 'resource_added',
                title: 'New Resource Added',
                message: `${(req as any).user?.name || 'Someone'} added "${title}" to the library.`,
                resourceId: savedResource._id,
                timestamp: new Date()
            });
        }

        res.status(201).json({
            success: true,
            data: savedResource
        });
    } catch (error) {
        console.error('Create resource error:', error);
        res.status(500).json({ success: false, message: 'Failed to create resource' });
    }
};

export const getResources = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, tag, search } = req.query;
        const query: any = {};

        // Filter by type
        if (type) {
            query.type = type;
        }

        // Filter by tag
        if (tag) {
            query.tags = tag;
        }

        // Search text
        if (search) {
            query.$text = { $search: search as string };
        }

        // TODO: Add permission check for private resources
        // For now, return all or filtered

        const resources = await Resource.find(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'username name avatar');

        res.status(200).json({
            success: true,
            data: resources
        });
    } catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch resources' });
    }
};

export const deleteResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user?.userId;

        const resource = await Resource.findById(id);
        if (!resource) {
            res.status(404).json({ success: false, message: 'Resource not found' });
            return;
        }

        // Check ownership (or role - later)
        if (resource.createdBy.toString() !== userId) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }

        await Resource.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Resource deleted' });
    } catch (error) {
        console.error('Delete resource error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete resource' });
    }
};
