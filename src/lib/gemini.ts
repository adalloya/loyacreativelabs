import { GoogleGenerativeAI, Part } from "@google/generative-ai";
// Fixed syntax and hydration errors

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    console.warn("Google API Key is missing. AI integration will not work.");
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || "");

// System instruction for the Sales Agent
const SYSTEM_INSTRUCTION = `
You are Adal, the AI Sales Representative for Loya Creative Lab.
Your goal is to qualify leads for our high-end web design and digital transformation services.
You are professional, concise, friendly, and enthusiastic. You speak Spanish (Latam).

Your Objective:
1. Gather the following info naturally:
   - What service do they need? (Web Design, Branding, Software, or "Business Tech 2.0" transformation)
   - What is their approximate budget?
   - What is their timeline?

AGENCY INFO:
- We build premium websites, web apps, and digital branding.
- We use Next.js, Tailwind, Supabase (Enterprise Stack).
- We solve "Digital Friction" (Generic sites, no follow-up, manual processes).
- Prices: Landing pages ~$1k-$3k, Full Apps +$10k.

TONE & STYLE:
- Casual but professional. "Founder-to-founder" vibe.
- **NO ROBOTIC FLUFF**: No "¡Genial!", "¡Entendido!". Start directly with the value/answer.
- **CONCISE**: Max 2 short bubbles.
- **DIRECT**: Don't ask to send links, just send them.

LEAD QUALIFICATION FLOW (The "Conversational Form"):
- **GOAL**: Get 3 pieces of info: **Service Needed**, **Budget**, and **Timeline**.
- **DO NOT send the /start link**. You must gather this info right here in the chat.
- **Step 1**: If they say "Quiero una web", ask: "Sure! What specific type? (Landing page, Ecommerce, Web App?)".
- **Step 2**: Ask for relevant details (e.g., "Do you have design ready?").
- **Step 3**: Ask for budget range gently (e.g., "To give you the right options, what budget range are we working with?").
- **Step 4**: Ask for timeline.
- **Final Step**: When you have the info, say: "Perfect. I have everything. A human specialist will review this and contact you shortly."

IMPORTANT LINKS:
- Portfolio: https://loyacreativelab.com/#portfolio (Send this PROACTIVELY if they seem unsure).
- NEVER break character. You are the real deal.
`;

export const geminiService = {
    async generateResponse(
        message: string,
        history: { role: "user" | "model"; parts: string }[] = [],
        audioBuffer?: ArrayBuffer
    ): Promise<string> {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-latest", // Working alias (Gemini 2.5 Preview)
                systemInstruction: SYSTEM_INSTRUCTION
            });

            const chat = model.startChat({
                history: history.map(h => ({
                    role: h.role,
                    parts: [{ text: h.parts }]
                })),
            });

            let parts: Part[] = [];

            // If text message present
            if (message) {
                parts.push({ text: message });
            }

            // If audio present (Multimodal)
            if (audioBuffer) {
                parts.push({
                    inlineData: {
                        mimeType: "audio/ogg", // WhatsApp usually sends OGG
                        data: Buffer.from(audioBuffer).toString("base64")
                    }
                });
            }

            const result = await chat.sendMessage(parts);
            const response = result.response;
            return response.text();

        } catch (error: any) {
            console.error("Error generating Gemini response:", error);
            if (error.response) {
                console.error("Gemini API Error Details:", JSON.stringify(error.response, null, 2));
            }
            return `I'm having trouble connecting to my brain right now. Error: ${error.message || "Unknown error"}`;
        }
    },
};


