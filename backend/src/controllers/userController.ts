import { Request, Response } from 'express';
import User from '../models/User';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, avatar } = req.body;
        const user = new User({ name, email, avatar });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: 'Error creating user' });
    }
};
