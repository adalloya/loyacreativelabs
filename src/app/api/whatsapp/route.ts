
import { NextRequest, NextResponse } from "next/server";
import { geminiService } from "@/lib/gemini";
import { whatsappService } from "@/lib/whatsapp";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    orderBy,
    limit,
    serverTimestamp,
    doc,
    updateDoc
} from "firebase/firestore";

// Helper for consistency
const getLeadByPhone = async (phone: string) => {
    const q = query(collection(db, "leads"), where("phone", "==", phone), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0];
    }
    return null;
};

// 1. VERIFICATION (GET)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Retrieve from env or fallback
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "loya_lab_verify_token";

    if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }
    return new NextResponse("Bad Request", { status: 400 });
}

// 2. MESSAGE HANDLING (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Check if this is a WhatsApp status update (delivered, read, etc.)
        // We generally ignore these for the bot logic but ack them.
        const changes = body.entry?.[0]?.changes?.[0];
        if (changes?.value?.statuses) {
            return new NextResponse("EVENT_RECEIVED", { status: 200 });
        }

        const messages = changes?.value?.messages;
        if (!messages || messages.length === 0) {
            return new NextResponse("EVENT_RECEIVED", { status: 200 });
        }

        const message = messages[0];
        const from = message.from; // Phone number
        const messageId = message.id;

        // Only handle text messages for now
        if (message.type !== "text") {
            // TODO: Handle audio/images if needed later
            // Mark as read anyway so we don't keep getting retries
            await whatsappService.markAsRead(messageId);
            return new NextResponse("EVENT_RECEIVED", { status: 200 });
        }

        const userText = message.text.body;
        console.log(`[WhatsApp] Received from ${from}: ${userText}`);

        // Mark as read immediately
        await whatsappService.markAsRead(messageId);

        // --- CORE LOGIC ---

        // 1. Find or Create Lead in Firebase
        let leadId: string;
        let leadDoc = await getLeadByPhone(from);

        if (leadDoc) {
            leadId = leadDoc.id;
            // Update last interaction
            await updateDoc(doc(db, "leads", leadId), {
                last_interaction: serverTimestamp()
            });
        } else {
            // New Lead
            const newLeadRef = await addDoc(collection(db, "leads"), {
                phone: from,
                status: "new",
                source: "whatsapp",
                created_at: serverTimestamp(),
                last_interaction: serverTimestamp()
            });
            leadId = newLeadRef.id;
        }

        // 2. Save USER Message
        await addDoc(collection(db, "leads", leadId, "messages"), {
            role: "user",
            content: userText,
            timestamp: serverTimestamp()
        });

        // 3. Retrieve Conversation History for Context
        // Get last 20 messages, ordered by time
        const msgsQ = query(
            collection(db, "leads", leadId, "messages"),
            orderBy("timestamp", "desc"),
            limit(20)
        );
        const msgsSnapshot = await getDocs(msgsQ);

        // Firebase returns newest first because of desc sort, so we reverse it
        const rawHistory = msgsSnapshot.docs.map(d => d.data()).reverse();

        // Format for Gemini
        // We only want previous messages, excluding the one we just saved (optional, mostly fine to include)
        // Actually, geminiService expects the history *before* the current message usually, 
        // but our implementation in actions.ts passes current msg as argument and history as context.
        // Let's align with that pattern: specific 'message' + 'history' context.

        const geminiHistory = rawHistory.slice(0, -1).map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model" as "user" | "model",
            parts: msg.content
        }));

        // 4. Generate AI Response
        const aiResponseText = await geminiService.generateResponse(userText, geminiHistory);

        // 5. Send Response via WhatsApp
        await whatsappService.sendText(from, aiResponseText);

        // 6. Save MODEL Response
        await addDoc(collection(db, "leads", leadId, "messages"), {
            role: "model",
            content: aiResponseText,
            timestamp: serverTimestamp()
        });

        return new NextResponse("EVENT_RECEIVED", { status: 200 });

    } catch (error: any) {
        console.error("Error processing WhatsApp webhook:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
