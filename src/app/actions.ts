
"use server";

import { whatsappService } from "@/lib/whatsapp";
import { geminiService } from "@/lib/gemini";
import { db } from "@/lib/firebase"; // This is client SDK, careful. 
// Actually, for Server Actions, we might want admin SDK if we were doing DB writes with huge permissions, 
// but since we are just using whatsapp service, it's fine.
// Wait, `db` in `lib/firebase` is initialized with Client SDK. It works in Node environment too usually, 
// but auth might be weird. However, for "sending message", we rely on `whatsappService` which uses axios and env vars. 
// That is perfectly safe in a Server Action.

export async function sendWhatsAppMessage(to: string, message: string) {
    try {
        console.log(`Sending message to ${to}: ${message}`);
        await whatsappService.sendText(to, message);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to send message via Server Action:", error);
        return { success: false, error: error.message };
    }
}



// Gemini Server Action

export async function runGeminiChat(history: { role: "user" | "model"; parts: { text: string }[] }[]) {
    try {
        const lastMsg = history[history.length - 1];

        // 1. Get previous messages (excluding the new prompt)
        let rawHistory = history.slice(0, -1);

        // 2. Token Optimization: Cap memory at last 20 messages to prevent token limits
        if (rawHistory.length > 20) {
            rawHistory = rawHistory.slice(-20);
        }

        // 3. API Safety: Ensure history starts with 'user' to avoid 'GoogleGenerativeAI Error'
        const firstUserIndex = rawHistory.findIndex(h => h.role === 'user');
        if (firstUserIndex !== -1) {
            rawHistory = rawHistory.slice(firstUserIndex);
        } else if (rawHistory.length > 0) {
            // Only model messages found? (Unlikely) -> Reset history
            rawHistory = [];
        }

        const prevHistory = rawHistory.map(h => ({
            role: h.role,
            parts: h.parts[0].text
        }));

        const text = await geminiService.generateResponse(
            lastMsg.parts[0].text,
            prevHistory as { role: "user" | "model"; parts: string }[]
        );
        return { text };
    } catch (e) {
        console.error("Chat Error", e);
        return { text: "Lo siento, tuve un error consultando mi base de datos." };
    }
}
