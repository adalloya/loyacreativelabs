// src/lib/calendar-export.ts
// ========================================================================
// APEX HYPERTROPHY OS - CALENDAR EXPORT LOGISTICS (GMAIL, OUTLOOK, ICAL)
// ========================================================================

export interface CalendarEvent {
    title: string;
    description: string;
    start: Date;
    end: Date;
    location?: string;
}

/**
 * Parsea un string de horario (ej: "08:00 AM", "1:30 PM", "14:00") a horas y minutos.
 */
export function parseMealTimeToHours(
    timingStr?: string,
    defaultHour: number = 8,
    defaultMinute: number = 0
): { hours: number; minutes: number } {
    if (!timingStr) return { hours: defaultHour, minutes: defaultMinute };

    const clean = timingStr.trim().toUpperCase();
    const isPM = clean.includes("PM");
    const isAM = clean.includes("AM");

    const match = clean.match(/(\d{1,2}):(\d{2})/);
    if (!match) {
        const singleHourMatch = clean.match(/(\d{1,2})/);
        if (singleHourMatch) {
            let h = parseInt(singleHourMatch[1], 10);
            if (isPM && h < 12) h += 12;
            if (isAM && h === 12) h = 0;
            return { hours: h, minutes: 0 };
        }
        return { hours: defaultHour, minutes: defaultMinute };
    }

    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    return { hours: h, minutes: m };
}

/**
 * Genera la URL para agregar un evento a Google Calendar (Gmail).
 */
export function createGoogleCalendarUrl(event: CalendarEvent): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatGDate = (d: Date) => {
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };

    const dates = `${formatGDate(event.start)}/${formatGDate(event.end)}`;
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.title,
        details: event.description,
        location: event.location || "APEX Hypertrophy OS",
        dates: dates
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera la URL para agregar un evento a Outlook Web (Microsoft 365 / Outlook.com).
 */
export function createOutlookCalendarUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
        path: "/calendar/action/compose",
        rru: "addevent",
        subject: event.title,
        body: event.description,
        location: event.location || "APEX Hypertrophy OS",
        startdt: event.start.toISOString(),
        enddt: event.end.toISOString()
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Genera y descarga un archivo estándar .ics (iCalendar) compatible con Google Calendar, Outlook, Apple Calendar, etc.
 */
