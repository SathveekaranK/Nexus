'use server';

/**
 * @fileOverview Implements the Nexus AI Bot flow.
 *
 * - askNexusAiBot - A function that allows users to query the Nexus AI Bot with channel context.
 * - AskNexusAiBotInput - The input type for the askNexusAiBot function.
 * - AskNexusAiBotOutput - The return type for the askNexusAiBot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskNexusAiBotInputSchema = z.object({
  query: z.string().describe('The query to ask the Nexus AI Bot.'),
  channelMessages: z
    .string()
    .array()
    .max(50)
    .describe('The last 50 messages of the channel context.'),
});
export type AskNexusAiBotInput = z.infer<typeof AskNexusAiBotInputSchema>;

const AskNexusAiBotOutputSchema = z.object({
  answer: z.string().describe('The answer from the Nexus AI Bot.'),
});
export type AskNexusAiBotOutput = z.infer<typeof AskNexusAiBotOutputSchema>;

export async function askNexusAiBot(input: AskNexusAiBotInput): Promise<AskNexusAiBotOutput> {
  return askNexusAiBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askNexusAiBotPrompt',
  input: {schema: AskNexusAiBotInputSchema},
  output: {schema: AskNexusAiBotOutputSchema},
  prompt: `You are the Nexus AI Bot, an integrated system bot in a collaboration platform similar to Microsoft Teams. You are assisting users within a specific channel.

  You have access to the last 50 messages in the channel. Use this context to answer the user's query or summarize the discussion, but make sure that you adhere to these constraints strictly:

  - The channel context can be irrelevant to the question. Be sure to handle this case.
  - If you cannot answer the user's query, respond politely that you are unable to answer the query.
  - Don't act as a search engine. You must rely on the context of the last messages to respond.

  Channel context:\n{{#each channelMessages}}\n- {{{this}}}\n{{/each}}\n\nUser query: {{{query}}}`,
});

const askNexusAiBotFlow = ai.defineFlow(
  {
    name: 'askNexusAiBotFlow',
    inputSchema: AskNexusAiBotInputSchema,
    outputSchema: AskNexusAiBotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
