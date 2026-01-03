export async function handleAiQuery(query: string, channelMessages: string[]) {
    const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, channelMessages }),
    });
    if (!response.ok) {
        throw new Error('Failed to query AI');
    }
    return response.json();
}

export async function handleFileUpload(dataUri: string) {
    const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUri }),
    });
    if (!response.ok) {
        throw new Error('Failed to upload file');
    }
    return response.json();
}

export async function handleMusicQuery(query: string) {
    const response = await fetch('/api/music/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    if (!response.ok) {
        throw new Error('Failed to get music recommendation');
    }
    return response.json();
}

// Database API functions
export async function getUsers() {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
}

export async function createUser(userData: { name: string; email: string; avatar?: string }) {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
}

export async function getChannels(workspaceId?: string) {
    const url = workspaceId ? `/api/channels?workspaceId=${workspaceId}` : '/api/channels';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch channels');
    return response.json();
}

export async function createChannel(channelData: { name: string; workspaceId: string; type?: string; description?: string }) {
    const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData),
    });
    if (!response.ok) throw new Error('Failed to create channel');
    return response.json();
}

export async function getMessages(channelId: string) {
    const response = await fetch(`/api/messages?channelId=${channelId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
}

export async function createMessage(messageData: { content: string; senderId: string; channelId: string; attachments?: string[] }) {
    const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
    });
    if (!response.ok) throw new Error('Failed to create message');
    return response.json();
}

