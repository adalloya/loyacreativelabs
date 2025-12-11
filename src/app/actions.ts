
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

        // 0. LEAD MANAGEMENT (Non-blocking / Best Effort)
        let currentLeadId = leadId;

        // Helper to run DB ops without blocking the response
        const safeDbOp = async (op: Promise<any>) => {
            try {
                await Promise.race([
                    op,
                    new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 1500))
                ]);
            } catch (e) {
                console.warn("DB Op skipped/failed:", e);
                // Fail silently to keep chat alive
            }
        };

        // If no lead ID provided, TRY to create one, but don't die if it fails
        if (!currentLeadId) {
            try {
                // We MUST await this briefly to get an ID for continuity, but if it fails, we proceed without ID
                const leadRefPromise = addDoc(collection(db, "leads"), {
                    status: "new",
                    source: "web_chat",
                    created_at: serverTimestamp(),
                    last_interaction: serverTimestamp(),
                    ...leadInfo
                });

                // Allow 2 seconds max for lead creation
                const leadRef = await Promise.race([
                    leadRefPromise,
                    new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Lead Creation Timeout")), 2000))
                ]);

                currentLeadId = leadRef.id;
            } catch (fsError) {
                console.error("Firestore Lead Creation Failed (API likely disabled):", fsError);
                // Proceed without saving to DB
            }
        } else {
            // Fire and forget update
            safeDbOp(updateDoc(doc(db, "leads", currentLeadId), {
                last_interaction: serverTimestamp(),
                ...leadInfo
            }));
        }

        // 1. Save USER Message (Fire and Forget)
        if (currentLeadId) {
            safeDbOp(addDoc(collection(db, "leads", currentLeadId, "messages"), {
                role: "user",
                content: userText,
                timestamp: serverTimestamp()
            }));
        }

        // 2. Prepare History (unchanged)
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

        // 4. Save MODEL Response (Fire and Forget)
        if (currentLeadId) {
            safeDbOp(addDoc(collection(db, "leads", currentLeadId, "messages"), {
                role: "model",
                content: text,
                timestamp: serverTimestamp()
            }));
        }

        return { text, leadId: currentLeadId };

    } catch (e) {
        console.error("Chat Error", e);
        return { text: "Lo siento, tuve un error técnico temporal, pero aquí sigo." };
    }
}
