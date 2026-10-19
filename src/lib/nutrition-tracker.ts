// ========================================================================
// APEX HYPERTROPHY OS - DAILY NUTRITION TRACKER & CALENDAR ENGINE
// ========================================================================

export type MealCategory = "breakfast" | "snack1" | "lunch" | "snack2" | "dinner";

export interface MealCategoryConfig {
    key: MealCategory;
    title: string;
    subtitle: string;
    iconEmoji: string;
    suggestedPct: number; // Suggested % of daily calories
}

export const MEAL_CATEGORIES: MealCategoryConfig[] = [
    { key: "breakfast", title: "Desayuno", subtitle: "Primera comida anabólica", iconEmoji: "🌅", suggestedPct: 25 },
    { key: "snack1", title: "Colación 1", subtitle: "Media mañana / Pre-entreno", iconEmoji: "🍎", suggestedPct: 15 },
    { key: "lunch", title: "Comida", subtitle: "Comida principal del día", iconEmoji: "🥩", suggestedPct: 35 },
    { key: "snack2", title: "Colación 2", subtitle: "Media tarde / Post-entreno", iconEmoji: "🥑", suggestedPct: 15 },
    { key: "dinner", title: "Cena / Colación 3", subtitle: "Cena & soporte nocturno", iconEmoji: "🌙", suggestedPct: 10 },
];

export interface FoodItem {
    id: string;
    name: string;
    calories: number;
    proteinG?: number;
    carbsG?: number;
    fatsG?: number;
    time?: string;
}

export interface DailyNutritionLog {
    date: string; // YYYY-MM-DD
    meals: Record<MealCategory, FoodItem[]>;
    supplementsTaken: Record<string, boolean>; // key: supplement name -> boolean
    notes?: string;
    waterLiters?: number;
}

/**
 * Retorna la fecha de hoy en formato local YYYY-MM-DD
 */
export function getLocalDateString(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Crea una entrada vacía para un nuevo día
 */
export function createEmptyDailyNutritionLog(date: string): DailyNutritionLog {
    return {
        date,
        meals: {
            breakfast: [],
            snack1: [],
            lunch: [],
            snack2: [],
            dinner: []
        },
        supplementsTaken: {},
        notes: "",
        waterLiters: 0
    };
}

/**
 * Calcula el total de calorías de una lista de comidas o un día entero
 */
export function calculateDailyNutritionTotals(log?: DailyNutritionLog | null) {
    if (!log || !log.meals) {
        return {
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFats: 0,
            mealCalories: {
                breakfast: 0,
                snack1: 0,
                lunch: 0,
                snack2: 0,
                dinner: 0
            },
            totalItems: 0
        };
    }

    const mealCalories: Record<MealCategory, number> = {
        breakfast: 0,
        snack1: 0,
        lunch: 0,
        snack2: 0,
        dinner: 0
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalItems = 0;

    for (const cat of MEAL_CATEGORIES) {
        const items = log.meals[cat.key] || [];
        for (const item of items) {
            const cal = Number(item.calories) || 0;
            mealCalories[cat.key] += cal;
            totalCalories += cal;
            totalProtein += Number(item.proteinG) || 0;
            totalCarbs += Number(item.carbsG) || 0;
            totalFats += Number(item.fatsG) || 0;
            totalItems++;
        }
    }

    return {
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFats,
        mealCalories,
        totalItems
    };
}

/**
 * Detecta días pasados dentro de un rango (ej. últimos 7 días) que no tienen registro
 */
export function findPendingNutritionDates(
    allLogs: Record<string, DailyNutritionLog>,
    daysToCheck: number = 7
): string[] {
    const pendingDates: string[] = [];
    const today = new Date();

    // Revisamos desde ayer hacia atrás
    for (let i = 1; i <= daysToCheck; i++) {
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - i);
        const dateStr = getLocalDateString(pastDate);

        const log = allLogs[dateStr];
        const totals = calculateDailyNutritionTotals(log);
        if (totals.totalCalories === 0) {
            pendingDates.push(dateStr);
        }
    }

    return pendingDates;
}

/**
 * Formatea una fecha YYYY-MM-DD en español amigable
 */
export function formatFriendlyDate(dateStr: string): string {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const d = new Date(year, month, day);
    const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };
    const formatted = d.toLocaleDateString("es-MX", options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
