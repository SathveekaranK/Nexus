import mongoose from 'mongoose';
import Resource from '../../models/Resource';
import { Room } from '../../models/Room';
import { User } from '../../models/User';
import { Channel } from '../../models/Channel';
import { Message } from '../../models/Message';
import { Event } from '../../models/Event';
import { Memory } from '../../models/Memory';
const youtubeSearch = require('youtube-search-api');

// --- Types ---
export interface ToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, any>;
            required: string[];
        };
    };
}

export interface ToolContext {
    user: any;
    io: any;
}

export interface ToolHandler {
    (args: any, context: ToolContext): Promise<string>;
}

export interface Tool {
    definition: ToolDefinition;
    handler: ToolHandler;
}

// --- Helper Functions ---
async function resolveUserId(input: string): Promise<string | null> {
    if (mongoose.Types.ObjectId.isValid(input)) return input;
    const user = await User.findOne({
        $or: [
            { name: { $regex: input, $options: 'i' } },
            { username: { $regex: input, $options: 'i' } }
        ]
    });
    return user ? user._id.toString() : null;
}

// --- Tools Registry ---
export const TOOL_REGISTRY: Record<string, Tool> = {
    'lookup_resources': {
        definition: {
            type: "function",
            function: {
                name: "lookup_resources",
                description: "Search for resources (docs, links, env vars, snippets).",
                parameters: {
                    type: "object",
                    properties: {
                        search: { type: "string" },
                        type: { type: "string", enum: ["snippet", "link", "doc", "env"] }
                    },
                    required: ["search"]
                }
            }
        },
        handler: async (args, context) => {
            const query: any = { $text: { $search: args.search } };
            if (args.type) query.type = args.type;
            const resources = await Resource.find(query).limit(5).select('title type content description tags');
            return JSON.stringify(resources);
        }
    },
    'create_resource': {
        definition: {
            type: "function",
            function: {
                name: "create_resource",
                description: "Create a new resource.",
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
        handler: async (args, context) => {
            if (!context.user) return "Error: Authentication required.";
            const newRes = new Resource({
                ...args,
                tags: args.tags ? args.tags.split(',').map((t: string) => t.trim()) : [],
                createdBy: context.user.userId,
                isPublic: true
            });
            await newRes.save();
            return JSON.stringify({ success: true, message: `Resource '${args.title}' created.` });
        }
    },
    'manage_calendar_event': {
        definition: {
            type: "function",
            function: {
                name: "manage_calendar_event",
                description: "Create, delete, or list calendar events.",
                parameters: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ["create", "delete", "list"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        startDate: { type: "string" },
                        endDate: { type: "string" },
                        eventId: { type: "string" },
                        type: { type: "string", enum: ["meeting", "deadline", "holiday", "other"] }
                    },
                    required: ["action"]
                }
            }
        },
        handler: async (args, context) => {
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
                    creator: context.user.userId,
                    participants: [context.user.userId]
                });
                await event.save();
                return JSON.stringify({ success: true, eventId: event._id });
            }
            if (args.action === 'delete') {
                await Event.findByIdAndDelete(args.eventId);
                return "Event deleted.";
            }
            return "Invalid action.";
        }
    },
    'manage_channel': {
        definition: {
            type: "function",
            function: {
                name: "manage_channel",
                description: "Create a channel or add members.",
                parameters: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ["create", "add_member"] },
                        name: { type: "string" },
                        description: { type: "string" },
                        channelId: { type: "string" },
                        userId: { type: "string" }
                    },
                    required: ["action"]
                }
            }
        },
        handler: async (args, context) => {
            if (args.action === 'create') {
                const channel = new Channel({
                    name: args.name,
                    description: args.description,
                    type: 'channel',
                    creator: context.user.userId,
                    members: [context.user.userId]
                });
                await channel.save();
                return JSON.stringify({ success: true, channelId: channel._id });
            }
            if (args.action === 'add_member') {
                const targetUserId = await resolveUserId(args.userId);
                if (!targetUserId) return `Error: Could not find user '${args.userId}'`;
                await Channel.findByIdAndUpdate(args.channelId, { $addToSet: { members: targetUserId } });
                await User.findByIdAndUpdate(targetUserId, { $addToSet: { channels: args.channelId } });
                return "Member added.";
            }
            return "Invalid action.";
        }
    },
    'send_message': {
        definition: {
            type: "function",
            function: {
                name: "send_message",
                description: "Send message. targetId='all' broadcasts. destinationType='channel' or 'dm'.",
                parameters: {
                    type: "object",
                    properties: {
                        destinationType: { type: "string", enum: ["channel", "dm"] },
                        targetId: { type: "string" },
                        content: { type: "string" }
                    },
                    required: ["destinationType", "targetId", "content"]
                }
            }
        },
        handler: async (args, context) => {
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

            // Smart Resolution Logic (simplified for brevity, keeping core logic)
            if (finalDestType === 'dm') {
                const userId = await resolveUserId(finalTargetId);
                if (userId) {
                    msgData.recipientId = userId;
                } else {
                    const channel = await Channel.findOne({ name: { $regex: `^${finalTargetId}$`, $options: 'i' } });
                    if (channel) {
                        finalDestType = 'channel';
                        msgData.channelId = channel._id;
                    } else if (['all', 'everyone'].includes(finalTargetId.toLowerCase())) {
                        const general = await Channel.findOne({ name: 'general' });
                        if (general) {
                            finalDestType = 'channel';
                            msgData.channelId = general._id;
                        } else return "Error: No 'general' channel found.";
                    } else return `Error: User '${finalTargetId}' not found.`;
                }
            } else {
                if (mongoose.Types.ObjectId.isValid(finalTargetId)) {
                    msgData.channelId = finalTargetId;
                } else {
                    let channel = await Channel.findOne({ name: { $regex: finalTargetId, $options: 'i' } });
                    if (channel) msgData.channelId = channel._id;
                    else return `Error: Channel '${finalTargetId}' not found.`;
                }
            }

            const msg = new Message({ ...msgData, readBy: [{ userId: senderId, readAt: new Date() }] });
            await msg.save();

            const populatedMsg = await Message.findById(msg._id).populate('senderId', 'name avatar').populate('replyTo');

            if (context.io) {
                // Broadcast
                context.io.emit('new_message', populatedMsg);
                if (msgData.channelId) context.io.to(msgData.channelId.toString()).emit('new_message', populatedMsg);
            }

            return `Message sent to ${finalDestType}.`;
        }
    },
    'search_messages': {
        definition: {
            type: "function",
            function: {
                name: "search_messages",
                description: "Search chat history.",
                parameters: {
                    type: "object",
                    properties: { query: { type: "string" }, limit: { type: "number" } },
                    required: ["query"]
                }
            }
        },
        handler: async (args, context) => {
            // Updated to populate sentiment/topics if available (compatibility with Phase 1 schema)
            const messages = await Message.find({ $text: { $search: args.query } })
                .limit(args.limit || 5)
                .populate('senderId', 'name')
                .select('content senderId createdAt sentiment topics');

            return JSON.stringify(messages.map(m => ({
                from: (m.senderId as any)?.name,
                content: m.content,
                sentiment: (m as any).sentiment?.label,
                date: m.createdAt
            })));
        }
    },
    'analyze_conversation': {
        definition: {
            type: "function",
            function: {
                name: "analyze_conversation",
                description: "Get recent messages for analysis.",
                parameters: {
                    type: "object",
                    properties: { channelId: { type: "string" }, limit: { type: "number" } },
                    required: ["channelId"]
                }
            }
        },
        handler: async (args, context) => {
            const limit = Math.min(args.limit || 20, 50);
            const messages = await Message.find({ channelId: args.channelId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('senderId', 'name');

            return messages.reverse().map(m => `${(m.senderId as any)?.name}: ${m.content}`).join('\n');
        }
    },
    'remember_fact': {
        definition: {
            type: "function",
            function: {
                name: "remember_fact",
                description: "Store a fact, preference, or detail about a user or the project for long-term memory.",
                parameters: {
                    type: "object",
                    properties: {
                        fact: { type: "string", description: "The content to remember (e.g., 'User X prefers Typescript')" },
                        tags: { type: "string", description: "Comma-separated tags" },
                        isGlobal: { type: "boolean", description: "True if fact applies to everyone/project, False if user-specific" }
                    },
                    required: ["fact"]
                }
            }
        },
        handler: async (args, context) => {
            const memory = new Memory({
                content: args.fact,
                tags: args.tags ? args.tags.split(',').map((t: string) => t.trim()) : [],
                userId: args.isGlobal ? null : context.user.userId,
            });
            await memory.save();
            return `Fact remembered: "${args.fact}"`;
        }
    },
    'recall_facts': {
        definition: {
            type: "function",
            function: {
                name: "recall_facts",
                description: "Search long-term memory for facts.",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Keywords to search for" }
                    },
                    required: ["query"]
                }
            }
        },
        handler: async (args, context) => {
            const memories = await Memory.find({ $text: { $search: args.query } }).limit(5);
            if (memories.length === 0) return "No specific memories found matching that query.";
            return JSON.stringify(memories.map(m => `[MEMORY]: ${m.content}`));
        }
    },
    'lookup_users': {
        definition: {
            type: "function",
            function: {
                name: "lookup_users",
                description: "List users.",
                parameters: {
                    type: "object",
                    properties: { name: { type: "string" }, status: { type: "string" } },
                    required: []
                }
            }
        },
        handler: async (args, context) => {
            const query: any = {};
            if (args.name) query.name = { $regex: args.name, $options: 'i' };
            if (args.status) query.status = args.status;
            const users = await User.find(query).select('_id name status email roles inferredSkills');
            return JSON.stringify(users);
        }
    },
    'manage_roles': {
        definition: {
            type: "function",
            function: {
                name: "manage_roles",
                description: "Assign or remove roles for users (Admin only).",
                parameters: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ["add", "remove"] },
                        users: { type: "array", items: { type: "string" }, description: "List of usernames or emails (e.g. ['@alice', 'bob@test.com'])" },
                        role: { type: "string", description: "Role name (e.g. 'admin', 'moderator')" }
                    },
                    required: ["action", "users", "role"]
                }
            }
        },
        handler: async (args, context) => {
            // 1. RBAC Check
            const requester = await User.findById(context.user.userId);
            if (!requester || !requester.roles.includes('admin')) {
                return "Error: Permission denied. You must be an admin to manage roles.";
            }

            const results: string[] = [];
            const action = args.action;
            const targetRole = args.role.toLowerCase();

            // 2. Process each user
            for (const identifier of args.users) {
                // Resolve User
                const cleanId = identifier.replace('@', '');
                const user = await User.findOne({
                    $or: [
                        { name: { $regex: `^${cleanId}$`, $options: 'i' } },
                        { email: { $regex: cleanId, $options: 'i' } }
                    ]
                });

                if (!user) {
                    results.push(`User '${identifier}' not found.`);
                    continue;
                }

                // 3. Update Roles
                let changed = false;
                if (action === 'add') {
                    if (!user.roles.includes(targetRole)) {
                        user.roles.push(targetRole);
                        changed = true;
                    }
                } else if (action === 'remove') {
                    if (user.roles.includes(targetRole)) {
                        user.roles = user.roles.filter(r => r !== targetRole);
                        changed = true;
                    }
                }

                if (changed) {
                    await user.save();
                    results.push(`User ${user.name}: ${action === 'add' ? 'Added' : 'Removed'} role '${targetRole}'.`);
                } else {
                    results.push(`User ${user.name}: No change needed.`);
                }
            }

            return results.join('\n');
        }
    }
};

export const getToolDefinitions = () => Object.values(TOOL_REGISTRY).map(t => t.definition);
