import { Request, Response } from 'express';
import { BotOrchestrator } from '../services/ai/BotOrchestrator';
import { User } from '../models/User';
import { Message } from '../models/Message';

// --- Main Chat Controller ---
export const chat = async (req: Request, res: Response) => {
    try {
        const { messages } = req.body;
        // Last user message is the prompt
        // (In a real chat app, you might want to send the conversation history differently, 
        // but BotOrchestrator builds its own history/context. 
        // We'll take the *last* user message as the current "command" for now, 
        // or pass the conversation string if we want full context.)
        const user = (req as any).user;
        const lastUserMessage = messages[messages.length - 1];

        // 1. Find Bot User (for DB storage)
        const botUser = await User.findOne({ email: 'nexus@bot.com' });
        const botId = botUser?._id;

        // 2. Persist User Message (if bot exists)
        if (botId && lastUserMessage.role === 'user') {
            await Message.create({
                senderId: user.userId,
                recipientId: botId,
                content: lastUserMessage.content,
                type: 'text',
                readBy: [{ userId: user.userId, readAt: new Date() }]
            });
        }

        // 3. Process with AI
        const response = await BotOrchestrator.processUserMessage(messages, user, req.app.get('io'));

        // 4. Persist AI Response
        if (botId && response.content) {
            await Message.create({
                senderId: botId,
                recipientId: user.userId,
                content: response.content,
                type: 'text',
                readBy: [] // Unread for user
            });
        }

        return res.json(response);
    } catch (error: any) {
        console.error("AI Controller Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get chat history with the bot for the current user.
 */
export const getHistory = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const botUser = await User.findOne({ email: 'nexus@bot.com' });

        if (!botUser) return res.json([]);

        // Fetch messages between user and bot
        const history = await Message.find({
            $or: [
                { senderId: user.userId, recipientId: botUser._id },
                { senderId: botUser._id, recipientId: user.userId }
            ]
        }).sort({ createdAt: 1 }).limit(100); // Limit to last 100 for performance

        // Format for frontend
        const formatted = history.map(m => ({
            role: m.senderId.toString() === user.userId ? 'user' : 'assistant',
            content: m.content
        }));

        res.json(formatted);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
