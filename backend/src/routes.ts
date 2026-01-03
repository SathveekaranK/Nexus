import express from 'express';
import { askNexusAiBot } from '@/ai/flows/ask-nexus-ai-bot';
import { uploadExcelForAnalysis } from '@/ai/flows/upload-excel-for-analysis';
import { getMusicRecommendation } from '@/ai/flows/get-music-recommendation';
import * as userController from './controllers/userController';
import * as channelController from './controllers/channelController';
import * as messageController from './controllers/messageController';



export const router = express.Router();

router.post('/ai/query', async (req, res) => {
    try {
        const { query, channelMessages } = req.body;
        const result = await askNexusAiBot({ query, channelMessages });
        res.json({ success: true, message: result.answer });
    } catch (error) {
        console.error('Error in /ai/query:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/files/upload', async (req, res) => {
    try {
        const { dataUri } = req.body;
        if (!dataUri) {
            return res.status(400).json({ success: false, message: 'No file data provided' });
        }
        const result = await uploadExcelForAnalysis({ excelDataUri: dataUri });
        res.json({ success: true, message: result.tablePreview });
    } catch (error) {
        console.error('Error in /files/upload:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? 'Error analyzing file: ' + error.message : 'Unknown error'
        });
    }
});

router.post('/music/recommend', async (req, res) => {
    try {
        const { query } = req.body;
        const result = await getMusicRecommendation({ query });
        res.json({ success: true, message: result.recommendation });
    } catch (error) {
        console.error('Error in /music/recommend:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// User routes
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);

// Channel routes
router.get('/channels', channelController.getChannels);
router.post('/channels', channelController.createChannel);

// Message routes
router.get('/messages', messageController.getMessages);
router.post('/messages', messageController.createMessage);


