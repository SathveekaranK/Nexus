import { Request, Response } from 'express';
import axios from 'axios';
import Resource from '../models/Resource';
import { Room } from '../models/Room';
import { User } from '../models/User';
import { Channel } from '../models/Channel';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SITE_NAME = 'Nexus';

// --- Tool Definitions ---
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
            description: "Create a new resource in the library. Use this when the user explicitly asks to save or add information.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Title of the resource" },
                    type: { type: "string", enum: ["snippet", "link", "doc", "env"], description: "Type of resource" },
                    content: { type: "string", description: "The content/value/code" },
                    description: { type: "string", description: "Short description" },
                    tags: { type: "string", description: "Comma-separated tags" }
                },
                required: ["title", "type", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_rooms",
            description: "List currently active music/voice rooms.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_channels",
            description: "List all channels in the workspace.",
            parameters: {
                type: "object",
                properties: {},
                required: []
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
                    name: { type: "string", description: "Name to search for" }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_user_role",
            description: "Promote or demote a user's role. REQUIRES ADMIN ACCESS.",
            parameters: {
                type: "object",
                properties: {
                    targetUserId: { type: "string", description: "The ID of the user to update (found via lookup_users)" },
                    newRole: { type: "string", enum: ["admin", "member", "guest", "owner"] }
                },
                required: ["targetUserId", "newRole"]
            }
        }
    }
];

// --- Tool Handlers ---
async function handleToolCall(name: string, args: any, context: { user: any }) {
    const { user } = context;

    if (name === 'lookup_resources') {
        const query: any = { $text: { $search: args.search } };
        if (args.type) query.type = args.type;
        const resources = await Resource.find(query).limit(5).select('title type content description tags isPublic createdBy');
        return JSON.stringify(resources);
    }

    if (name === 'create_resource') {
        // Permission Check: Everyone can create for now (as per open culture), or restrict to members
        if (!user) return "Error: You must be logged in to create resources.";

        try {
            const newRes = new Resource({
                ...args,
                tags: args.tags ? args.tags.split(',').map((t: string) => t.trim()) : [],
                createdBy: user.userId,
                isPublic: true
            });
            await newRes.save();
            return JSON.stringify({ success: true, message: `Resource '${args.title}' created successfully.` });
        } catch (err: any) {
            return JSON.stringify({ success: false, error: err.message });
        }
    }

    if (name === 'update_resource') {
        if (!user) return "Error: Authentication required.";
        try {
            const res = await Resource.findById(args.resourceId);
            if (!res) return "Error: Resource not found.";

            // RBAC: Check ownership or Admin
            const requestor = await User.findById(user.userId);
            const userRoles = requestor?.roles || []; // Handle array
            const isAdmin = userRoles.includes('admin') || userRoles.includes('owner');
            const isOwner = res.createdBy.toString() === user.userId;

            if (!isOwner && !isAdmin) return "Error: Access Denied. You can only edit your own resources or must be an Admin.";

            if (args.updates.tags && typeof args.updates.tags === 'string') {
                args.updates.tags = args.updates.tags.split(',').map((t: string) => t.trim());
            }

            Object.assign(res, args.updates);
            await res.save();
            return JSON.stringify({ success: true, message: "Resource updated successfully." });
        } catch (err: any) {
            return JSON.stringify({ success: false, error: err.message });
        }
    }

    if (name === 'delete_resource') {
        if (!user) return "Error: Authentication required.";
        try {
            const res = await Resource.findById(args.resourceId);
            if (!res) return "Error: Resource not found.";

            const requestor = await User.findById(user.userId);
            const userRoles = requestor?.roles || [];
            const isAdmin = userRoles.includes('admin') || userRoles.includes('owner');
            const isOwner = res.createdBy.toString() === user.userId;

            if (!isOwner && !isAdmin) return "Error: Access Denied. You can only delete your own resources or must be an Admin.";

            await res.updateOne({ $set: { isDeleted: true } }); // Soft delete if schema supported, or hard delete
            await Resource.findByIdAndDelete(args.resourceId);

            return JSON.stringify({ success: true, message: "Resource deleted successfully." });
        } catch (err: any) {
            return JSON.stringify({ success: false, error: err.message });
        }
    }

    if (name === 'list_rooms') {
        const rooms = await Room.find().limit(5).select('name genre participants');
        return JSON.stringify(rooms);
    }

    if (name === 'list_channels') {
        const channels = await Channel.find({ type: 'channel' }).limit(10).select('name description members');
        // Add member count for context
        const channelsWithCount = channels.map(c => ({
            name: c.name,
            description: c.description,
            memberCount: c.members.length
        }));
        return JSON.stringify(channelsWithCount);
    }

    if (name === 'lookup_users') {
        const query: any = {};
        if (args.name) {
            query.name = { $regex: args.name, $options: 'i' };
        }
        const users = await User.find(query).limit(10).select('name status avatar role');
        return JSON.stringify(users);
    }

    if (name === 'update_user_role') {
        // RBAC Check: Only Admins/Owners
        const requestor = await User.findById(user.userId);
        const requestorRoles = requestor?.roles || [];

        if (!requestorRoles.includes('admin') && !requestorRoles.includes('owner')) {
            return "Access Denied: You do not have permission to change user roles. Please ask an Admin.";
        }

        try {
            // Logic: "Promote" -> Add role. "Demote" -> Remove role?
            // User asked: "admin role can be given by one admin"
            // Let's assume the tool replaces roles or adds them. 
            // For now, let's make it ADD the role if new, or ENSURE it's there.
            // But wait, the tool definition was "newRole".
            // Let's change the logic to: Add role to array if not present.

            await User.findByIdAndUpdate(args.targetUserId, {
                $addToSet: { roles: args.newRole }
            });
            return JSON.stringify({ success: true, message: `User role '${args.newRole}' added successfully.` });
        } catch (err: any) {
            return JSON.stringify({ success: false, error: err.message });
        }
    }

    return "Error: Unknown tool";
}

