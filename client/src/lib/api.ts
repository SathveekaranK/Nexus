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
