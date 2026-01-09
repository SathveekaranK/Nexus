import { Router } from 'express';
import { createResource, getResources, deleteResource } from '../controllers/resource.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Configure routes
router.get('/', authMiddleware, getResources);
router.post('/', authMiddleware, createResource);
router.delete('/:id', authMiddleware, deleteResource);

export default router;