export function downloadIcsCalendar(
    events: CalendarEvent[],
    filename: string = "apex_plan_nutricional.ics"
): void {
    if (typeof window === "undefined" || events.length === 0) return;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatIcsDate = (d: Date) => {
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };

    const now = formatIcsDate(new Date());

    const eventBlocks = events.map((ev, i) => {
        // Escapar caracteres según RFC 5545
        const safeSummary = ev.title.replace(/[\r\n]+/g, " ").trim();
        const safeDesc = ev.description.replace(/[\r\n]+/g, "\\n").trim();
        const safeLoc = (ev.location || "APEX Hypertrophy OS").replace(/[\r\n]+/g, " ").trim();

        return [
            "BEGIN:VEVENT",
            `UID:apex_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}@apexos.app`,
            `DTSTAMP:${now}`,
            `DTSTART:${formatIcsDate(ev.start)}`,
            `DTEND:${formatIcsDate(ev.end)}`,
            `SUMMARY:${safeSummary}`,
            `DESCRIPTION:${safeDesc}`,
            `LOCATION:${safeLoc}`,
            "STATUS:CONFIRMED",
            "TRANSP:OPAQUE",
            "END:VEVENT"
        ].join("\r\n");
    }).join("\r\n");

    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//APEX Hypertrophy OS//Nutrition Calendar//ES",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:APEX Nutrición & Hábitos",
        "X-WR-TIMEZONE:UTC",
        eventBlocks,
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Construye un evento de resumen diario con todas las comidas del día.
 */
export function buildDailyMealCalendarEvent(
    dayLabel: string,
    dateIso: string,
    meals: any[],
    targetCalories?: number
): CalendarEvent {
    const baseDate = new Date(`${dateIso}T08:00:00`);

    const mealsText = meals.map((m: any, idx: number) => {
        const name = m.mealName || m.name || `Comida ${idx + 1}`;
        const timing = m.timing ? ` [${m.timing}]` : "";
        const cals = m.calories || Math.round(((m.macros?.proteinG || 0) * 4) + ((m.macros?.carbsG || 0) * 4) + ((m.macros?.fatsG || 0) * 9)) || 0;
        const protein = m.proteinG || m.macros?.proteinG || 0;
        const ings = Array.isArray(m.ingredients)
            ? m.ingredients.map((i: any) => `    - ${i.grams ? `${i.grams}g ` : ""}${typeof i === "string" ? i : i.item || i.name}`).join("\n")
            : m.items ? `    - ${m.items}` : "";

        return `🍽️ ${name}${timing} (${cals} kcal • ${protein}g P)\n${ings}`;
    }).join("\n\n");

    const description = `PLAN NUTRICIONAL APEX (7 DÍAS - GEMINI IA)
Día: ${dayLabel}
Meta calórica diaria: ${targetCalories ? `${targetCalories} kcal` : "Calculada"}

DESGLOSE DE COMIDAS:
${mealsText}

Generado automáticamente por APEX Hypertrophy OS.`;

    const startDate = new Date(baseDate);
    startDate.setHours(8, 0, 0, 0);

    const endDate = new Date(baseDate);
    endDate.setHours(21, 30, 0, 0);

    return {
        title: `🥗 Menú APEX: ${dayLabel} (${targetCalories || 2200} kcal)`,
        description,
        start: startDate,
        end: endDate,
        location: "APEX Nutrición"
    };
}

/**
 * Construye eventos individuales para cada comida del día con su horario exacto.
 */
export function buildIndividualMealCalendarEvents(
    dateIso: string,
    meals: any[]
): CalendarEvent[] {
    const defaultHours = [8, 13, 17, 20, 22]; // Default para 5 tiempos

    return meals.map((m: any, idx: number) => {
        const name = m.mealName || m.name || `Comida ${idx + 1}`;
        const defH = defaultHours[idx] || 12;
        const { hours, minutes } = parseMealTimeToHours(m.timing, defH, 0);

        const startDate = new Date(`${dateIso}T12:00:00`);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + 45); // Duración 45 min

        const cals = m.calories || Math.round(((m.macros?.proteinG || 0) * 4) + ((m.macros?.carbsG || 0) * 4) + ((m.macros?.fatsG || 0) * 9)) || 0;
        const protein = m.proteinG || m.macros?.proteinG || 0;
        const carbs = m.carbsG || m.macros?.carbsG || 0;
        const fats = m.fatsG || m.macros?.fatsG || 0;

        const ings = Array.isArray(m.ingredients)
            ? m.ingredients.map((i: any) => `• ${i.grams ? `${i.grams}g ` : ""}${typeof i === "string" ? i : i.item || i.name}`).join("\n")
            : m.items || "";

        const description = `HORARIO: ${m.timing || `${hours}:${minutes.toString().padStart(2, "0")}`}
MACROS: ${cals} kcal | ${protein}g Proteína | ${carbs}g Carbohidratos | ${fats}g Grasas

INGREDIENTES & GRAMAJES:
${ings}

APEX Hypertrophy OS - Régimen Nutricional Clínico`;

        return {
            title: `🍽️ ${name} (${cals} kcal • ${protein}g P)`,
            description,
            start: startDate,
            end: endDate,
            location: "APEX Nutrición"
        };
    });
}

/**
 * Construye la lista de eventos para toda la semana completa (7 días).
 */
export function buildWeeklyMealCalendarEvents(
    mondayDateIso: string,
    thirtyDayPlanOrTemplates: any[]
): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const baseMonday = new Date(`${mondayDateIso}T12:00:00`);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const d = new Date(baseMonday);
        d.setDate(d.getDate() + dayOffset);
        const iso = d.toISOString().split("T")[0];

        const dayData = thirtyDayPlanOrTemplates[dayOffset] || thirtyDayPlanOrTemplates[0];
        const meals = dayData?.meals || [];

        if (meals.length > 0) {
            const mealEvents = buildIndividualMealCalendarEvents(iso, meals);
            events.push(...mealEvents);
        }
    }

    return events;
}
