
"use server";

import { whatsappService } from "@/lib/whatsapp";
import { geminiService } from "@/lib/gemini";
// Imports fixed

// Notes on DB imported later...

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



// Firestore Imports
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Gemini Server Action
export async function runGeminiChat(
    history: { role: "user" | "model"; parts: { text: string }[] }[],
    leadId?: string,
    leadInfo?: { name?: string, phone?: string } // Optional info if we have it
) {
    try {
        const lastMsg = history[history.length - 1];
        const userText = lastMsg.parts[0].text;

        // 0. LEAD MANAGEMENT (Create or Update)
        let currentLeadId = leadId;

        // If no lead ID provided, create a new Lead
        if (!currentLeadId) {
            try {
                const leadRef = await addDoc(collection(db, "leads"), {
                    status: "new",
                    source: "web_chat",
                    created_at: serverTimestamp(), // Use server timestamp
                    last_interaction: serverTimestamp(),
                    ...leadInfo // Spread optional info if available
                });
                currentLeadId = leadRef.id;
            } catch (fsError) {
                console.error("Firestore Create Lead Error:", fsError);
                // Continue without DB if DB fails, to at least reply
            }
        } else {
            // Update last interaction
            try {
                const leadRef = doc(db, "leads", currentLeadId);
                await updateDoc(leadRef, {
                    last_interaction: serverTimestamp(),
                    ...leadInfo // Update info if new info provided
                });
            } catch (e) { console.error("Update Lead Error", e); }
        }

        // 1. Save USER Message to DB
        if (currentLeadId) {
            try {
                await addDoc(collection(db, "leads", currentLeadId, "messages"), {
                    role: "user",
                    content: userText,
                    timestamp: serverTimestamp()
                });
            } catch (e) { console.error("Save User Msg Error", e); }
        }

        // 2. Prepare History for Gemini (Same logic as before)
        let rawHistory = history.slice(0, -1);
        if (rawHistory.length > 20) rawHistory = rawHistory.slice(-20);

        const firstUserIndex = rawHistory.findIndex(h => h.role === 'user');
        if (firstUserIndex !== -1) {
            rawHistory = rawHistory.slice(firstUserIndex);
        } else if (rawHistory.length > 0) {
            rawHistory = [];
        }

        const prevHistory = rawHistory.map(h => ({
            role: h.role as "user" | "model",
            parts: h.parts[0].text
        }));

        // 3. Generate AI Response
        const text = await geminiService.generateResponse(
            userText,
            prevHistory
        );

        // 4. Save MODEL Response to DB
        if (currentLeadId) {
            try {
                await addDoc(collection(db, "leads", currentLeadId, "messages"), {
                    role: "model",
                    content: text,
                    timestamp: serverTimestamp()
                });
            } catch (e) { console.error("Save Model Msg Error", e); }
        }

        return { text, leadId: currentLeadId };

    } catch (e) {
        console.error("Chat Error", e);
        return { text: "Lo siento, tuve un error consultando mi base de datos." };
    }
}
