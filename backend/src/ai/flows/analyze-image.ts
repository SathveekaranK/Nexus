'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing and describing images.
 *
 * It takes an image file as input, uses an AI model to generate a description,
 * and returns that description.
 *
 * @param {AnalyzeImageInput} input - The input data containing the image file.
 * @returns {Promise<AnalyzeImageOutput>} - A promise that resolves to the image analysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      'The image file data as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

const AnalyzeImageOutputSchema = z.object({
  description: z
    .string()
    .describe('A description of the image content.'),
});
export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageOutput> {
  return analyzeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageAnalysisPrompt',
  input: {schema: AnalyzeImageInputSchema},
  output: {schema: AnalyzeImageOutputSchema},
  prompt: `You are Nexus AI Bot, a helpful AI assistant in a communication platform.

  The user has uploaded an image. Your task is to describe the image.

  Here is the image file data:
  {{media url=imageDataUri}}

  Return a description of the image.
  `,
});

const analyzeImageFlow = ai.defineFlow(
  {
    name: 'analyzeImageFlow',
    inputSchema: AnalyzeImageInputSchema,
    outputSchema: AnalyzeImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
