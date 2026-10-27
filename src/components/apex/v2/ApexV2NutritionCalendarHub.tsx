// src/components/apex/v2/ApexV2NutritionCalendarHub.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Utensils,
    Dumbbell,
    Pill,
    Check,
    Camera,
    Plus,
    Trash2,
    ShoppingCart,
    ClipboardList,
    Sparkles,
    Activity,
    Layers,
    X,
    Flame,
    ChevronDown,
    ChevronUp,
    Loader2,
    CheckSquare,
    Square,
    Copy,
    RotateCcw,
    CalendarPlus,
    Undo2
} from "lucide-react";
import {
    DailyNutritionLog,
    createEmptyDailyNutritionLog,
    calculateDailyNutritionTotals,
    getLocalDateString,
    formatFriendlyDate,
    MEAL_CATEGORIES,
    MealCategory
} from "@/lib/nutrition-tracker";
import { SupplementDose } from "@/lib/nutrition-logistics";
import { localDb, ExerciseLog } from "@/lib/local-db";
import { FoodCameraScannerModal } from "@/components/nutrition/FoodCameraScannerModal";
import { ApexCalendarSyncModal } from "./ApexCalendarSyncModal";
import { Drawer } from "vaul";
import { getInitialTheme, Theme } from "@/lib/theme";

/**
 * Calcula una porción o medida casera estimada según el tipo de ingrediente y su gramaje clínico.
 */
function getHouseholdPortionEstimate(itemName: string, grams?: number | null): string | null {
    if (!grams || grams <= 0) return null;
    const lower = itemName.toLowerCase();

    // Huevos enteros
    if (/huevo/.test(lower) && !/clara/.test(lower)) {
        const count = Math.max(1, Math.round(grams / 55));
        return count === 1 ? "~1 pza" : `~${count} pzas`;
    }
    // Claras de huevo
    if (/clara/.test(lower)) {
        const count = Math.max(1, Math.round(grams / 35));
        return `~${count} claras`;
    }
    // Aceites / Ghee / Mantequilla
    if (/aceite|ghee|mantequilla/.test(lower)) {
        if (grams <= 7) return "~1 cdita";
        if (grams <= 12) return "~2 cditas";
        if (grams <= 18) return "~1 cda sopera";
        const cdas = (grams / 14).toFixed(1).replace(/\.0$/, "");
        return `~${cdas} cdas`;
    }
    // Aguacate
    if (/aguacate/.test(lower)) {
        if (grams <= 70) return "~¼ pza";
        if (grams <= 140) return "~½ pza";
        if (grams <= 220) return "~1 pza entera";
        return `~${(grams / 180).toFixed(1)} pzas`;
    }
    // Avena en hojuelas
    if (/avena/.test(lower)) {
        if (grams <= 45) return "~½ taza";
        if (grams <= 65) return "~⅔ taza";
        if (grams <= 90) return "~1 taza";
        return `~${(grams / 80).toFixed(1)} tazas`;
    }
    // Arroz o pasta cocida
    if (/arroz|pasta|quinoa/.test(lower)) {
        if (grams <= 100) return "~½ taza";
        if (grams <= 160) return "~¾ taza";
        if (grams <= 220) return "~1 taza";
        return `~${(grams / 180).toFixed(1)} tazas`;
    }
    // Proteína en polvo / Whey
    if (/whey|proteína|proteina/.test(lower) && /polvo|isolate|scoop/.test(lower)) {
        const scoops = Math.max(1, Math.round(grams / 30));
        return scoops === 1 ? "~1 scoop" : `~${scoops} scoops`;
    }
    // Frutos secos (almendras, nueces, cacahuates)
    if (/nuez|nueces|almendra|cacahuate|pistache/.test(lower)) {
        if (grams <= 18) return "~½ puñado";
        if (grams <= 35) return "~1 puñado";
        return "~1-2 puñados";
    }
    // Semillas (chía, linaza, calabaza)
    if (/chía|chia|linaza|semilla/.test(lower)) {
        if (grams <= 8) return "~1 cdita";
        if (grams <= 18) return "~1 cda sopera";
        return "~2 cdas";
    }
    // Frutos rojos (arándanos, fresas, frambuesas)
    if (/arándano|arandano|frambuesa|fresa|mora|frutos rojos/.test(lower)) {
        if (grams <= 80) return "~½ taza";
        if (grams <= 130) return "~¾ taza";
        return "~1 taza";
    }
    // Yogur griego
    if (/yogur|yoghurt/.test(lower)) {
        if (grams <= 130) return "~½ taza";
        if (grams <= 180) return "~¾ taza (1 envase)";
        return "~1 taza";
    }
    // Carnes magras, pollo, res, pescado, salmón
    if (/pollo|pechuga|res|ternera|salmón|salmon|atún|atun|pescado|tilapia/.test(lower)) {
        if (grams <= 130) return "~1 filete chico";
        if (grams <= 190) return "~1 filete mediano";
        if (grams <= 250) return "~1 filete grande";
        return `~${(grams / 150).toFixed(1)} filetes`;
    }
    // Vegetales al vapor / ensaladas (brócoli, espinacas, espárragos)
    if (/brócoli|brocoli|espinaca|espárrago|esparrago|lechuga/.test(lower)) {
        if (grams <= 80) return "~1 taza";
        if (grams <= 160) return "~1.5 tazas";
        return "~2 tazas";
    }
    // Camote / Batata / Papa
    if (/camote|batata|papa/.test(lower)) {
        if (grams <= 120) return "~½ pza mediana";
        if (grams <= 190) return "~1 pza mediana";
        return "~1 pza grande";
    }

    return null;
}

interface ApexV2NutritionCalendarHubProps {
    targetCalories: number;
    targetProteinG: number;
    targetCarbsG?: number;
    targetFatsG?: number;
    supplements: SupplementDose[];
    onUpdateSupplements?: (sups: SupplementDose[]) => void;
    allNutritionLogs: Record<string, DailyNutritionLog>;
    onSaveNutritionLog: (date: string, log: DailyNutritionLog) => void;
    activeDate: string;
    onSelectDate: (date: string) => void;
    dietPlan?: any;
    isDietLoading?: boolean;
    onOpenDietPlanModal?: () => void;
    groceryList?: any;
    onGoToGym?: () => void;
}

