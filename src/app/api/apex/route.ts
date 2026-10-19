import { NextRequest, NextResponse } from "next/server";
import { generateMonthlyDietWithGemini, recalculateOffPlanMeal, getContextualMindset } from "@/lib/gemini-apex";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === "generate-diet") {
            const { bio, macros } = body;
            const plan = await generateMonthlyDietWithGemini(bio, macros);
            return NextResponse.json({ success: true, plan });
        }

        if (action === "recalculate-meal") {
            const { description, targetCalories, targetProtein } = body;
            const result = await recalculateOffPlanMeal(description, targetCalories, targetProtein);
            return NextResponse.json({ success: true, result });
        }

        if (action === "get-mindset") {
            const { readiness, trainingDayName } = body;
            const quote = await getContextualMindset(readiness, trainingDayName);
            return NextResponse.json({ success: true, quote });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

    } catch (e: any) {
        console.error("APEX API Error:", e);
        return NextResponse.json({ success: false, error: e.message || "Internal error" }, { status: 500 });
    }
}
