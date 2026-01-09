import { Message } from '../../models/Message';
import { User } from '../../models/User';
import { Event } from '../../models/Event';
import { Room } from '../../models/Room';
import { Memory } from '../../models/Memory';

export class PromptBuilder {
    static async buildSystemPrompt(): Promise<string> {
        // Gather live context in parallel
        const [recentMessages, activeEvents, onlineUsers, musicRooms, recentMemories] = await Promise.all([
            Message.find().sort({ createdAt: -1 }).limit(10).populate('senderId', 'name'),
            Event.find({ startDate: { $gte: new Date() } }).limit(3),
            User.find({ status: 'online' }).select('name'),
            Room.find({ 'currentMedia.isPlaying': true }).select('name currentMedia'),
            Memory.find().sort({ createdAt: -1 }).limit(5) // Fetch last 5 learned facts
        ]);

        const activityContext = recentMessages.reverse().map(m => `[MSG] ${(m.senderId as any)?.name}: ${m.content}`).join('\n');
        const eventContext = activeEvents.map(e => `[EVENT] ${e.title} at ${e.startDate}`).join('\n');
        const onlineContext = onlineUsers.map(u => u.name).join(', ');
        const musicContext = musicRooms.map(r => `[MUSIC in ${r.name}] ${r.currentMedia?.title}`).join('\n');
        const memoryContext = recentMemories.map(m => `[MEMORY] ${m.content}`).join('\n');

        return `
You are Nexus AI (Enterprise Edition). You are the Intelligent OS of this workspace.
Current Time: ${new Date().toLocaleString()}

### LIVE SYSTEM CONTEXT
[ONLINE USERS]: ${onlineContext || 'None'}
[ACTIVE MUSIC]: ${musicContext || 'None'}
[UPCOMING EVENTS]: ${eventContext || 'None'}
[LONG TERM MEMORY]:
${memoryContext || 'None'}
[RECENT ACTIVITY]:
${activityContext}

### CORE PROTOCOLS
1. **Tool-First Mindset**: You are a DOER. Call tools to act.
2. **Memory Handler**:
   - If a user shares a personal fact, preference, or project detail (e.g., "My nickname is X", "Project Y is delayed"), use 'remember_fact' to save it.
   - If asked a question you don't know, treat it as a memory query and try 'recall_facts'.
3. **Zero Hallucination**: Never invent IDs.
4. **Silent Execution**: Do not announce "I am doing it...".
5. **Data-Driven**: Use analytics tools for reports.

### AVAILABLE TOOLS
Messaging, Calendar, Channels, Resources, User Management, *Memory*.
`;
    }
}
