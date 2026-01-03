'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing and displaying Excel data.
 *
 * It takes an Excel file as input, uses the Nexus AI Bot to read the data,
 * and returns a formatted table preview for display in the chat.
 *
 * @param {UploadExcelInput} input - The input data containing the Excel file.
 * @returns {Promise<UploadExcelOutput>} - A promise that resolves to the formatted table preview.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UploadExcelInputSchema = z.object({
  excelDataUri: z
    .string()
    .describe(
      'The Excel file data as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type UploadExcelInput = z.infer<typeof UploadExcelInputSchema>;

const UploadExcelOutputSchema = z.object({
  tablePreview: z
    .string()
    .describe('A formatted table preview of the Excel data.'),
});
export type UploadExcelOutput = z.infer<typeof UploadExcelOutputSchema>;

export async function uploadExcelForAnalysis(input: UploadExcelInput): Promise<UploadExcelOutput> {
  return uploadExcelForAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'excelAnalysisPrompt',
  input: {schema: UploadExcelInputSchema},
  output: {schema: UploadExcelOutputSchema},
  prompt: `You are Nexus AI Bot, a helpful AI assistant in a communication platform.

  The user has uploaded an Excel file. Your task is to read the data from the Excel file and provide a formatted table preview that can be displayed in the chat.

  Here is the Excel file data:
  {{media url=excelDataUri}}
  
  Return a formatted table preview of the Excel data.
  `,
});

const uploadExcelForAnalysisFlow = ai.defineFlow(
  {
    name: 'uploadExcelForAnalysisFlow',
    inputSchema: UploadExcelInputSchema,
    outputSchema: UploadExcelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

