import { Router } from 'express';
import { getRoles, createRole, deleteRole } from '../controllers/role.controller';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authMiddleware, getRoles);
// Only admins/owners can create/delete roles (For now using checkPermission stub or hardcoded check in middleware)
router.post('/', authMiddleware, checkPermission('manage_roles'), createRole);
router.delete('/:id', authMiddleware, checkPermission('manage_roles'), deleteRole);

export default router;
