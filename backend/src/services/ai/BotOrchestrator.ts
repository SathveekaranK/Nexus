import axios from 'axios';
import { PromptBuilder } from './PromptBuilder';
import { TOOL_REGISTRY, getToolDefinitions } from './ToolRegistry';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SITE_NAME = 'Nexus';

// Zero-Cost Model List (Priority Order)
const FREE_MODELS = [
    "xiaomi/mimo-v2-flash:free",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.2-3b-instruct:free"
];

export class BotOrchestrator {

    /**
     * Main entry point for processing a user message.
     * Manages the "ReAct" loop: User -> LLM -> [Tool Call -> Result -> LLM] -> Response
     */
    static async processUserMessage(historyMessages: any[], user: any, io: any): Promise<any> {
        try {
            const systemPrompt = await PromptBuilder.buildSystemPrompt();
            const tools = getToolDefinitions();

            // Initial Messages Array (System + History)
            let messages: any[] = [
                { role: "system", content: systemPrompt },
                ...historyMessages
            ];

            // 1. Initial LLM Call
            let response = await this.callLLM(messages, tools);
            let msg = response.choices[0].message;

            // 2. Loop for Tool Calls (Handle multi-step actions)
            // Limit loop to prevent infinite recursion (max 5 steps)
            let steps = 0;
            while (msg.tool_calls && steps < 5) {
                steps++;
                // Append assistant's "thought" (tool call request)
                messages.push(msg);

                // Execute ALL tool calls in parallel (or sequential if preferred)
                for (const toolCall of msg.tool_calls) {
                    const fnName = toolCall.function.name;
                    const tool = TOOL_REGISTRY[fnName];

                    if (tool) {
                        let fnArgs = {};
                        try {
                            fnArgs = JSON.parse(toolCall.function.arguments);
                        } catch (e) {
                            console.error(`[BotOrchestrator] JSON Parse Error for tool ${fnName}`, e);
                        }

                        console.log(`[BotOrchestrator] Executing Tool: ${fnName}`, fnArgs);

                        // EXECUTE TOOL
                        let result = "Error: Tool execution failed.";
                        try {
                            result = await tool.handler(fnArgs, { user, io });
                        } catch (err: any) {
                            result = `Error: ${err.message}`;
                        }

                        // Append Tool Result
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: fnName,
                            content: result
                        });
                    } else {
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: fnName,
                            content: "Error: Tool function not found in registry."
                        });
                    }
                }

                // 3. Call LLM again with tool results
                response = await this.callLLM(messages, tools);
                msg = response.choices[0].message;
            }

            return msg; // Final assistant response

        } catch (error: any) {
            console.error("BotOrchestrator Error:", error);
            // Fallback response instead of crash
            return {
                role: "assistant",
                content: "I apologize, but I'm having trouble connecting to my brain right now. Please try again in block."
            };
        }
    }

    /**
     * Calls OpenRouter with Fallback strategy for free models.
     */
    private static async callLLM(messages: any[], tools: any[]): Promise<any> {
        let lastError = null;

        for (const model of FREE_MODELS) {
            try {
                console.log(`[BotOrchestrator] Trying model: ${model}`);
                const payload: any = {
                    model: model,
                    messages: messages,
                    tools: tools,
                    tool_choice: "auto"
                };

                const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', payload, {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': SITE_URL,
                        'X-Title': SITE_NAME,
                        'Content-Type': 'application/json'
                    }
                });

                return res.data; // Success!

            } catch (error: any) {
                console.warn(`[BotOrchestrator] Model ${model} failed:`, error.message);
                lastError = error;
                // Continue to next model
            }
        }

        throw lastError || new Error("All free models failed.");
    }
}
