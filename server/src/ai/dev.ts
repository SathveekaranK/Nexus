'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/upload-excel-for-analysis.ts';
import '@/ai/flows/ask-nexus-ai-bot.ts';
import '@/ai/flows/get-music-recommendation.ts';
import '@/ai/flows/analyze-image.ts';