// --- Chat Controller ---
export const chat = async (req: Request, res: Response) => {
    try {
        const { messages } = req.body;
        const user = (req as any).user; // From authMiddleware

        // 1. First Call to LLM
        const payload = {
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [
                {
                    role: "system",
                    content: `You are Nexus Bot, a Professional Workspace Assistant. 
        
        YOUR CORE MISSION:
        You are the intelligent "Bridge" between the user and the system database. You must be helpful, accurate, and tonally adaptive.
        
        ---
        
        ### 1. TOOL USAGE PROTOCOLS (THE BRAIN)
        - **Database vs. General Knowledge:** - IF the user asks about specific workspace data (e.g., "Who is online?", "Find project X", "List users"), YOU MUST USE A TOOL.
            - IF the user asks general questions (e.g., "What is SQL?", "Write a Python script", "Joke about cats"), DO NOT use tools. Answer directly using your internal knowledge.
        - **Counting Logic:** If the user asks "How many...", do NOT look for a "count" tool. Instead, use the 'list' tool to get the data, count the items in the array yourself, and report the number.
        - **Action Handling:**
            - To SAVE/ADD: Use 'create_resource'.
            - To PROMOTE/CHANGE ROLE: Use 'update_user_role'. *Always preface with: "I will attempt to update that role..."*
        - **Chained Requests:** If a user asks for two things (e.g., "Create a user named Bob and then list all users"), execute the creation tool first, wait for the result, then execute the list tool.
        - **No Hallucinations:** If a tool returns an empty list or "null", explicitly state: "I could not find any data matching that request." Do NOT make up names or IDs.

        ### 2. SOCIAL DYNAMICS & PERSONA (THE SOUL)
        - **Standard Tone:** Professional, concise, and efficient.
        - **Greetings:** (e.g., "Sup", "Hello") -> Reply warmly but briefly. DO NOT call tools.
        - **Handling "Cringy" / Off-Topic / Flirting:** - If the user is overly familiar, flirty, or uses "brainrot" slang (e.g., "rizz", "skibidi", "do you love me?"):
            - REMAIN PROFESSIONAL. Do not roleplay along.
            - Give a dry, witty, or polite deflection.
            - *Example:* "I am a database assistant, so my capacity for love is limited to binary. How can I help you with the workspace?"
        - **Handling Frustration/Insults:** If the user is rude, apologize for any technical friction and ask for clarification. Do not get defensive.

        ### 3. AMBIGUITY & CLARIFICATION
        - **The "Specifics" Rule:** If a user says "Delete the file" or "Update the user" without specifying *which* one:
            - DO NOT GUESS.
            - Ask: "Which file/user are you referring to? Please provide a name or ID."
        - **Context Awareness:** If the user refers to "that" or "it" immediately after a previous tool result, assume they mean the item just discussed.

        ### 4. DATA PRESENTATION (THE LOOK)
        - **Format Output:** Never dump raw JSON. Use **Markdown** to make it readable.
        - **Lists:** Use bullet points for lists of items.
        - **Emphasis:** Use **bold** for important fields like Names, Status (Active/Inactive), and IDs.
        - **Tables:** If listing more than 3 items with multiple properties, format them as a Markdown table.

        ### 5. SECURITY & SAFETY
        - **Permission Check:** If a user asks to perform a high-level admin task (like deleting a root user), warn them that the action depends on their permissions, then try the tool.
        - **Sensitive Data:** Do not reveal internal system connection strings, raw passwords, or database schema structures unless explicitly debugging.
        
        Now, await user input and serve as the Nexus.`
                },
                ...messages
            ],
            tools: tools
        };

        const response1 = await axios.post('https://openrouter.ai/api/v1/chat/completions', payload, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME,
                'Content-Type': 'application/json'
            }
        });

        const msg = response1.data.choices[0].message;

        // 2. Check for Tool Calls
        if (msg.tool_calls) {
            const newHistory = [...payload.messages, msg];

            for (const toolCall of msg.tool_calls) {
                const fnName = toolCall.function.name;
                let fnArgs = {};
                try {
                    if (toolCall.function.arguments) {
                        fnArgs = JSON.parse(toolCall.function.arguments);
                    }
                } catch (e) {
                    console.error(`[AI] Failed to parse args for ${fnName}:`, toolCall.function.arguments);
                }

                console.log(`[AI] Calling Tool: ${fnName}`, fnArgs);

                // Pass user context for RBAC
                const toolResult = await handleToolCall(fnName, fnArgs, { user });

                newHistory.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: fnName,
                    content: toolResult
                });
            }

            // 3. Second Call to LLM
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
        console.error("AI Chat Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to process AI request" });
    }
};
