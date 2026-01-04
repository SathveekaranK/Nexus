import { Request, Response } from 'express';
const youtubeSearch = require('youtube-search-api');

export const searchVideo = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query.q as string;
        if (!query) {
            res.status(400).json({ success: false, message: 'Query is required' });
            return;
        }

        // Use youtube-search-api instead of ytsr
        const searchResults = await youtubeSearch.GetListByKeyword(query, false, 10);

        // Map results to our expected format
        const videos = searchResults.items
            .filter((item: any) => item && item.type === 'video' && item.id)
            .map((item: any) => ({
                id: item.id,
                title: item.title,
                url: `https://www.youtube.com/watch?v=${item.id}`,
                thumbnail: item.thumbnail?.thumbnails?.[0]?.url || '',
                duration: item.length?.simpleText || '0:00',
                author: item.channelTitle || 'Unknown'
            }));

        console.log('Search results:', videos.length, 'videos');
        console.log('First video URL:', videos[0]?.url);

        res.status(200).json({ success: true, data: videos });
    } catch (error: any) {
        console.error('YouTube Search Error:', error);
        res.status(500).json({ success: false, message: 'Failed to search YouTube' });
    }
};
