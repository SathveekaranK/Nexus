import { Request, Response } from 'express';
import { BotOrchestrator } from '../services/ai/BotOrchestrator';
import { User } from '../models/User';
import { Message } from '../models/Message';
import axios from 'axios';

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

/**
 * Generate Smart Replies based on recent context
 * POST /api/ai/smart-reply
 * Body: { context: string[] } (Last 5 messages)
 */
export const generateSmartReplies = async (req: Request, res: Response) => {
    try {
        const { context } = req.body; // Array of message strings

        let replies = ["OK", "Sounds good!", "I'll take a look."]; // Defaults

        if (Array.isArray(context) && context.length > 0) {
            const lastMsg = context[context.length - 1].toLowerCase();

            // Simple heuristic / simulated AI
            if (lastMsg.includes('?')) {
                replies = ["Yes, I think so.", "Not sure yet.", "Let me check."];
            } else if (lastMsg.includes('hello') || lastMsg.includes('hi')) {
                replies = ["Hey there!", "Hello!", "Hi, how are you?"];
            } else if (lastMsg.includes('thanks') || lastMsg.includes('thank you')) {
                replies = ["You're welcome!", "No problem!", "Anytime."];
            } else if (lastMsg.includes('meeting') || lastMsg.includes('schedule')) {
                replies = ["I'm free.", "What time?", "Let's do it."];
            }
        }
        res.json({ suggestions: replies });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
};

/**
 * Summarize the conversation
 * POST /api/ai/summarize
 * Body: { messages: string[] }
 */
export const summarizeChat = async (req: Request, res: Response) => {
    try {
        const { messages } = req.body;

        if (!process.env.OPENROUTER_API_KEY) {
            const summaryPoints = ["Users discussed project.", "Action items assigned."];
            return res.json({ success: true, summary: "- " + summaryPoints.join('\n- ') });
        }

        const prompt = `Please summarize the following chat conversation into a concise bulleted list of key points and action items:\n\n${messages.join('\n')}`;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-exp:free",
            messages: [{ role: "user", content: prompt }]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'Nexus',
                'Content-Type': 'application/json'
            }
        });

        const summary = response.data?.choices?.[0]?.message?.content || "Could not generate summary.";

        res.json({
            success: true,
            summary: summary
        });
    } catch (error: any) {
        console.error("Summarize Error:", error.response?.data || error.message);
        res.status(500).json({ error: "AI Failed to summarize." });
    }
};

