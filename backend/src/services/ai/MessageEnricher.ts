import { Message } from '../../models/Message';
import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SITE_NAME = 'Nexus';

// We use the absolute cheapest/fastest free model for background enrichment
const ENRICHMENT_MODEL = "google/gemini-2.0-flash-exp:free";

export class MessageEnricher {

    /**
     * Asynchronously analyzes a message and updates it with sentiment/topics.
     * Fire-and-forget.
     */
    static async enrich(messageId: string, content: string): Promise<void> {
        if (!content || content.length < 5) return; // Skip short messages to save rate limits

        try {
            console.log(`[MessageEnricher] analyzing: ${messageId} ...`);

            // Simple prompt for JSON output
            const prompt = `
            Analyze this chat message: "${content}"
            Return a JSON object only:
            {
                "sentiment": { "score": number (-1 to 1), "label": "positive"|"neutral"|"negative" },
                "topics": ["string", "string"],
                "entities": [{ "type": "string", "value": "string" }]
            }
            `;

            const payload = {
                model: ENRICHMENT_MODEL,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" } // Try to force JSON
            };

            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', payload, {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': SITE_URL,
                    'X-Title': SITE_NAME,
                    'Content-Type': 'application/json'
                }
            });

            const rawContent = response.data.choices[0].message.content;

            // Safe Parsing
            let analysis: any = {};
            try {
                // Remove markdown code blocks if present
                const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
                analysis = JSON.parse(cleanJson);
            } catch (e) {
                console.warn('[MessageEnricher] JSON Parse Failed for', messageId);
                return;
            }

            // Update Database
            await Message.findByIdAndUpdate(messageId, {
                sentiment: analysis.sentiment,
                topics: analysis.topics || [],
                entities: analysis.entities || []
            });

            console.log(`[MessageEnricher] success for ${messageId}`);

        } catch (error: any) {
            // Context: "Zero Cost" means we might hit rate limits on free tier. 
            // We just log and ignore enrichment failures. It is non-critical.
            console.warn(`[MessageEnricher] Failed: ${error.message}`);
        }
    }
}
