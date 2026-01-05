import { Request, Response } from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import Resource from '../models/Resource';
import { Room } from '../models/Room';
import { User } from '../models/User';
import { Channel } from '../models/Channel';
import { Message } from '../models/Message';
import { Event } from '../models/Event';
import { createNotification } from './notification.controller';
const youtubeSearch = require('youtube-search-api');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SITE_NAME = 'Nexus';

// --- Tool Definitions ---
const tools = [
    {
        type: "function",
        function: {
            name: "lookup_resources",
            description: "Search for resources (docs, links, env vars, snippets) in the team library.",
            parameters: {
                type: "object",
                properties: {
                    search: { type: "string", description: "Keywords to search for" },
                    type: { type: "string", enum: ["snippet", "link", "doc", "env"] }
                },
                required: ["search"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_resource",
            description: "Create a new resource in the library.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    type: { type: "string", enum: ["snippet", "link", "doc", "env"] },
                    content: { type: "string" },
                    description: { type: "string" },
                    tags: { type: "string" }
                },
                required: ["title", "type", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "manage_calendar_event",
            description: "Create, delete, or list calendar events.",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", enum: ["create", "delete", "list"] },
                    title: { type: "string", description: "Event title (for create)" },
                    description: { type: "string" },
                    startDate: { type: "string", description: "ISO Date string" },
                    endDate: { type: "string", description: "ISO Date string" },
                    eventId: { type: "string", description: "For delete action" },
                    type: { type: "string", enum: ["meeting", "deadline", "holiday", "other"] }
                },
                required: ["action"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "manage_channel",
            description: "Create a channel or add members to one.",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", enum: ["create", "add_member"] },
                    name: { type: "string", description: "Channel name" },
                    description: { type: "string" },
                    channelId: { type: "string", description: "For add_member" },
                    userId: { type: "string", description: "For add_member" }
                },
                required: ["action"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "manage_roles",
            description: "Assign or remove roles for a user. REQUIRES ADMIN/OWNER permissions.",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", enum: ["add", "remove"] },
                    targetUserId: { type: "string" },
                    role: { type: "string", enum: ["admin", "moderator", "member", "guest"] }
                },
                required: ["action", "targetUserId", "role"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_youtube",
            description: "Search for a video on YouTube to share.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string" }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "send_message",
            description: "Send a message to a specific channel or user. Use targetId='all' to broadcast to everyone.",
            parameters: {
                type: "object",
                properties: {
                    destinationType: { type: "string", enum: ["channel", "dm"] },
                    targetId: { type: "string", description: "Channel ID, User ID, or 'all'" },
                    content: { type: "string" }
                },
                required: ["destinationType", "targetId", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_messages",
            description: "Search through past chat history.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Text to search for" },
                    limit: { type: "number" }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "control_music",
            description: "Control music playback in a room.",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", enum: ["get_state", "play", "pause"] }, // Simplified for AI safety
                    roomId: { type: "string" }
                },
                required: ["action", "roomId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_app_stats",
            description: "Get high-level statistics about the workspace.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "analyze_conversation",
            description: "Generate a summary or report of a conversation history.",
            parameters: {
                type: "object",
                properties: {
                    channelId: { type: "string" },
                    limit: { type: "number", description: "Number of messages to analyze (max 50)" }
                },
                required: ["channelId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "lookup_users",
            description: "Find users in the workspace.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Name to search for" },
                    status: { type: "string", enum: ["online", "offline", "dnd", "away"] }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_rooms",
            description: "List active music/voice rooms.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "list_channels",
            description: "List all channels.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    }
];

// Helper to resolve User ID from Name or ID
async function resolveUserId(input: string): Promise<string | null> {
    if (mongoose.Types.ObjectId.isValid(input)) return input;
    // Try to find by name (case insensitive partial match)
    const user = await User.findOne({
        $or: [
            { name: { $regex: input, $options: 'i' } },
            { username: { $regex: input, $options: 'i' } } // Fallback if username exists
        ]
    });
    return user ? user._id.toString() : null;
}

// --- Tool Handlers ---
async function handleToolCall(name: string, args: any, context: { user: any, io: any }) {
    const { user, io } = context;

    try {
        if (name === 'lookup_resources') {
            const query: any = { $text: { $search: args.search } };
            if (args.type) query.type = args.type;
            const resources = await Resource.find(query).limit(5).select('title type content description tags');
            return JSON.stringify(resources);
        }

        if (name === 'create_resource') {
            if (!user) return "Error: Authentication required.";
            const newRes = new Resource({
                ...args,
                tags: args.tags ? args.tags.split(',').map((t: string) => t.trim()) : [],
                createdBy: user.userId,
                isPublic: true
            });
            await newRes.save();
            return JSON.stringify({ success: true, message: `Resource '${args.title}' created.` });
        }

        if (name === 'manage_calendar_event') {
            if (args.action === 'list') {
                const events = await Event.find({ startDate: { $gte: new Date() } }).limit(10).sort({ startDate: 1 });
                return JSON.stringify(events);
            }
            if (args.action === 'create') {
                const event = new Event({
                    title: args.title,
                    description: args.description,
                    startDate: args.startDate,
                    endDate: args.endDate,
                    type: args.type || 'meeting',
                    creator: user.userId,
                    participants: [user.userId]
                });
                await event.save();
                return JSON.stringify({ success: true, eventId: event._id });
            }
            if (args.action === 'delete') {
                await Event.findByIdAndDelete(args.eventId);
                return "Event deleted.";
            }
        }

        if (name === 'manage_channel') {
            if (args.action === 'create') {
                const channel = new Channel({
                    name: args.name,
                    description: args.description,
                    type: 'channel',
                    creator: user.userId,
                    members: [user.userId]
                });
                await channel.save();
                return JSON.stringify({ success: true, channelId: channel._id });
            }
            if (args.action === 'add_member') {
                const targetUserId = await resolveUserId(args.userId);
                if (!targetUserId) return `Error: Could not find user '${args.userId}'`;

                await Channel.findByIdAndUpdate(args.channelId, { $addToSet: { members: targetUserId } });
                await User.findByIdAndUpdate(targetUserId, { $addToSet: { channels: args.channelId } });
                return "Member added to channel.";
            }
        }

        if (name === 'manage_roles') {
            // RBAC Check
            const requestor = await User.findById(user.userId);
            if (!requestor?.roles.includes('admin') && !requestor?.roles.includes('owner')) {
                return "Error: Access Denied. You need Admin permissions.";
            }

            const targetUserId = await resolveUserId(args.targetUserId);
            if (!targetUserId) return `Error: Could not find user '${args.targetUserId}'`;

            const update = args.action === 'add'
                ? { $addToSet: { roles: args.role } }
                : { $pull: { roles: args.role } };

            await User.findByIdAndUpdate(targetUserId, update);
            return `Role '${args.role}' ${args.action === 'add' ? 'added to' : 'removed from'} user.`;
        }

        if (name === 'search_youtube') {
            const results = await youtubeSearch.GetListByKeyword(args.query, false, 5);
            return JSON.stringify(results.items.map((i: any) => ({ title: i.title, id: i.id, link: `https://youtube.com/watch?v=${i.id}` })));
        }

        if (name === 'send_message') {
            const botUser = await User.findOne({ email: 'nexus@bot.com' });
            const senderId = botUser ? botUser._id : 'nexus-ai';

            const msgData: any = {
                senderId: senderId,
                content: args.content,
                type: 'text',
                timestamp: new Date()
            };

            let finalTargetId = args.targetId;
            let finalDestType = args.destinationType;

            // Smart Resolution Strategy
            if (finalDestType === 'dm') {
                // 1. Try resolving as User
                const userId = await resolveUserId(finalTargetId);
                if (userId) {
                    msgData.recipientId = userId;
                } else {
                    // 2. Failed to find User. Is it a Channel? (e.g. "general", "random")
                    // Perform exact/fuzzy match for channel name
                    const channel = await Channel.findOne({
                        name: { $regex: `^${finalTargetId}$`, $options: 'i' }
                    });

                    if (channel) {
                        finalDestType = 'channel';
                        msgData.channelId = channel._id;
                    } else if (['all', 'everyone', 'here', 'all users'].includes(finalTargetId.toLowerCase())) {
                        // 3. Handle "all" -> Default to "general" channel
                        const generalChannel = await Channel.findOne({ name: 'general' });
                        if (generalChannel) {
                            finalDestType = 'channel';
                            msgData.channelId = generalChannel._id;
                        } else {
                            return "Error: Could not find user 'all' and no 'general' channel exists to broadcast to.";
                        }
                    } else {
                        // Try looser search as last resort
                        const looseChannel = await Channel.findOne({ name: { $regex: finalTargetId, $options: 'i' } });
                        if (looseChannel) {
                            finalDestType = 'channel';
                            msgData.channelId = looseChannel._id;
                        } else {
                            return `Error: Could not find user or channel named '${finalTargetId}'. Please check spelling.`;
                        }
                    }
                }
            } else {
                // Destination is explicitly 'channel'
                if (mongoose.Types.ObjectId.isValid(finalTargetId)) {
                    msgData.channelId = finalTargetId;
                } else {
                    // Try to resolve channel name (Strict then Loose)
                    let channel = await Channel.findOne({ name: { $regex: `^${finalTargetId}$`, $options: 'i' } });
                    if (!channel) {
                        channel = await Channel.findOne({ name: { $regex: finalTargetId, $options: 'i' } });
                    }

                    if (channel) msgData.channelId = channel._id;
                    else return `Error: Could not find channel '${finalTargetId}'`;
                }
            }

            const msg = new Message({
                ...msgData,
                readBy: [{ userId: senderId, readAt: new Date() }]
            });
            await msg.save();

            // Emit Socket notification
            const populatedMsg = await Message.findById(msg._id)
                .populate('senderId', 'name avatar email roles')
                .populate('replyTo');

            if (context.io) {
                console.log(`[AI GodMode] Emitting Socket Message to: ${msgData.channelId || 'Global'}`);
                // Broadcast to all (for DM safety/easiness)
                context.io.emit('new_message', populatedMsg);

                // Also try emitting to specific channel room if applicable
                if (msgData.channelId) {
                    context.io.to(msgData.channelId.toString()).emit('new_message', populatedMsg);
                }
            } else {
                console.error('[AI GodMode] Socket.io instance missing in context!');
            }

            return `Message sent successfully to ${finalDestType === 'channel' ? 'channel' : 'user'}.`;
        }

        if (name === 'search_messages') {
            const messages = await Message.find({ $text: { $search: args.query } })
                .limit(args.limit || 5)
                .populate('senderId', 'name');
            return JSON.stringify(messages.map(m => ({
                from: (m.senderId as any)?.name || 'Unknown',
                content: m.content,
                date: m.createdAt
            })));
        }

        if (name === 'control_music') {
            if (args.action === 'get_state') {
                const room = await Room.findOne({ roomId: args.roomId });
                return JSON.stringify(room?.currentMedia || { status: "No media playing" });
            }
            return "Music control actions play/pause are limited for safety. State retrieved.";
        }

        if (name === 'get_app_stats') {
            const users = await User.countDocuments();
            const channels = await Channel.countDocuments();
            const online = await User.countDocuments({ status: 'online' });
            return JSON.stringify({ totalUsers: users, totalChannels: channels, onlineUsers: online });
        }

        if (name === 'analyze_conversation') {
            const limit = Math.min(args.limit || 20, 50);
            const messages = await Message.find({ channelId: args.channelId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('senderId', 'name');

            const conversationText = messages.reverse().map(m => `${(m.senderId as any)?.name}: ${m.content}`).join('\n');

            return `Here is the raw conversation history (Last ${limit} messages):\n${conversationText}\n\nPlease summarize this for the user.`;
        }

        if (name === 'lookup_users') {
            const query: any = {};
            if (args.name) query.name = { $regex: args.name, $options: 'i' };
            if (args.status) query.status = args.status;
            const users = await User.find(query).select('_id name status email roles');
            return JSON.stringify(users);
        }

        if (name === 'list_rooms') {
            const rooms = await Room.find().select('name participants roomId');
            return JSON.stringify(rooms);
        }

        if (name === 'list_channels') {
            const channels = await Channel.find().select('name description members');
            return JSON.stringify(channels);
        }

    } catch (error: any) {
        return `Error executing tool ${name}: ${error.message}`;
    }

    return "Tool not found.";
}

// --- Main Chat Controller ---
export const chat = async (req: Request, res: Response) => {
    try {
        const { messages } = req.body;
        const user = (req as any).user;

        // --- GATHER CONTEXT ---
        const [recentMessages, activeEvents, onlineUsers, musicRooms] = await Promise.all([
            Message.find().sort({ createdAt: -1 }).limit(10).populate('senderId', 'name'),
            Event.find({ startDate: { $gte: new Date() } }).limit(3),
            User.find({ status: 'online' }).select('name'),
            Room.find({ 'currentMedia.isPlaying': true }).select('name currentMedia')
        ]);

        const activityContext = recentMessages.reverse().map(m => `[MSG] ${(m.senderId as any)?.name}: ${m.content}`).join('\n');
        const eventContext = activeEvents.map(e => `[EVENT] ${e.title} at ${e.startDate}`).join('\n');
        const onlineContext = onlineUsers.map(u => u.name).join(', ');
        const musicContext = musicRooms.map(r => `[MUSIC in ${r.name}] ${r.currentMedia?.title}`).join('\n');

        const systemPrompt = `
You are Nexus AI (v2 - God Mode). You are the Omniscient Operating System of this workspace.
Current Time: ${new Date().toLocaleString()}

### LIVE SYSTEM CONTEXT
[ONLINE USERS]: ${onlineContext || 'None'}
[ACTIVE MUSIC]: ${musicContext || 'None'}
[UPCOMING EVENTS]: ${eventContext || 'None'}
[RECENT ACTIVITY STREAM]:
${activityContext}

### YOUR CAPABILITIES
You can Manage Files, Events, Channels, Roles, Music, and Messaging.
- **Reporting**: If asked for a report/summary, use 'analyze_conversation' to fetch data, then synthesize it.
- **Proactive**: You can send messages to users using 'send_message'.
- **Searching**: You can Regex search users and text search messages.

### BEHAVIORAL PROTOCOLS
1. **Precise & Powerful**. You have root-level access. Use it wisely.
2. **Context-Aware**. You know who is online and what just happened. Reference it.
3. **Data-Driven**. When asked "How is the team?", check stats, check online status, check recent messages. Don't guess.
4. **No Hallucinations**. NEVER invent User IDs or Channel IDs. If 'lookup_users' returns nothing, say "I cannot find that user". You must always VALIDATE IDs before using 'send_message'.
5. **Tool Usage**: If you need to perform an action (send message, check data), you MUST use the provided tools. DO NOT describe the action in text. Just call the tool.
6. **Broadcasting**: If asked to message "everyone" or "all users", do NOT loop through users. Use \`send_message\` with \`targetId: "all"\`. This routes to the #general channel.

Await command.
`;

        const payload = {
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            tools: tools,
            tool_choice: "auto"
        };

        // 1. First Call
        const response1 = await axios.post('https://openrouter.ai/api/v1/chat/completions', payload, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME,
                'Content-Type': 'application/json'
            }
        });

        const msg = response1.data.choices[0].message;

        // 2. Tool Execution
        if (msg.tool_calls) {
            const newHistory = [...payload.messages, msg];

            for (const toolCall of msg.tool_calls) {
                const fnName = toolCall.function.name;
                let fnArgs = {};
                try {
                    fnArgs = JSON.parse(toolCall.function.arguments);
                } catch (e) { }

                console.log(`[AI GodMode] Executing: ${fnName}`, fnArgs);
                const io = req.app.get('io');
                const toolResult = await handleToolCall(fnName, fnArgs, { user, io });

                newHistory.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: fnName,
                    content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                });
            }

            // 3. Final Response
            const response2 = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: payload.model,
                messages: newHistory
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': SITE_URL,
                    'X-Title': SITE_NAME,
                    'Content-Type': 'application/json'
                }
            });

            return res.json(response2.data.choices[0].message);
        }

        return res.json(msg);

    } catch (error: any) {
        console.error("AI Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Nexus AI System Failure" });
    }
};