export const ApexV2NutritionCalendarHub: React.FC<ApexV2NutritionCalendarHubProps> = ({
    targetCalories,
    targetProteinG,
    targetCarbsG = 250,
    targetFatsG = 65,
    supplements,
    onUpdateSupplements,
    allNutritionLogs,
    onSaveNutritionLog,
    activeDate,
    onSelectDate,
    dietPlan,
    isDietLoading = false,
    onOpenDietPlanModal,
    groceryList,
    onGoToGym
}) => {
    const todayStr = useMemo(() => getLocalDateString(), []);
    const [viewMode, setViewMode] = useState<"nutrition" | "workout">("nutrition");
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const handleThemeChange = (e: Event) => {
            const customEvt = e as CustomEvent<{ theme: Theme }>;
            if (customEvt.detail?.theme) {
                setTheme(customEvt.detail.theme);
            }
        };
        window.addEventListener("apex_theme_change", handleThemeChange);
        return () => window.removeEventListener("apex_theme_change", handleThemeChange);
    }, []);

    const isLight = theme === "light";

    // Camera scanner modal state
    const [isFoodScannerOpen, setIsFoodScannerOpen] = useState(false);
    const [scannerCategory, setScannerCategory] = useState<MealCategory | null>(null);

    // Manual item modal/input
    const [activeAddingCategory, setActiveAddingCategory] = useState<MealCategory | null>(null);
    const [newFoodName, setNewFoodName] = useState("");
    const [newFoodCals, setNewFoodCals] = useState("");
    const [newFoodProtein, setNewFoodProtein] = useState("");

    // Plan Semanal Drawer State (Aislamiento de Planeación)
    const [isWeeklyPlanDrawerOpen, setIsWeeklyPlanDrawerOpen] = useState(false);

    // Estados para Plan Semanal Gemini IA y Lista de Compras
    const [selectedDietDayIndex, setSelectedDietDayIndex] = useState(() => {
        const jsDay = new Date().getDay();
        return jsDay === 0 ? 6 : jsDay - 1; // 0=Lunes, ..., 6=Domingo
    });
    const [activeDietSubTab, setActiveDietSubTab] = useState<"menu" | "groceries">("menu");
    const [isDietCardCollapsed, setIsDietCardCollapsed] = useState(false);
    const [shoppingChecked, setShoppingChecked] = useState<Record<string, boolean>>(() => {
        if (typeof window === "undefined") return {};
        try {
            const raw = window.localStorage.getItem("apex_shopping_checked");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
    const [dietActionToast, setDietActionToast] = useState<string | null>(null);
    const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
    const [registeredDietMeals, setRegisteredDietMeals] = useState<Record<string, { foodId: string; catKey: MealCategory }>>({});

    const handleToggleShoppingItem = (key: string) => {
        setShoppingChecked((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            if (typeof window !== "undefined") {
                window.localStorage.setItem("apex_shopping_checked", JSON.stringify(next));
            }
            return next;
        });
    };

    const handleClearShoppingChecked = () => {
        setShoppingChecked({});
        if (typeof window !== "undefined") {
            window.localStorage.removeItem("apex_shopping_checked");
        }
        setDietActionToast("Lista de compras reiniciada");
        setTimeout(() => setDietActionToast(null), 2000);
    };

    // Clasificador clínico para compras de supermercado
    const categorizeGroceryItem = (name: string): "Proteínas" | "Carbohidratos" | "Grasas Saludables" | "Vegetales y Frutas" | "Esenciales & Otros" => {
        const lower = name.toLowerCase();
        if (/pollo|res|carne|pescado|salmón|salmon|atún|atun|huevo|clara|whey|proteína|proteina|pavo|lomo|tofu|tempeh|cerdo|bistec|camarón|camaron/.test(lower)) {
            return "Proteínas";
        }
        if (/arroz|avena|camote|batata|papa|pasta|pan|tortilla|quinoa|legumbre|lenteja|frijol|cereal|harina|fideos/.test(lower)) {
            return "Carbohidratos";
        }
        if (/aguacate|oliva|aceite|nuez|nueces|almendra|semilla|chía|chia|calabaza|mantequilla|ghee|cacahuate|crema de mani|linaza/.test(lower)) {
            return "Grasas Saludables";
        }
        if (/espinaca|brócoli|brocoli|espárrago|esparrago|fruto|arándano|arandano|frambuesa|fresa|manzana|plátano|platano|lechuga|tomate|vegetal|verdura|zanahoria|apio|pepino|coliflor/.test(lower)) {
            return "Vegetales y Frutas";
        }
        return "Esenciales & Otros";
    };

    // Consolidación de supermercado a 7 días a partir del plan Gemini o fallback clínico
    const consolidatedGroceries = useMemo(() => {
        const categories: Record<string, Array<{ item: string; totalAmount: string; key: string }>> = {
            "Proteínas": [],
            "Carbohidratos": [],
            "Grasas Saludables": [],
            "Vegetales y Frutas": [],
            "Esenciales & Otros": []
        };

        const allDays = (dietPlan?.thirtyDayPlan && Array.isArray(dietPlan.thirtyDayPlan) && dietPlan.thirtyDayPlan.length > 0)
            ? dietPlan.thirtyDayPlan
            : null;

        const baseMeals = allDays
            ? allDays.flatMap((d: any) => d.meals || [])
            : (dietPlan?.weeklyTemplates?.[0]?.meals || []);

        if (baseMeals.length > 0) {
            const itemAggregator: Record<string, { grams: number; category: string; originalItem: string; count: number }> = {};

            baseMeals.forEach((meal: any) => {
                const ings = Array.isArray(meal.ingredients) ? meal.ingredients : [];
                ings.forEach((ing: any) => {
                    const itemName = typeof ing === "string" ? ing : (ing.item || ing.name || "");
                    if (!itemName) return;
                    const grams = typeof ing.grams === "number" ? ing.grams : 0;
                    const cat = categorizeGroceryItem(itemName);
                    const normKey = itemName.trim().toLowerCase();

                    if (!itemAggregator[normKey]) {
                        itemAggregator[normKey] = {
                            grams: grams,
                            category: cat,
                            originalItem: itemName.trim(),
                            count: 1
                        };
                    } else {
                        itemAggregator[normKey].grams += grams;
                        itemAggregator[normKey].count += 1;
                    }
                });
            });

            const aggEntries = Object.values(itemAggregator);
            if (aggEntries.length > 0) {
                aggEntries.forEach((entry) => {
                    let amountText = "";
                    if (entry.grams > 0) {
                        if (entry.grams >= 1000) {
                            amountText = `${(entry.grams / 1000).toFixed(1)} kg`;
                        } else {
                            amountText = `${entry.grams} g`;
                        }
                    } else {
                        amountText = entry.count > 1 ? `x${entry.count}` : "";
                    }

                    const catKey = entry.category in categories ? entry.category : "Esenciales & Otros";
                    categories[catKey].push({
                        item: entry.originalItem,
                        totalAmount: amountText,
                        key: entry.originalItem.toLowerCase()
                    });
                });

                return categories;
            }
        }

        // Fallback a groceryList prop si existe
        if (Array.isArray(groceryList) && groceryList.length > 0) {
            groceryList.forEach((g: any) => {
                const cat = g.category && categories[g.category] ? g.category : "Esenciales & Otros";
                categories[cat].push({
                    item: g.item,
                    totalAmount: g.totalAmount || "",
                    key: (g.item || "").toLowerCase()
                });
            });
            return categories;
        }

        if (groceryList && typeof groceryList === "object") {
            Object.entries(groceryList).forEach(([catKey, items]: [string, any]) => {
                const list = Array.isArray(items) ? items : [];
                const properCat = catKey === "protein" || catKey === "Proteínas" ? "Proteínas"
                    : catKey === "carbs" || catKey === "Carbohidratos" ? "Carbohidratos"
                    : catKey === "fats" || catKey === "Grasas Saludables" ? "Grasas Saludables"
                    : "Vegetales y Frutas";
                if (!categories[properCat]) categories[properCat] = [];
                list.forEach((it: any) => {
                    const name = typeof it === "string" ? it : it.name || it.item;
                    const amt = typeof it === "string" ? "" : it.amount || it.totalAmount || "";
                    if (name) {
                        categories[properCat].push({ item: name, totalAmount: amt, key: name.toLowerCase() });
                    }
                });
            });
            return categories;
        }

        return categories;
    }, [dietPlan, groceryList]);

    // Copiar lista de compras consolidada al portapapeles
    const handleCopyShoppingList = () => {
        let text = "🛒 LISTA DE COMPRAS SEMANAL (APEX CLINICAL)\n\n";
        Object.entries(consolidatedGroceries).forEach(([catName, items]) => {
            if (items.length > 0) {
                text += `▶ ${catName.toUpperCase()}:\n`;
                items.forEach((it) => {
                    text += `  • ${it.item}${it.totalAmount ? ` (${it.totalAmount})` : ""}\n`;
                });
                text += "\n";
            }
        });
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text);
            setDietActionToast("✓ Lista de compras copiada al portapapeles");
            setTimeout(() => setDietActionToast(null), 2500);
        }
    };

    // Cargar comida de Gemini directamente al registro de comidas del día activo con control de duplicados
    const handleLoadDietMealToLog = (meal: any, defaultIndex: number) => {
        const mealKey = `${activeDate}_d${selectedDietDayIndex}_m${defaultIndex}`;
        const nameLower = (meal.mealName || meal.name || "").toLowerCase();
        let catKey: MealCategory = "lunch";
        if (/desayuno|comida 1/.test(nameLower) || defaultIndex === 0) catKey = "breakfast";
        else if (/colación 1|snack 1|media mañana|pre-entreno/.test(nameLower) || defaultIndex === 1) catKey = "snack1";
        else if (/almuerzo|comida 2/.test(nameLower) || defaultIndex === 2) catKey = "lunch";
        else if (/merienda|snack 2|colación 2|media tarde|recuperación/.test(nameLower) || defaultIndex === 3) catKey = "snack2";
        else if (/cena|comida 4|comida 3/.test(nameLower)) catKey = "dinner";

        const calories = meal.calories || Math.round(((meal.macros?.proteinG || 0) * 4) + ((meal.macros?.carbsG || 0) * 4) + ((meal.macros?.fatsG || 0) * 9)) || 0;
        const proteinG = meal.proteinG || meal.macros?.proteinG || 0;
        const carbsG = meal.carbsG || meal.macros?.carbsG || 0;
        const fatsG = meal.fatsG || meal.macros?.fatsG || 0;

        const itemsSummary = meal.items || (meal.ingredients?.map((i: any) => `${i.grams ? i.grams + "g " : ""}${i.item}`).join(" + ")) || meal.mealName || meal.name;

        const foodId = `food_gemini_${mealKey}_${Date.now()}`;
        const newItem = {
            id: foodId,
            name: itemsSummary,
            calories: Number(calories) || 0,
            proteinG: Number(proteinG) || 0,
            carbsG: Number(carbsG) || 0,
            fatsG: Number(fatsG) || 0,
            time: meal.timing || new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
            isCompleted: true
        };

        const currentMeals = currentLog.meals || {};
        const catItems = currentMeals[catKey] || [];
        const updated = {
            ...currentLog,
            meals: {
                ...currentMeals,
                [catKey]: [...catItems, newItem]
            }
        };

        onSaveNutritionLog(activeDate, updated);

        // Actualizar mapa de comidas registradas
        setRegisteredDietMeals((prev) => ({
            ...prev,
            [mealKey]: { foodId, catKey }
        }));

        const catLabels: Record<MealCategory, string> = {
            breakfast: "Desayuno",
            snack1: "Colación 1",
            lunch: "Comida",
            snack2: "Colación 2",
            dinner: "Cena"
        };
        setDietActionToast(`✓ Cargado a ${catLabels[catKey] || "tu registro"}`);
        setTimeout(() => setDietActionToast(null), 2500);
    };

    // Deshacer carga de comida del plan semanal
    const handleUndoDietMealLog = (mealKey: string, catKey: MealCategory) => {
        const currentMeals = currentLog.meals || {};
        const catItems = currentMeals[catKey] || [];
        const entry = registeredDietMeals[mealKey];

        const updated = {
            ...currentLog,
            meals: {
                ...currentMeals,
                [catKey]: catItems.filter((i) => {
                    if (entry && i.id === entry.foodId) return false;
                    if (i.id.includes(`gemini_${mealKey}`)) return false;
                    return true;
                })
            }
        };

        onSaveNutritionLog(activeDate, updated);

        setRegisteredDietMeals((prev) => {
            const next = { ...prev };
            delete next[mealKey];
            return next;
        });

        setDietActionToast("Registro removido del día");
        setTimeout(() => setDietActionToast(null), 2000);
    };

    // Workout logs from Dexie for activeDate
    const [dayExerciseLogs, setDayExerciseLogs] = useState<ExerciseLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setIsLoadingLogs(true);
        localDb.exercise_logs
            .where("workout_date")
            .equals(activeDate)
            .toArray()
            .then((logs) => {
                if (isMounted) {
                    setDayExerciseLogs(logs || []);
                    setIsLoadingLogs(false);
                }
            })
            .catch(() => {
                if (isMounted) setIsLoadingLogs(false);
            });
        return () => {
            isMounted = false;
        };
    }, [activeDate]);

    // Active Day Nutrition Log
    const currentLog: DailyNutritionLog = useMemo(() => {
        return allNutritionLogs[activeDate] || createEmptyDailyNutritionLog(activeDate);
    }, [allNutritionLogs, activeDate]);

    const nutritionTotals = useMemo(() => {
        return calculateDailyNutritionTotals(currentLog);
    }, [currentLog]);

    // Workout Telemetry Summary
    const workoutSummary = useMemo(() => {
        const totalSets = dayExerciseLogs.length;
        const totalVolumeKg = dayExerciseLogs.reduce((acc, log) => acc + (log.weight_kg * log.reps_completed), 0);
        const uniqueExercises = new Set(dayExerciseLogs.map(l => l.exercise_id)).size;
        return { totalSets, totalVolumeKg, uniqueExercises };
    }, [dayExerciseLogs]);

    // Supplements stats
    const supplementsCount = supplements.length;
    const supplementsTakenCount = useMemo(() => {
        if (!currentLog.supplementsTaken) return 0;
        return Object.values(currentLog.supplementsTaken).filter(Boolean).length;
    }, [currentLog.supplementsTaken]);

    // Toggle Supplement
    const handleToggleSupplement = (supName: string) => {
        const currentTaken = currentLog.supplementsTaken || {};
        const isNowTaken = !currentTaken[supName];
        const updated = {
            ...currentLog,
            supplementsTaken: {
                ...currentTaken,
                [supName]: isNowTaken
            }
        };
        onSaveNutritionLog(activeDate, updated);
    };

    // Add manual food
    const handleAddManualFood = (category: MealCategory) => {
        if (!newFoodName.trim() || !newFoodCals) return;
        const currentMeals = currentLog.meals || {};
        const catItems = currentMeals[category] || [];
        const newItem = {
            id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: newFoodName.trim(),
            calories: Number(newFoodCals) || 0,
            proteinG: Number(newFoodProtein) || 0,
            carbsG: 0,
            fatsG: 0,
            time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
            isCompleted: true
        };
        const updated = {
            ...currentLog,
            meals: {
                ...currentMeals,
                [category]: [...catItems, newItem]
            }
        };
        onSaveNutritionLog(activeDate, updated);
        setNewFoodName("");
        setNewFoodCals("");
        setNewFoodProtein("");
        setActiveAddingCategory(null);
    };

    // Remove food
    const handleRemoveFood = (category: MealCategory, foodId: string) => {
        const currentMeals = currentLog.meals || {};
        const catItems = currentMeals[category] || [];
        const updated = {
            ...currentLog,
            meals: {
                ...currentMeals,
                [category]: catItems.filter((i) => i.id !== foodId)
            }
        };
        onSaveNutritionLog(activeDate, updated);
    };

    // Handle scanned food from camera
    const handleAddScannedFood = (category: MealCategory, item: any) => {
        const currentMeals = currentLog.meals || {};
        const catItems = currentMeals[category] || [];
        const updated = {
            ...currentLog,
            meals: {
                ...currentMeals,
                [category]: [...catItems, item]
            }
        };
        onSaveNutritionLog(activeDate, updated);
    };

    // Form state for adding custom supplement or medication
    const [isAddingSupplement, setIsAddingSupplement] = useState(false);
    const [newSupName, setNewSupName] = useState("");
    const [newSupDosage, setNewSupDosage] = useState("");
    const [newSupTiming, setNewSupTiming] = useState("");

    const handleSaveNewSupplement = () => {
        if (!newSupName.trim()) return;
        const newSup: SupplementDose = {
            name: newSupName.trim(),
            dosage: newSupDosage.trim() || "1 dosis",
            timing: newSupTiming.trim() || "Diario",
            clinicalReason: "Personalizado"
        };
        const updated = [...supplements, newSup];
        if (onUpdateSupplements) {
            onUpdateSupplements(updated);
        }
        setNewSupName("");
        setNewSupDosage("");
        setNewSupTiming("");
        setIsAddingSupplement(false);
    };

    const handleDeleteSupplement = (e: React.MouseEvent, supName: string) => {
        e.stopPropagation();
        if (onUpdateSupplements) {
            const updated = supplements.filter((s) => s.name !== supName);
            onUpdateSupplements(updated);
        }
    };

    // Selector de 7 días centrado dinámicamente en activeDate (Idéntico a Gimnasio, Cero Scroll)
    const weekSelectorDays = useMemo(() => {
        const curr = new Date(activeDate + "T12:00:00");
        const days = [];
        for (let offset = -3; offset <= 3; offset++) {
            const d = new Date(curr);
            d.setDate(d.getDate() + offset);
            const iso = d.toISOString().split("T")[0];
            const dayName = d.toLocaleDateString("es-MX", { weekday: "long" }).toUpperCase();
            const shortDay = d.toLocaleDateString("es-MX", { weekday: "short" }).toUpperCase();
            const dayNum = d.getDate();
            const monthShort = d.toLocaleDateString("es-MX", { month: "short" }).toUpperCase();
            const monthLong = d.toLocaleDateString("es-MX", { month: "long" });
            const isCenter = offset === 0;
            const isToday = iso === todayStr;
            const hasMeals = !!allNutritionLogs[iso];
            days.push({
                iso,
                dayName,
                shortDay,
                dayNum,
                monthShort,
                monthLong,
                isCenter,
                isToday,
                hasMeals,
                firstLetter: dayName.charAt(0)
            });
        }
        return days;
    }, [activeDate, todayStr, allNutritionLogs]);

    const caloriePct = targetCalories > 0 ? Math.min(100, Math.round((nutritionTotals.totalCalories / targetCalories) * 100)) : 0;

    return (
        <div className="space-y-4">

            {/* Toast de Acción de Dieta */}
            <AnimatePresence>
                {dietActionToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-500 text-black font-mono font-bold text-xs shadow-xl flex items-center gap-2 pointer-events-none"
                    >
                        <span>{dietActionToast}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========================================================================= */}
            {/* SECCIÓN SUPERIOR: PLAN NUTRICIONAL SEMANAL GEMINI IA & LISTA DE COMPRAS   */}
            {/* ========================================================================= */}
            <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-2xl border transition-all ${
                isLight
                    ? "bg-gradient-to-b from-white via-white/95 to-slate-50/90 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]"
                    : "bg-gradient-to-b from-zinc-900/90 via-zinc-950/85 to-black/90 border-white/10 text-white shadow-2xl"
            }`}>
                {/* Cabecera del Plan Semanal */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-inherit/20 mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5">
                                <h3 className={`text-xs sm:text-sm font-bold tracking-tight uppercase leading-snug ${
                                    isLight ? "text-slate-950" : "text-white"
                                }`}>
                                    {dietPlan?.dietaryTitle || "Plan Nutricional Clínico (7 Días)"}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono text-[9px] font-bold shrink-0">
                                    {isDietLoading ? "Calculando..." : dietPlan ? "Gemini IA" : "Sin Generar"}
                                </span>
                            </div>
                            {dietPlan ? (
                                <div className={`text-[10px] sm:text-[11px] font-mono flex items-center gap-1 sm:gap-1.5 flex-wrap ${
                                    isLight ? "text-slate-600" : "text-zinc-400"
                                }`}>
                                    <span className="font-bold text-emerald-400">
                                        {dietPlan.caloriesTarget || targetCalories} kcal
                                    </span>
                                    <span>•</span>
                                    <span>{dietPlan.macros?.protein || targetProteinG}g P</span>
                                    <span>•</span>
                                    <span>{dietPlan.macros?.carbs || targetCarbsG}g C</span>
                                    <span>•</span>
                                    <span>{dietPlan.macros?.fats || targetFatsG}g G</span>
                                </div>
                            ) : (
                                <p className={`text-[10px] sm:text-[11px] font-mono ${
                                    isLight ? "text-slate-500" : "text-zinc-400"
                                }`}>
                                    Genera tu menú adaptativo de 7 días y lista de supermercado
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {onOpenDietPlanModal && (
                            <button
                                type="button"
                                onClick={onOpenDietPlanModal}
                                disabled={isDietLoading}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border ${
                                    isLight
                                        ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800"
                                        : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300"
                                }`}
                                title="Personalizar o regenerar dieta con IA"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">{dietPlan ? "Regenerar" : "Generar con IA"}</span>
                            </button>
                        )}
                        {/* Botón Agregar a Calendario Personal (Gmail / Outlook) */}
                        <button
                            type="button"
                            onClick={() => setIsCalendarSyncOpen(true)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border ${
                                isLight
                                    ? "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
                                    : "bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/30 text-blue-300"
                            }`}
                            title="Agregar menú y comidas a tu calendario personal Gmail u Outlook"
                        >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Calendario</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsDietCardCollapsed(!isDietCardCollapsed)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                                isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                            }`}
                            title={isDietCardCollapsed ? "Expandir plan semanal" : "Contraer"}
                        >
                            {isDietCardCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Estado Cargando con Gemini */}
                {isDietLoading ? (
                    <div className="py-8 text-center space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                        <div className="space-y-1">
                            <p className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                Generando Plan Nutricional de 7 Días con Gemini...
                            </p>
                            <p className={`text-[11px] font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                Calculando ingredientes en gramos y lista consolidada de supermercado.
                            </p>
                        </div>
                    </div>
                ) : !dietPlan ? (
                    /* Estado Sin Plan Generado */
                    <div className={`p-4 rounded-2xl border text-center space-y-3 ${
                        isLight ? "bg-slate-50/70 border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
                    }`}>
                        <div className="max-w-md mx-auto space-y-1">
                            <p className={`text-xs font-semibold ${isLight ? "text-slate-800" : "text-zinc-200"}`}>
                                Aún no has generado tu plan semanal con Gemini IA
                            </p>
                            <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                Diseña un menú de 7 días adaptado a tu meta calórica ({targetCalories} kcal) con ingredientes exactos en gramos y una lista consolidada para ir al supermercado.
                            </p>
                        </div>
                        {onOpenDietPlanModal && (
                            <button
                                type="button"
                                onClick={onOpenDietPlanModal}
                                className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs inline-flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Generar Plan Semanal con Gemini IA</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* Plan Generado Visible */
                    <div className={`space-y-3 ${isDietCardCollapsed ? "hidden" : "block"}`}>
                        {/* Selector de Sub-pestañas: Menú Semanal vs Lista de Compras */}
                        <div className={`grid grid-cols-2 p-1 rounded-2xl border max-w-xs mx-auto ${
                            isLight ? "bg-slate-100 border-slate-200" : "bg-black/50 border-white/10"
                        }`}>
                            <button
                                type="button"
                                onClick={() => setActiveDietSubTab("menu")}
                                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    activeDietSubTab === "menu"
                                        ? (isLight ? "bg-white text-emerald-700 shadow-xs" : "bg-white text-black shadow-md")
                                        : (isLight ? "text-slate-500 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                                }`}
                            >
                                <Utensils className="w-3.5 h-3.5" />
                                <span>Menú (7 Días)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveDietSubTab("groceries")}
                                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    activeDietSubTab === "groceries"
                                        ? (isLight ? "bg-white text-emerald-700 shadow-xs" : "bg-white text-black shadow-md")
                                        : (isLight ? "text-slate-500 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                                }`}
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Lista de Compras</span>
                            </button>
                        </div>

                        {/* SUB-PESTAÑA 1: MENÚ SEMANAL DE 7 DÍAS */}
                        {activeDietSubTab === "menu" && (
                            <div className="space-y-3">
                                {/* Selector de los 7 Días de la Dieta (LUN a DOM) */}
                                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
                                    {[
                                        { dayIdx: 0, label: "LUN", num: 1 },
                                        { dayIdx: 1, label: "MAR", num: 2 },
                                        { dayIdx: 2, label: "MIÉ", num: 3 },
                                        { dayIdx: 3, label: "JUE", num: 4 },
                                        { dayIdx: 4, label: "VIE", num: 5 },
                                        { dayIdx: 5, label: "SÁB", num: 6 },
                                        { dayIdx: 6, label: "DOM", num: 7 }
                                    ].map((d) => {
                                        const isSelected = selectedDietDayIndex === d.dayIdx;
                                        return (
                                            <button
                                                key={`diet_day_${d.dayIdx}`}
                                                type="button"
                                                onClick={() => setSelectedDietDayIndex(d.dayIdx)}
                                                className={`flex-1 py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer border min-w-[42px] ${
                                                    isSelected
                                                        ? (isLight
                                                            ? "bg-emerald-500 text-black border-emerald-600 font-bold shadow-xs"
                                                            : "bg-emerald-500 text-black border-emerald-400 font-bold shadow-md shadow-emerald-500/20")
                                                        : (isLight
                                                            ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                                                            : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-400 hover:text-white")
                                                }`}
                                            >
                                                <div className="text-[10px] uppercase font-mono leading-tight">{d.label}</div>
                                                <div className="text-xs font-bold leading-tight">Día {d.num}</div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Barra de Acción Rápida: Agregar Día a Calendario Personal (Gmail / Outlook) */}
                                <div className={`flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-2xl border transition-all ${
                                    isLight ? "bg-slate-50 border-slate-200/90" : "bg-white/[0.03] border-white/5"
                                }`}>
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono min-w-0">
                                        <CalendarIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                        <span className={`whitespace-nowrap ${isLight ? "text-slate-600" : "text-zinc-300"}`}>
                                            Sincronizar comidas
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsCalendarSyncOpen(true)}
                                        className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
                                    >
                                        <CalendarPlus className="w-3 h-3" />
                                        <span>Gmail / Outlook</span>
                                    </button>
                                </div>

                                {/* Lista de Comidas del Día Seleccionado */}
                                {(() => {
                                    const dayMeals = (dietPlan.thirtyDayPlan?.[selectedDietDayIndex]?.meals)
                                        || (dietPlan.weeklyTemplates?.[0]?.meals)
                                        || [];

                                    if (dayMeals.length === 0) {
                                        return (
                                            <div className={`p-4 text-center rounded-xl border text-xs ${
                                                isLight ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-white/[0.02] border-white/5 text-zinc-500"
                                            }`}>
                                                No hay comidas detalladas para este día en el plan.
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-2.5">
                                            {dayMeals.map((meal: any, mIdx: number) => {
                                                const mealName = meal.mealName || meal.name || `Comida ${mIdx + 1}`;
                                                const timing = meal.timing || "";
                                                const calories = meal.calories || Math.round(((meal.macros?.proteinG || 0) * 4) + ((meal.macros?.carbsG || 0) * 4) + ((meal.macros?.fatsG || 0) * 9)) || 0;
                                                const proteinG = meal.proteinG || meal.macros?.proteinG || 0;
                                                const carbsG = meal.carbsG || meal.macros?.carbsG || 0;
                                                const fatsG = meal.fatsG || meal.macros?.fatsG || 0;
                                                const ings = Array.isArray(meal.ingredients) ? meal.ingredients : [];

                                                // Inferencia de categoría y estado de registro
                                                const nameLower = (meal.mealName || meal.name || "").toLowerCase();
                                                let inferredCatKey: MealCategory = "lunch";
                                                if (/desayuno|comida 1/.test(nameLower) || mIdx === 0) inferredCatKey = "breakfast";
                                                else if (/colación 1|snack 1|media mañana|pre-entreno/.test(nameLower) || mIdx === 1) inferredCatKey = "snack1";
                                                else if (/almuerzo|comida 2/.test(nameLower) || mIdx === 2) inferredCatKey = "lunch";
                                                else if (/merienda|snack 2|colación 2|media tarde|recuperación/.test(nameLower) || mIdx === 3) inferredCatKey = "snack2";
                                                else if (/cena|comida 4|comida 3/.test(nameLower)) inferredCatKey = "dinner";

                                                const catLabels: Record<MealCategory, string> = {
                                                    breakfast: "Desayuno",
                                                    snack1: "Colación 1",
                                                    lunch: "Comida",
                                                    snack2: "Colación 2",
                                                    dinner: "Cena"
                                                };

                                                const mealKey = `${activeDate}_d${selectedDietDayIndex}_m${mIdx}`;
                                                const isRegistered = Boolean(
                                                    registeredDietMeals[mealKey] ||
                                                    (currentLog.meals[inferredCatKey] || []).some(
                                                        (it) => it.id === registeredDietMeals[mealKey]?.foodId || it.id.includes(`gemini_${mealKey}`)
                                                    )
                                                );

                                                return (
                                                    <div
                                                        key={`diet_meal_${selectedDietDayIndex}_${mIdx}`}
                                                        className={`p-3 rounded-2xl border transition-all ${
                                                            isLight
                                                                ? "bg-slate-50/90 border-slate-200/90 hover:border-slate-300"
                                                                : "bg-white/[0.03] border-white/[0.06] hover:border-white/10"
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div>
                                                                <h4 className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                                                    {mealName}
                                                                </h4>
                                                                {timing && (
                                                                    <span className={`text-[10px] font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                                        ⏰ {timing}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Badges de Macros Simétricos y Armónicos */}
                                                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                                {/* Calorías Principal */}
                                                                <span className="text-[10px] sm:text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold shadow-xs shrink-0">
                                                                    {calories} kcal
                                                                </span>

                                                                {/* Cápsula Unificada de Macros: P • C • G simétrica */}
                                                                <div className={`flex items-center divide-x text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                                                                    isLight
                                                                        ? "bg-slate-100 border-slate-200/90 divide-slate-300 text-slate-700"
                                                                        : "bg-white/[0.06] border-white/10 divide-white/10 text-zinc-300"
                                                                }`}>
                                                                    <span className="pr-1.5 font-bold text-emerald-400">{proteinG}g P</span>
                                                                    <span className="px-1.5 font-medium">{carbsG}g C</span>
                                                                    <span className="pl-1.5 font-medium">{fatsG}g G</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Ingredientes con Gramos y Medidas Caseras Estimadas */}
                                                        {ings.length > 0 ? (
                                                            <div className={`space-y-1.5 mb-2.5 p-2 sm:p-2.5 rounded-xl text-[11px] font-mono ${
                                                                isLight ? "bg-white/80 border border-slate-200/80 text-slate-700" : "bg-black/30 border border-white/5 text-zinc-300"
                                                            }`}>
                                                                {ings.map((ing: any, iIdx: number) => {
                                                                    const itemText = typeof ing === "string" ? ing : ing.item || ing.name || "";
                                                                    const grams = typeof ing === "object" && ing.grams ? ing.grams : null;
                                                                    const householdEstimate = getHouseholdPortionEstimate(itemText, grams);

                                                                    return (
                                                                        <div key={`ing_${iIdx}`} className="flex items-center justify-between gap-2">
                                                                            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                                                                                <span className="truncate">• {itemText}</span>
                                                                                {householdEstimate && (
                                                                                    <span className={`text-[10px] font-sans px-1.5 py-0.2 rounded-md ${
                                                                                        isLight
                                                                                            ? "bg-slate-100 text-slate-500 border border-slate-200/60"
                                                                                            : "bg-white/5 text-zinc-400 border border-white/10"
                                                                                    }`}>
                                                                                        ({householdEstimate})
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {grams && (
                                                                                <span className="font-bold shrink-0 text-emerald-500 font-mono">
                                                                                    {grams}g
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : meal.items ? (
                                                            <p className={`text-[11px] font-mono mb-2.5 ${isLight ? "text-slate-600" : "text-zinc-400"}`}>
                                                                {meal.items}
                                                            </p>
                                                        ) : null}

                                                        {/* Botón: Cargar a mi Registro con Feedback de Estado y Deshacer */}
                                                        {isRegistered ? (
                                                            <div className={`w-full py-1.5 px-3 rounded-xl text-xs flex items-center justify-between gap-2 border transition-all ${
                                                                isLight
                                                                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                                                    : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                                                            }`}>
                                                                <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                                                                    <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400 shrink-0" />
                                                                    <span>Registrado en {catLabels[inferredCatKey]}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleUndoDietMealLog(mealKey, inferredCatKey);
                                                                    }}
                                                                    className={`text-[10px] font-mono underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1 ${
                                                                        isLight ? "text-slate-500 hover:text-rose-600" : "text-zinc-400 hover:text-rose-400"
                                                                    }`}
                                                                    title="Deshacer registro para no duplicar"
                                                                >
                                                                    <Undo2 className="w-3 h-3" />
                                                                    <span>Deshacer</span>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleLoadDietMealToLog(meal, mIdx)}
                                                                className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer border ${
                                                                    isLight
                                                                        ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                                                                        : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
                                                                }`}
                                                                title="Agregar los alimentos y macros de esta comida a tu registro diario"
                                                            >
                                                                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                                                                <span>Cargar a mi Registro del Día</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* SUB-PESTAÑA 2: LISTA DE COMPRAS CONSOLIDADA (7 DÍAS) */}
                        {activeDietSubTab === "groceries" && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2 pb-1 border-b border-inherit/15">
                                    <span className={`text-[11px] font-mono uppercase tracking-wider ${
                                        isLight ? "text-slate-600" : "text-zinc-400"
                                    }`}>
                                        Supermercado Semanal Completo
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCopyShoppingList}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
                                                isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                                            }`}
                                            title="Copiar lista de compras para WhatsApp o notas"
                                        >
                                            <Copy className="w-3 h-3" />
                                            <span>Copiar</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearShoppingChecked}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
                                                isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
                                            }`}
                                            title="Desmarcar todos los ítems"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            <span>Reiniciar</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    {Object.entries(consolidatedGroceries).map(([categoryName, items]) => {
                                        if (items.length === 0) return null;
                                        const catEmoji = categoryName === "Proteínas" ? "🍗"
                                            : categoryName === "Carbohidratos" ? "🍚"
                                            : categoryName === "Grasas Saludables" ? "🥑"
                                            : categoryName === "Vegetales y Frutas" ? "🥦"
                                            : "🧂";

                                        return (
                                            <div
                                                key={`grocery_cat_${categoryName}`}
                                                className={`p-3 rounded-2xl border transition-all ${
                                                    isLight ? "bg-slate-50/90 border-slate-200/90" : "bg-white/[0.02] border-white/[0.05]"
                                                }`}
                                            >
                                                <div className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                                                    isLight ? "text-slate-900" : "text-white"
                                                }`}>
                                                    <span>{catEmoji}</span>
                                                    <span>{categoryName}</span>
                                                    <span className={`text-[10px] font-mono font-normal ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                                                        ({items.length})
                                                    </span>
                                                </div>

                                                <div className="space-y-1.5">
                                                    {items.map((it, idx) => {
                                                        const isChecked = !!shoppingChecked[it.key];
                                                        return (
                                                            <div
                                                                key={`grocery_${it.key}_${idx}`}
                                                                onClick={() => handleToggleShoppingItem(it.key)}
                                                                className={`p-2 rounded-xl text-xs flex items-center justify-between gap-2.5 cursor-pointer select-none transition-all ${
                                                                    isChecked
                                                                        ? (isLight ? "bg-slate-200/60 text-slate-400 line-through" : "bg-white/[0.02] text-zinc-600 line-through")
                                                                        : (isLight ? "bg-white hover:bg-slate-100/80 text-slate-800" : "bg-black/30 hover:bg-white/[0.04] text-zinc-200")
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                                                                        isChecked
                                                                            ? "bg-emerald-500 border-emerald-500 text-black font-bold"
                                                                            : (isLight ? "border-slate-300 bg-white" : "border-white/20 bg-black/40")
                                                                    }`}>
                                                                        {isChecked && <Check className="w-3 h-3 text-black stroke-[3]" />}
                                                                    </span>
                                                                    <span className="truncate">{it.item}</span>
                                                                </div>
                                                                {it.totalAmount && (
                                                                    <span className={`font-mono text-[11px] font-bold shrink-0 ${
                                                                        isChecked
                                                                            ? (isLight ? "text-slate-400" : "text-zinc-600")
                                                                            : "text-emerald-500"
                                                                    }`}>
                                                                        {it.totalAmount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 1. Header con Botón de Dieta Gemini AI & Plan Semanal */}
            <div className="flex items-center justify-between gap-3 px-1">
                <div>
                    <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${
                        isLight ? "text-slate-950" : "text-white"
                    }`}>
                        Nutrición & Calendario
                    </h2>
                    <p className={`text-xs capitalize ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                    }`}>
                        {formatFriendlyDate(activeDate)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botón Sincronizar Calendario Personal (Gmail / Outlook) */}
                    <button
                        type="button"
                        onClick={() => setIsCalendarSyncOpen(true)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs border ${
                            isLight
                                ? "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                                : "bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/35 text-blue-400"
                        }`}
                        title="Agregar a mi calendario personal Gmail u Outlook"
                        aria-label="Agregar a Calendario"
                    >
                        <CalendarPlus className="w-4 h-4" />
                    </button>

                    {/* Botón Dieta Gemini AI (Solo Icono) */}
                    {onOpenDietPlanModal && (
                        <button
                            type="button"
                            onClick={onOpenDietPlanModal}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs border ${
                                isLight
                                    ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700"
                                    : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-400"
                            }`}
                            title="Personalizar o generar dieta con IA"
                            aria-label="Dieta con IA"
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                    )}

                    {/* Botón Aislado de Plan Semanal & Lista de Compras (Solo Icono: Cuadrito con Líneas) */}
                    <button
                        type="button"
                        onClick={() => setIsWeeklyPlanDrawerOpen(true)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs border ${
                            isLight
                                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900"
                                : "bg-white/10 hover:bg-white/20 border-white/15 text-zinc-300 hover:text-white"
                        }`}
                        title="Ver plan semanal y lista de compras consolidada"
                        aria-label="Plan Semanal y Lista de Compras"
                    >
                        <ClipboardList className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 2. Selector de Días de la Semana: Ancla Central Dinámica (Idéntico a Gimnasio, Cero Scroll) */}
            <div className={`backdrop-blur-2xl rounded-2xl p-2 sm:p-2.5 shadow-md border transition-all ${
                isLight ? "bg-white/80 border-slate-200/80 shadow-slate-900/[0.04]" : "bg-zinc-950/75 border-white/10 shadow-lg"
            }`}>
                <div className="w-full flex items-center justify-between sm:justify-center sm:gap-2 px-0.5">
                    {weekSelectorDays.map((d) => {
                        if (d.isCenter) {
                            return (
                                <motion.div
                                    key={`center-${d.iso}`}
                                    layout
                                    className={`px-3.5 sm:px-5 py-1.5 rounded-2xl font-sans transition-all flex flex-col items-center justify-center shrink-0 select-none shadow-md ${
                                        isLight
                                            ? "bg-slate-900 text-white shadow-slate-900/20"
                                            : "bg-white text-zinc-950 shadow-white/10"
                                    }`}
                                >
                                    <span className="font-bold text-xs sm:text-sm uppercase tracking-tight whitespace-nowrap leading-tight">
                                        {d.dayName}
                                    </span>
                                    <span className={`text-[10px] font-mono font-medium tracking-tight mt-0.5 leading-tight ${
                                        isLight ? "text-slate-300" : "text-zinc-600"
                                    }`}>
                                        <span className="hidden xs:inline">{d.dayNum} de {d.monthLong}</span>
                                        <span className="xs:hidden">{d.dayNum} {d.monthShort}</span>
                                    </span>
                                </motion.div>
                            );
                        }

                        return (
                            <button
                                key={`dot-${d.iso}`}
                                type="button"
                                onClick={() => onSelectDate(d.iso)}
                                title={`Ver ${d.dayName} (${d.dayNum} ${d.monthShort})`}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-90 relative ${
                                    isLight
                                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950 border border-slate-200/90 shadow-xs"
                                        : "bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.14] border border-white/10"
                                }`}
                            >
                                <span>{d.firstLetter}</span>
                                {d.isToday && (
                                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Tarjeta Fusa: Segmented Switcher entre Resumen Nutricional y Resumen de Entrenamiento */}
            <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-2xl border transition-colors ${
                isLight ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]" : "bg-zinc-950/75 border-white/10 text-white shadow-2xl"
            }`}>
                {/* Switcher Segmentado (Solo Iconos) */}
                <div className={`grid grid-cols-2 p-1 rounded-2xl mb-4 border max-w-[180px] mx-auto ${
                    isLight ? "bg-slate-100 border-slate-200" : "bg-black/50 border-white/10"
                }`}>
                    <button
                        type="button"
                        onClick={() => setViewMode("nutrition")}
                        title={`Nutrición (${nutritionTotals.totalCalories} kcal)`}
                        aria-label="Nutrición"
                        className={`py-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                            viewMode === "nutrition"
                                ? (isLight ? "bg-white text-emerald-600 shadow-sm" : "bg-white text-black shadow-md")
                                : (isLight ? "text-slate-500 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        <Utensils className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("workout")}
                        title={`Entrenamiento (${workoutSummary.totalSets} series)`}
                        aria-label="Entrenamiento"
                        className={`py-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                            viewMode === "workout"
                                ? (isLight ? "bg-white text-emerald-600 shadow-sm" : "bg-white text-black shadow-md")
                                : (isLight ? "text-slate-500 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                        }`}
                    >
                        <Dumbbell className="w-4 h-4" />
                    </button>
                </div>

                {/* Contenido Dinámico: Tab Nutrición */}
                {viewMode === "nutrition" && (
                    <div className="space-y-4">
                        {/* Macro Bars Compactos (Contador de Calorías) */}
                        <div className="grid grid-cols-3 gap-2 text-center font-mono">
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className={`text-[10px] uppercase block font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Calorías</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {nutritionTotals.totalCalories} / {targetCalories}
                                </span>
                            </div>
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className="text-[10px] text-emerald-500 uppercase block font-sans font-bold">Proteína</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {nutritionTotals.totalProtein}g / {targetProteinG}g
                                </span>
                            </div>
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className={`text-[10px] uppercase block font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Progreso</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {caloriePct}%
                                </span>
                            </div>
                        </div>

                        {/* Botón Principal: Identificar Comida con IA (Escanear) */}
                        <button
                            type="button"
                            onClick={() => {
                                setScannerCategory("lunch");
                                setIsFoodScannerOpen(true);
                            }}
                            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                            <Camera className="w-4 h-4" />
                            <span>Identificar Comida con IA (Escanear)</span>
                        </button>

                        {/* Suplementos (Lista Vertical Debajo de Escanear Comida) */}
                        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                            isLight
                                ? "bg-slate-50/90 border-slate-200/90 shadow-xs"
                                : "bg-white/[0.03] border-white/[0.08]"
                        }`}>
                            <div className={`flex items-center justify-between pb-2.5 mb-2.5 border-b ${
                                isLight ? "border-slate-200" : "border-white/[0.06]"
                            }`}>
                                <div className="flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-emerald-500" />
                                    <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                                        isLight ? "text-slate-900" : "text-white"
                                    }`}>
                                        Suplementos
                                    </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                        isLight
                                            ? "bg-slate-100 border-slate-200 text-slate-600"
                                            : "bg-white/[0.06] border-white/10 text-zinc-300"
                                    }`}>
                                        <strong className={isLight ? "text-slate-900 font-bold" : "text-white"}>{supplementsTakenCount}</strong> / {supplementsCount} Tomados
                                    </span>
                                    {onUpdateSupplements && (
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingSupplement(!isAddingSupplement)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer border ${
                                                isAddingSupplement
                                                    ? (isLight ? "bg-slate-200 text-slate-800 border-slate-300" : "bg-white/20 text-white border-white/30")
                                                    : (isLight ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30")
                                            }`}
                                            title="Añadir nuevo suplemento"
                                        >
                                            {isAddingSupplement ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                            <span>{isAddingSupplement ? "Cerrar" : "Agregar"}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Formulario Inline para Añadir Suplemento */}
                            {isAddingSupplement && (
                                <div className={`mb-3 p-3 rounded-xl border transition-all ${
                                    isLight ? "bg-white border-slate-300/80 shadow-xs" : "bg-black/40 border-white/10"
                                }`}>
                                    <p className={`text-[11px] font-semibold mb-2 ${isLight ? "text-slate-700" : "text-zinc-300"}`}>
                                        Registrar Suplemento:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nombre (ej. Creatina, Omega 3, Proteína)"
                                            value={newSupName}
                                            onChange={(e) => setNewSupName(e.target.value)}
                                            className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                                                isLight
                                                    ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                                                    : "bg-black/60 border-white/15 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                                            }`}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Dosis (ej. 5g, 500mg, 1 cap)"
                                            value={newSupDosage}
                                            onChange={(e) => setNewSupDosage(e.target.value)}
                                            className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                                                isLight
                                                    ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                                                    : "bg-black/60 border-white/15 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                                            }`}
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Horario (ej. Mañana, Pre-entreno)"
                                                value={newSupTiming}
                                                onChange={(e) => setNewSupTiming(e.target.value)}
                                                className={`flex-1 px-2.5 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                                                    isLight
                                                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                                                        : "bg-black/60 border-white/15 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSaveNewSupplement}
                                                disabled={!newSupName.trim()}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                                    newSupName.trim()
                                                        ? "bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 shadow-sm"
                                                        : "opacity-40 bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                                }`}
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Lista Vertical de Suplementos */}
                            {supplements.length === 0 ? (
                                <div className={`p-3.5 text-center rounded-xl border text-xs ${
                                    isLight ? "bg-white border-slate-200 text-slate-500" : "bg-black/20 border-white/5 text-zinc-500"
                                }`}>
                                    No hay suplementos registrados. Toca <strong>Agregar</strong> para registrar uno.
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {supplements.map((sup, idx) => {
                                        const isTaken = !!currentLog.supplementsTaken?.[sup.name];

                                        return (
                                            <div
                                                key={`${sup.name}_${idx}`}
                                                onClick={() => handleToggleSupplement(sup.name)}
                                                className={`w-full p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] select-none ${
                                                    isTaken
                                                        ? (isLight
                                                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs"
                                                            : "bg-emerald-500/10 border-emerald-500/30 text-white")
                                                        : (isLight
                                                            ? "bg-white hover:bg-slate-100/80 border-slate-200/90 text-slate-800"
                                                            : "bg-black/30 hover:bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white")
                                                }`}
                                            >
                                                {/* Checkbox y Datos */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                                        isTaken
                                                            ? "bg-emerald-500 text-black shadow-xs shadow-emerald-500/30"
                                                            : (isLight ? "border-2 border-slate-300 bg-white" : "border-2 border-zinc-600 bg-black/40")
                                                    }`}>
                                                        {isTaken ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`text-xs sm:text-sm font-semibold truncate ${
                                                            isTaken
                                                                ? (isLight ? "text-emerald-950 line-through decoration-emerald-600/40" : "text-zinc-200 line-through decoration-emerald-400/40")
                                                                : (isLight ? "text-slate-900" : "text-white")
                                                        }`}>
                                                            {sup.name}
                                                        </div>
                                                        <div className={`text-[10px] sm:text-[11px] font-mono flex items-center gap-1.5 ${
                                                            isLight ? "text-slate-500" : "text-zinc-400"
                                                        }`}>
                                                            <span>{sup.dosage}</span>
                                                            {sup.timing && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="capitalize">{sup.timing}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Estado Badge y Acción Eliminar */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md ${
                                                        isTaken
                                                            ? (isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/20 text-emerald-300")
                                                            : (isLight ? "bg-slate-100 text-slate-500" : "bg-white/5 text-zinc-500")
                                                    }`}>
                                                        {isTaken ? "Tomado" : "Pendiente"}
                                                    </span>

                                                    {onUpdateSupplements && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDeleteSupplement(e, sup.name)}
                                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                isLight ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                                                            }`}
                                                            title={`Eliminar ${sup.name}`}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Desglose en 5 Tiempos */}
                        <div className="space-y-2.5 pt-1">
                            {MEAL_CATEGORIES.map((cat) => {
                                const items = currentLog.meals[cat.key] || [];
                                const cals = items.reduce((acc, i) => acc + (Number(i.calories) || 0), 0);
                                const isAdding = activeAddingCategory === cat.key;

                                return (
                                    <div
                                        key={cat.key}
                                        className={`p-3 rounded-2xl border transition-all ${
                                            isLight
                                                ? "bg-slate-50/80 border-slate-200/90 hover:bg-slate-100/80"
                                                : "bg-white/[0.03] border-white/[0.06] hover:border-white/10"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span>{cat.iconEmoji}</span>
                                                <span className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{cat.title}</span>
                                                <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                                                    ({items.length} {items.length === 1 ? "ítem" : "ítems"})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-mono font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{cals} kcal</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveAddingCategory(isAdding ? null : cat.key)}
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                                                        isLight
                                                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-950"
                                                            : "bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white"
                                                    }`}
                                                    title="Añadir alimento manual"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lista de Alimentos en este tiempo */}
                                        {items.length > 0 && (
                                            <div className={`space-y-1 mt-2 pt-2 border-t ${
                                                isLight ? "border-slate-200" : "border-white/[0.04]"
                                            }`}>
                                                {items.map((item) => (
                                                    <div key={item.id} className={`flex items-center justify-between text-xs py-1 ${
                                                        isLight ? "text-slate-800" : "text-zinc-300"
                                                    }`}>
                                                        <span className="truncate pr-2">{item.name}</span>
                                                        <div className="flex items-center gap-2 shrink-0 font-mono">
                                                            <span className={isLight ? "text-slate-500" : "text-zinc-400"}>{item.calories} kcal</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveFood(cat.key, item.id)}
                                                                className={`cursor-pointer transition-colors ${
                                                                    isLight ? "text-slate-400 hover:text-red-600" : "text-zinc-500 hover:text-[#FF2A2A]"
                                                                }`}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Formulario rápido para añadir manual */}
                                        {isAdding && (
                                            <div className={`mt-2.5 pt-2.5 border-t space-y-2 ${
                                                isLight ? "border-slate-200" : "border-white/[0.06]"
                                            }`}>
                                                <input
                                                    type="text"
                                                    value={newFoodName}
                                                    onChange={(e) => setNewFoodName(e.target.value)}
                                                    placeholder="Nombre del alimento (ej. 150g pechuga)"
                                                    className={`w-full h-8 rounded-xl px-2.5 text-xs focus:outline-none border ${
                                                        isLight
                                                            ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500"
                                                            : "bg-black/60 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                                                    }`}
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="number"
                                                        value={newFoodCals}
                                                        onChange={(e) => setNewFoodCals(e.target.value)}
                                                        placeholder="Calorías (kcal)"
                                                        className={`h-8 rounded-xl px-2.5 text-xs font-mono focus:outline-none border ${
                                                            isLight
                                                                ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500"
                                                                : "bg-black/60 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                                                        }`}
                                                    />
                                                    <input
                                                        type="number"
                                                        value={newFoodProtein}
                                                        onChange={(e) => setNewFoodProtein(e.target.value)}
                                                        placeholder="Proteína (g)"
                                                        className={`h-8 rounded-xl px-2.5 text-xs font-mono focus:outline-none border ${
                                                            isLight
                                                                ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500"
                                                                : "bg-black/60 border-white/10 text-white placeholder-zinc-500 focus:border-white/30"
                                                        }`}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveAddingCategory(null)}
                                                        className={`px-2.5 py-1 text-[11px] cursor-pointer ${
                                                            isLight ? "text-slate-500 hover:text-slate-900" : "text-zinc-400 hover:text-white"
                                                        }`}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddManualFood(cat.key)}
                                                        className={`px-3 py-1 font-semibold text-xs rounded-xl cursor-pointer ${
                                                            isLight ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-black"
                                                        }`}
                                                    >
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Contenido Dinámico: Tab Entrenamiento */}
                {viewMode === "workout" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center font-mono">
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className={`text-[10px] uppercase block font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Series</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {workoutSummary.totalSets}
                                </span>
                            </div>
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className="text-[10px] text-emerald-500 uppercase block font-sans font-bold">Tonelaje</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {Math.round(workoutSummary.totalVolumeKg)} kg
                                </span>
                            </div>
                            <div className={`p-2.5 rounded-2xl border ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                            }`}>
                                <span className={`text-[10px] uppercase block font-sans ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Ejercicios</span>
                                <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                                    {workoutSummary.uniqueExercises}
                                </span>
                            </div>
                        </div>

                        {dayExerciseLogs.length > 0 ? (
                            <div className="space-y-2">
                                <span className={`text-[11px] font-mono uppercase block ${
                                    isLight ? "text-slate-500" : "text-zinc-400"
                                }`}>
                                    Desglose de series registradas
                                </span>
                                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                    {dayExerciseLogs.map((log, lIdx) => (
                                        <div
                                            key={lIdx}
                                            className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-mono border ${
                                                isLight
                                                    ? "bg-slate-50 border-slate-200 text-slate-800"
                                                    : "bg-white/[0.03] border-white/[0.06]"
                                            }`}
                                        >
                                            <div className="truncate pr-2">
                                                <span className={`font-sans font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{log.exercise_id}</span>
                                                <span className={`ml-2 ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Serie {log.set_number}</span>
                                            </div>
                                            <span className="text-emerald-500 font-bold shrink-0">
                                                {log.weight_kg}kg × {log.reps_completed} reps
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={`text-center py-8 text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                                <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p>No se registraron series para este día.</p>
                                {onGoToGym && (
                                    <button
                                        type="button"
                                        onClick={onGoToGym}
                                        className={`mt-3 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                            isLight
                                                ? "bg-slate-900 text-white hover:bg-slate-800"
                                                : "bg-white/10 hover:bg-white/20 text-white"
                                        }`}
                                    >
                                        Ir al Entrenamiento Activo →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 5. Aislamiento de Planeación: Drawer Semanal Dedicado con Vaul */}
            <Drawer.Root open={isWeeklyPlanDrawerOpen} onOpenChange={setIsWeeklyPlanDrawerOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity" />
                    <Drawer.Content className={`backdrop-blur-2xl border-t flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 p-5 pb-8 max-w-lg mx-auto shadow-2xl ${
                        isLight
                            ? "bg-white/95 border-slate-200 text-slate-900"
                            : "bg-zinc-950/95 border-white/15 text-white"
                    }`}>
                        <Drawer.Handle className={`mx-auto w-12 h-1.5 rounded-full mb-4 ${
                            isLight ? "bg-slate-300" : "bg-zinc-700"
                        }`} />
                        
                        <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
                            isLight ? "border-slate-200" : "border-white/10"
                        }`}>
                            <div>
                                <h4 className={`text-sm font-bold uppercase tracking-tight flex items-center gap-2 ${
                                    isLight ? "text-slate-950" : "text-white"
                                }`}>
                                    <ClipboardList className="w-4 h-4 text-emerald-500" />
                                    <span>Plan Semanal & Compras</span>
                                </h4>
                                <p className={`text-xs font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Consolidado Clínico de 7 Días</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsWeeklyPlanDrawerOpen(false)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                                    isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-600" : "bg-white/10 text-zinc-400 hover:text-white"
                                }`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                            {/* Gemini AI Action */}
                            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/10"
                            }`}>
                                <div>
                                    <div className={`text-xs font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Plan Nutricional con IA</div>
                                    <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Régimen adaptativo con superávit o déficit controlado</div>
                                </div>
                                {onOpenDietPlanModal && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsWeeklyPlanDrawerOpen(false);
                                            onOpenDietPlanModal();
                                        }}
                                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-full cursor-pointer transition-colors shrink-0"
                                    >
                                        Configurar
                                    </button>
                                )}
                            </div>

                            {/* Lista de Compras Consolidada */}
                            {groceryList && (
                                <div className="space-y-2">
                                    <span className={`text-[11px] font-mono uppercase tracking-wider block ${
                                        isLight ? "text-slate-500" : "text-zinc-400"
                                    }`}>
                                        Lista de Supermercado (7 Días)
                                    </span>
                                    <div className="space-y-1.5">
                                        {Object.entries(groceryList).map(([category, items]: [string, any]) => (
                                            <div key={category} className={`p-3 rounded-xl border ${
                                                isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-white/[0.04]"
                                            }`}>
                                                <div className={`text-xs font-bold capitalize mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>{category}</div>
                                                <div className={`text-[11px] font-mono space-y-0.5 ${isLight ? "text-slate-600" : "text-zinc-400"}`}>
                                                    {Array.isArray(items) && items.map((it: any, i: number) => (
                                                        <div key={i} className="flex justify-between">
                                                            <span>• {typeof it === "string" ? it : it.name}</span>
                                                            <span className={isLight ? "text-slate-400" : "text-zinc-500"}>{it.amount || ""}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

            {/* Modal de Cámara Escáner */}
            <FoodCameraScannerModal
                isOpen={isFoodScannerOpen}
                onClose={() => setIsFoodScannerOpen(false)}
                initialCategory={scannerCategory}
                onAddFoodItem={handleAddScannedFood}
            />

            {/* Modal para Sincronizar Comidas con Calendario Personal (Gmail / Outlook / iCal) */}
            <ApexCalendarSyncModal
                isOpen={isCalendarSyncOpen}
                onClose={() => setIsCalendarSyncOpen(false)}
                dietPlan={dietPlan}
                activeDate={activeDate}
                selectedDayIndex={selectedDietDayIndex}
                targetCalories={targetCalories}
            />
        </div>
    );
};
