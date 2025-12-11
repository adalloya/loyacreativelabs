import { NextRequest, NextResponse } from "next/server";
import { geminiService } from "@/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, history } = body;

        // Simulate delay for realism
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const aiResponse = await geminiService.generateResponse(message, history);

        return NextResponse.json({
            response: aiResponse,
            status: "success"
        });
    } catch (error) {
        console.error("Error in mock-chat:", error);
        return NextResponse.json(
            { error: "Failed to communicate with AI" },
            { status: 500 }
        );
    }
}
