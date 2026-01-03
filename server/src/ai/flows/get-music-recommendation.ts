'use server';

/**
 * @fileOverview This file defines a Genkit flow for getting music recommendations.
 *
 * It takes a query as input, uses an AI model to generate a song recommendation,
 * and returns that recommendation.
 *
 * @param {MusicRecommendationInput} input - The input data containing the query.
 * @returns {Promise<MusicRecommendationOutput>} - A promise that resolves to the music recommendation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MusicRecommendationInputSchema = z.object({
    query: z.string().describe('The query for the music recommendation.'),
});
export type MusicRecommendationInput = z.infer<typeof MusicRecommendationInputSchema>;


const MusicRecommendationOutputSchema = z.object({
    recommendation: z.string().describe('The music recommendation.'),
});
export type MusicRecommendationOutput = z.infer<typeof MusicRecommendationOutputSchema>;


export async function getMusicRecommendation(input: MusicRecommendationInput): Promise<MusicRecommendationOutput> {
    return getMusicRecommendationFlow(input);
}


const prompt = ai.definePrompt({
    name: 'musicRecommendationPrompt',
    input: {schema: MusicRecommendationInputSchema},
    output: {schema: MusicRecommendationOutputSchema},
    prompt: `You are a music expert. The user wants a music recommendation based on the following query: {{{query}}}.
    
    Recommend a song title and artist. For example: "Song Title by Artist".`,
});


const getMusicRecommendationFlow = ai.defineFlow(
    {
        name: 'getMusicRecommendationFlow',
        inputSchema: MusicRecommendationInputSchema,
        outputSchema: MusicRecommendationOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(input);
        return output!;
    }
);
