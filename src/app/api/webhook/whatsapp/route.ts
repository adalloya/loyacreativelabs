import { NextRequest, NextResponse } from "next/server";
import { whatsappService } from "@/lib/whatsapp"; // We'll assume relative imports work or fix if needed
import { geminiService } from "@/lib/gemini";

// Environment check
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "loya_creative_secret";

// GET: Verification Challenge
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
        console.log("Webhook verified successfully!");
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse("Forbidden", { status: 403 });
}

// POST: Message Handler
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Check if it's a WhatsApp status update or message
        if (
            body.object === "whatsapp_business_account" &&
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const message = body.entry[0].changes[0].value.messages[0];
            const senderId = message.from;
            const messageId = message.id;

            // Mark as read immediately
            await whatsappService.markAsRead(messageId);

            // Process Message
            let userText = "";
            let audioBuffer: ArrayBuffer | undefined = undefined;

            if (message.type === "text") {
                userText = message.text.body;
            } else if (message.type === "audio") {
                console.log("Audio message received. ID:", message.audio.id);
                audioBuffer = await whatsappService.downloadMedia(message.audio.id);
            } else {
                return NextResponse.json({ status: "ignored_media_type" });
            }

            // --- FIREBASE LOGGING (USER) ---
            try {
                const { db } = await import("@/lib/firebase");
                const { doc, setDoc, collection, addDoc } = await import("firebase/firestore");

                // 1. Ensure Lead Exists (Upsert by Phone Number)
                const leadRef = doc(db, "leads", senderId);
                await setDoc(leadRef, {
                    phone: senderId,
                    last_interaction: new Date(),
                    source: 'bot',
                    status: 'active'
                }, { merge: true });

                // 2. Log User Message
                await addDoc(collection(db, "leads", senderId, "messages"), {
                    role: "user",
                    content: userText || "[Audio Message]",
                    type: message.type,
                    timestamp: new Date()
                });

                // Get history for Gemini context (Optional improvement for later)
                // For now, stateless.

                // Send to Gemini
                const aiResponse = await geminiService.generateResponse(userText, [], audioBuffer);

                // 3. Log AI Response
                await addDoc(collection(db, "leads", senderId, "messages"), {
                    role: "model",
                    content: aiResponse,
                    type: "text",
                    timestamp: new Date()
                });

                // Reply to user
                await whatsappService.sendText(senderId, aiResponse);

            } catch (err) {
                console.error("Error logging to Firebase:", err);
                // Fallback if DB fails: still try to reply
                const aiResponse = await geminiService.generateResponse(userText, [], audioBuffer);
                await whatsappService.sendText(senderId, aiResponse);
            }

            return NextResponse.json({ status: "success" });
        }

        return NextResponse.json({ status: "ignored_event" });
    } catch (error) {
        console.error("Error in webhook POST:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
