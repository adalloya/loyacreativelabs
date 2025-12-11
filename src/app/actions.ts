
"use server";

import { whatsappService } from "@/lib/whatsapp";
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
