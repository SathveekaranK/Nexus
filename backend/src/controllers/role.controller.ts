import { Request, Response } from 'express';
import Role from '../models/Role';

export const getRoles = async (req: Request, res: Response) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching roles' });
    }
};

export const createRole = async (req: Request, res: Response) => {
    try {
        const { name, permissions } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const newRole = new Role({ name, permissions });
        await newRole.save();
        res.status(201).json(newRole);
    } catch (error) {
        res.status(500).json({ message: 'Error creating role' });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Role.findByIdAndDelete(id);
        res.json({ message: 'Role deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting role' });
    }
};
