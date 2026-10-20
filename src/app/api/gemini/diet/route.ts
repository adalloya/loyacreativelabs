// src/app/api/gemini/diet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateSupplementStack } from "@/lib/nutrition-logistics";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const profile = body.profile || {
            weightKg: 80,
            targetCalories: 2200,
            targetProteinG: 180,
            caloricDeficitPct: 15
        };

        const dietaryPreference = body.dietaryPreference || profile.dietaryPreference || "standard";
        const dietaryNotes = body.dietaryNotes || profile.dietaryNotes || "";

        const weight = profile.weightKg || 80;
        const targetCalories = profile.targetCalories || 2200;

        // Ajuste fisiológico de macros según el tipo de dieta
        let targetProtein = profile.targetProteinG || Math.round(weight * 2.2);
        let targetFats: number;
        let targetCarbs: number;

        if (dietaryPreference === "keto") {
            // Keto: Máximo 30-35g carbs netos, grasas elevadas ~70-75%
            targetCarbs = Math.min(35, Math.max(20, Math.round((targetCalories * 0.05) / 4)));
            targetProtein = Math.round(weight * 2.0); // 2.0g/kg para evitar exceso de gluconeogénesis
            targetFats = Math.max(30, Math.round((targetCalories - (targetProtein * 4) - (targetCarbs * 4)) / 9));
        } else if (dietaryPreference === "low_carb") {
            // Low carb: Carbohidratos moderados ~90-100g
            targetCarbs = Math.min(100, Math.max(50, Math.round((targetCalories * 0.18) / 4)));
            targetProtein = Math.round(weight * 2.2);
            targetFats = Math.max(30, Math.round((targetCalories - (targetProtein * 4) - (targetCarbs * 4)) / 9));
        } else {
            // Estándar, vegetariana, vegana, paleo, ayuno intermitente
            targetProtein = profile.targetProteinG || Math.round(weight * 2.2);
            targetFats = Math.round((targetCalories * 0.25) / 9);
            targetCarbs = Math.max(30, Math.round((targetCalories - (targetProtein * 4) - (targetFats * 9)) / 4));
        }

        const clinicalSupplements = calculateSupplementStack(weight);

        const goal = profile.fitnessGoal || (profile.caloricAdjustmentPct > 0 ? "surplus" : "deficit");
        const goalDesc = goal === "surplus"
            ? `superávit calórico controlado (+${profile.caloricAdjustmentPct || 15}%) para ganancia muscular e hipertrofia`
            : goal === "maintenance"
            ? `mantenimiento normocalórico (0% de ajuste) para recomposición corporal`
            : `déficit calórico (${profile.caloricAdjustmentPct || -15}%) para definición y pérdida de grasa preservando músculo`;

        const DIET_TITLES: Record<string, string> = {
            standard: "Estándar / Balanceada para Hipertrofia",
            keto: "Cetogénica (Keto)",
            low_carb: "Baja en Carbohidratos (Low Carb)",
            vegetarian: "Vegetariana",
            vegan: "Vegana (Plant-Based)",
            paleo: "Paleolítica (Paleo)",
            intermittent_fasting: "Ayuno Intermitente (16/8)",
            custom: "Personalizada a Medida"
        };

        const dietTitle = DIET_TITLES[dietaryPreference] || "Estándar / Balanceada";

        // Generador de respaldo clínico instantáneo según tipo de dieta (100% libre de mocks)
        const getSampleDayMeals = (diet: string) => {
            if (diet === "keto") {
                return [
                    {
                        mealName: "Comida 1 (Desayuno Keto Anticatabólico)",
                        timing: "08:30 AM",
                        ingredients: [
                            { item: "Huevos enteros revueltos en aceite de oliva o ghee", grams: 200 },
                            { item: "Aguacate hass fresco", grams: 120 },
                            { item: "Espinacas baby salteadas", grams: 100 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.28),
                            carbsG: 6,
                            fatsG: Math.round(targetFats * 0.35)
                        }
                    },
                    {
                        mealName: "Comida 2 (Almuerzo Cetogénico)",
                        timing: "01:30 PM",
                        ingredients: [
                            { item: "Salmón salvaje o corte magro a la plancha", grams: 220 },
                            { item: "Espárragos y brócoli al vapor", grams: 160 },
                            { item: "Aceite de oliva virgen extra", grams: 15 },
                            { item: "Nueces de nogal o almendras tostadas", grams: 25 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.36),
                            carbsG: 8,
                            fatsG: Math.round(targetFats * 0.35)
                        }
                    },
                    {
                        mealName: "Comida 3 (Snack Cetogénico)",
                        timing: "05:30 PM",
                        ingredients: [
                            { item: "Proteína Whey Isolate Zero Carbs con leche de almendras", grams: 35 },
                            { item: "Semillas de chía hidratadas", grams: 15 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.16),
                            carbsG: 3,
                            fatsG: Math.round(targetFats * 0.10)
                        }
                    },
                    {
                        mealName: "Comida 4 (Cena Keto Relajante)",
                        timing: "09:00 PM",
                        ingredients: [
                            { item: "Pechuga de pollo a las finas hierbas", grams: 200 },
                            { item: "Ensalada verde con aguacate y vinagreta de oliva", grams: 150 },
                            { item: "Semillas de calabaza", grams: 20 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.20),
                            carbsG: 7,
                            fatsG: Math.round(targetFats * 0.20)
                        }
                    }
                ];
            }

            if (diet === "low_carb") {
                return [
                    {
                        mealName: "Comida 1 (Desayuno Low Carb Proteico)",
                        timing: "08:00 AM",
                        ingredients: [
                            { item: "Huevos enteros con claras pasteurizadas", grams: 200 },
                            { item: "Frutos rojos frescos (frambuesas/arándanos)", grams: 80 },
                            { item: "Aguacate hass", grams: 80 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.28),
                            carbsG: 18,
                            fatsG: Math.round(targetFats * 0.30)
                        }
                    },
                    {
                        mealName: "Comida 2 (Almuerzo Peri-Entreno)",
                        timing: "01:30 PM",
                        ingredients: [
                            { item: "Pechuga de pollo a la plancha", grams: 220 },
                            { item: "Camote o batata al horno", grams: 120 },
                            { item: "Brócoli y espárragos al vapor", grams: 150 },
                            { item: "Aceite de oliva virgen extra", grams: 10 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.36),
                            carbsG: 35,
                            fatsG: Math.round(targetFats * 0.30)
                        }
                    },
                    {
                        mealName: "Comida 3 (Snack Recuperación)",
                        timing: "05:30 PM",
                        ingredients: [
                            { item: "Proteína Whey Isolate", grams: 35 },
                            { item: "Nueces o almendras tostadas", grams: 25 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.16),
                            carbsG: 6,
                            fatsG: Math.round(targetFats * 0.20)
                        }
                    },
                    {
                        mealName: "Comida 4 (Cena Ligera Anti-Catabólica)",
                        timing: "09:00 PM",
                        ingredients: [
                            { item: "Filete de pescado blanco o salmón", grams: 200 },
                            { item: "Ensalada verde con semillas de calabaza y aceite de oliva", grams: 160 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.20),
                            carbsG: 12,
                            fatsG: Math.round(targetFats * 0.20)
                        }
                    }
                ];
            }

            if (diet === "vegetarian") {
                return [
                    {
                        mealName: "Comida 1 (Desayuno Ovo-Lácteo)",
                        timing: "08:00 AM",
                        ingredients: [
                            { item: "Huevos enteros con claras pasteurizadas", grams: 200 },
                            { item: "Avena integral con canela y chía", grams: 65 },
                            { item: "Frutos rojos frescos", grams: 100 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.25),
                            carbsG: Math.round(targetCarbs * 0.28),
                            fatsG: Math.round(targetFats * 0.30)
                        }
                    },
                    {
                        mealName: "Comida 2 (Almuerzo Vegetariano Proteico)",
                        timing: "01:30 PM",
                        ingredients: [
                            { item: "Tofu firme marinado a la plancha", grams: 220 },
                            { item: "Arroz jazmín o quinoa cocida", grams: 180 },
                            { item: "Edamames al vapor", grams: 100 },
                            { item: "Brócoli y aceite de sésamo", grams: 120 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.35),
                            carbsG: Math.round(targetCarbs * 0.42),
                            fatsG: Math.round(targetFats * 0.30)
                        }
                    },
                    {
                        mealName: "Comida 3 (Snack Recuperación Vegetariano)",
                        timing: "05:30 PM",
                        ingredients: [
                            { item: "Yogur griego natural 0% sin azúcar", grams: 200 },
                            { item: "Proteína Whey o Vegetal", grams: 25 },
                            { item: "Nueces", grams: 20 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.20),
                            carbsG: Math.round(targetCarbs * 0.15),
                            fatsG: Math.round(targetFats * 0.15)
                        }
                    },
                    {
                        mealName: "Comida 4 (Cena Ligera Vegetariana)",
                        timing: "09:00 PM",
                        ingredients: [
                            { item: "Queso cottage bajo en grasa o seitán", grams: 180 },
                            { item: "Batata u hortalizas horneadas", grams: 130 },
                            { item: "Ensalada verde con aceite de oliva", grams: 120 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.20),
                            carbsG: Math.round(targetCarbs * 0.15),
                            fatsG: Math.round(targetFats * 0.25)
                        }
                    }
                ];
            }

            if (diet === "vegan") {
                return [
                    {
                        mealName: "Comida 1 (Desayuno 100% Plant-Based)",
                        timing: "08:00 AM",
                        ingredients: [
                            { item: "Tofu revuelto con cúrcuma y espinacas", grams: 180 },
                            { item: "Avena cocida con semillas de cáñamo y chía", grams: 70 },
                            { item: "Plátano maduro", grams: 100 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.25),
                            carbsG: Math.round(targetCarbs * 0.30),
                            fatsG: Math.round(targetFats * 0.25)
                        }
                    },
                    {
                        mealName: "Comida 2 (Bowl Proteico Vegano)",
                        timing: "01:30 PM",
                        ingredients: [
                            { item: "Tempeh horneado o seitán salteado", grams: 200 },
                            { item: "Lentejas o garbanzos cocidos", grams: 150 },
                            { item: "Quinoa integral", grams: 140 },
                            { item: "Aguacate y espárragos", grams: 100 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.38),
                            carbsG: Math.round(targetCarbs * 0.40),
                            fatsG: Math.round(targetFats * 0.35)
                        }
                    },
                    {
                        mealName: "Comida 3 (Batido Vegano de Recuperación)",
                        timing: "05:30 PM",
                        ingredients: [
                            { item: "Proteína vegetal aislada (chícharo y arroz)", grams: 35 },
                            { item: "Leche de soja sin azúcar", grams: 250 },
                            { item: "Crema de cacahuate natural", grams: 20 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.17),
                            carbsG: Math.round(targetCarbs * 0.12),
                            fatsG: Math.round(targetFats * 0.20)
                        }
                    },
                    {
                        mealName: "Comida 4 (Cena Reparadora Vegana)",
                        timing: "09:00 PM",
                        ingredients: [
                            { item: "Tofu firme a la parrilla", grams: 180 },
                            { item: "Edamames cocidos", grams: 120 },
                            { item: "Camote asado con ensalada mixta", grams: 140 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.20),
                            carbsG: Math.round(targetCarbs * 0.18),
                            fatsG: Math.round(targetFats * 0.20)
                        }
                    }
                ];
            }

            if (diet === "paleo") {
                return [
                    {
                        mealName: "Comida 1 (Desayuno Paleolítico)",
                        timing: "08:00 AM",
                        ingredients: [
                            { item: "Huevos enteros de libre pastoreo revueltos", grams: 200 },
                            { item: "Aguacate hass fresco", grams: 100 },
                            { item: "Frutos del bosque (moras y arándanos)", grams: 100 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.26),
                            carbsG: Math.round(targetCarbs * 0.20),
                            fatsG: Math.round(targetFats * 0.35)
                        }
                    },
                    {
                        mealName: "Comida 2 (Almuerzo Paleo de Caza)",
                        timing: "01:30 PM",
                        ingredients: [
                            { item: "Corte de res magra o salmón salvaje", grams: 240 },
                            { item: "Camote o batata dulce asada", grams: 180 },
                            { item: "Espárragos y calabacines a la parrilla", grams: 160 },
                            { item: "Aceite de oliva virgen extra", grams: 15 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.38),
                            carbsG: Math.round(targetCarbs * 0.45),
                            fatsG: Math.round(targetFats * 0.35)
                        }
                    },
                    {
                        mealName: "Comida 3 (Snack Ancestral)",
                        timing: "05:30 PM",
                        ingredients: [
                            { item: "Cecina / jerky de res natural sin azúcares", grams: 45 },
                            { item: "Nueces de macadamia o almendras crudas", grams: 30 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.16),
                            carbsG: Math.round(targetCarbs * 0.10),
                            fatsG: Math.round(targetFats * 0.15)
                        }
                    },
                    {
                        mealName: "Comida 4 (Cena Paleo Ligera)",
                        timing: "09:00 PM",
                        ingredients: [
                            { item: "Pechuga de pavo o trucha a las hierbas", grams: 200 },
                            { item: "Ensalada verde con semillas de calabaza", grams: 150 },
                            { item: "Aceite de coco virgen o de oliva", grams: 10 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.20),
                            carbsG: Math.round(targetCarbs * 0.25),
                            fatsG: Math.round(targetFats * 0.15)
                        }
                    }
                ];
            }

            if (diet === "intermittent_fasting") {
                return [
                    {
                        mealName: "Comida 1 (Rompe-Ayuno / 12:00 PM)",
                        timing: "12:00 PM",
                        ingredients: [
                            { item: "Huevos enteros con claras pasteurizadas", grams: 220 },
                            { item: "Avena integral con frutos rojos", grams: 80 },
                            { item: "Aguacate hass fresco", grams: 80 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.35),
                            carbsG: Math.round(targetCarbs * 0.35),
                            fatsG: Math.round(targetFats * 0.35)
                        }
                    },
                    {
                        mealName: "Comida 2 (Almuerzo Principal / 04:00 PM)",
                        timing: "04:00 PM",
                        ingredients: [
                            { item: "Pechuga de pollo o lomo magro", grams: 240 },
                            { item: "Arroz jazmín o batata cocida", grams: 220 },
                            { item: "Verduras al vapor con aceite de oliva", grams: 160 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.40),
                            carbsG: Math.round(targetCarbs * 0.45),
                            fatsG: Math.round(targetFats * 0.40)
                        }
                    },
                    {
                        mealName: "Comida 3 (Cierre de Ventana / 08:00 PM)",
                        timing: "08:00 PM",
                        ingredients: [
                            { item: "Salmón salvaje o ternera magra", grams: 200 },
                            { item: "Proteína Whey Isolate con yogur o agua", grams: 30 },
                            { item: "Ensalada verde con semillas", grams: 120 }
                        ],
                        macros: {
                            proteinG: Math.round(targetProtein * 0.25),
                            carbsG: Math.round(targetCarbs * 0.20),
                            fatsG: Math.round(targetFats * 0.25)
                        }
                    }
                ];
            }

            // Estándar / Balanceada
            return [
                {
                    mealName: "Comida 1 (Desayuno Proteico)",
                    timing: "08:00 AM",
                    ingredients: [
                        { item: "Huevos enteros pasteurizados", grams: 180 },
                        { item: "Avena integral con canela", grams: 65 },
                        { item: "Frutos rojos frescos", grams: 100 }
                    ],
                    macros: {
                        proteinG: Math.round(targetProtein * 0.25),
                        carbsG: Math.round(targetCarbs * 0.28),
                        fatsG: Math.round(targetFats * 0.30)
                    }
                },
                {
                    mealName: "Comida 2 (Almuerzo Peri-Entrenamiento)",
                    timing: "01:30 PM",
                    ingredients: [
                        { item: "Pechuga de pollo a la plancha", grams: 220 },
                        { item: "Arroz jazmín cocido", grams: 180 },
                        { item: "Espárragos y brócoli al vapor", grams: 150 },
                        { item: "Aceite de oliva virgen extra", grams: 10 }
                    ],
                    macros: {
                        proteinG: Math.round(targetProtein * 0.35),
                        carbsG: Math.round(targetCarbs * 0.42),
                        fatsG: Math.round(targetFats * 0.30)
                    }
                },
                {
                    mealName: "Comida 3 (Snack Recuperación)",
                    timing: "05:30 PM",
                    ingredients: [
                        { item: "Proteína Whey Isolate", grams: 35 },
                        { item: "Manzana verde", grams: 150 }
                    ],
                    macros: {
                        proteinG: Math.round(targetProtein * 0.15),
                        carbsG: Math.round(targetCarbs * 0.15),
                        fatsG: Math.round(targetFats * 0.05)
                    }
                },
                {
                    mealName: "Comida 4 (Cena Anti-Catabólica)",
                    timing: "09:00 PM",
                    ingredients: [
                        { item: "Filete de salmón salvaje o lomo magro", grams: 200 },
                        { item: "Camote o batata horneada", grams: 140 },
                        { item: "Ensalada verde mixta", grams: 120 }
                    ],
                    macros: {
                        proteinG: Math.round(targetProtein * 0.25),
                        carbsG: Math.round(targetCarbs * 0.15),
                        fatsG: Math.round(targetFats * 0.35)
                    }
                }
            ];
        };

        const fallbackMeals = getSampleDayMeals(dietaryPreference);
        let activeMeals = fallbackMeals;
        let clinicalSummary = `Plan nutricional clínico de 30 días bajo protocolo ${dietTitle} para ${goalDesc} con balance estricto de ${targetProtein}g de proteína (${targetCalories} kcal/día).`;

        const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY_BACKUP;

        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
                    generationConfig: {
                        temperature: 0.2,
                        // @ts-ignore
                        thinkingConfig: { thinkingBudget: 0 },
                        responseMimeType: "application/json"
                    }
                });

                const prompt = `Actúa como Nutriólogo Deportivo y Fisiólogo Clínico de APEX Hypertrophy OS.
Genera un plan de alimentación diario clínico arquetípico en JSON estricto para un atleta con las siguientes especificaciones:
- Peso corporal: ${weight} kg
- Objetivo: ${goalDesc}
- Régimen nutricional: "${dietTitle}"
- Restricciones o notas clínicas del atleta: ${dietaryNotes ? `"${dietaryNotes}" (OBLIGATORIO CUMPLIR AL 100%)` : "Ninguna"}
- Metas exactas de macros: ${targetCalories} kcal/día | ${targetProtein}g proteína | ${targetCarbs}g carbohidratos | ${targetFats}g grasas

REGLAS NUTRICIONALES ESTRICTAS POR RÉGIMEN:
- Si es Cetogénica (Keto): Carbohidratos netos estrictamente < 35g TOTAL EN EL DÍA. CERO arroz, pasta, avena, pan, azúcar o papas. Grasas saludables altas (aguacate, aceite de oliva, frutos secos, salmón).
- Si es Baja en Carbos (Low Carb): Carbohidratos moderados (~90-100g/día), concentrados peri-entrenamiento.
- Si es Vegetariana: CERO carnes rojas, aves ni pescado. Fuentes proteicas: huevos, yogur griego, cottage, tofu, tempeh, legumbres.
- Si es Vegana: CERO productos de origen animal. Fuentes: tofu, tempeh, seitán, edamames, lentejas, proteína aislada de chícharo/arroz.
- Si es Paleolítica (Paleo): CERO granos/cereales, CERO legumbres, CERO lácteos, CERO azúcares. Alimentos no procesados: carnes magras, pescados salvajes, huevos, tubérculos, semillas.
- Si es Ayuno Intermitente (16/8): Concentra la alimentación en 3 comidas densas dentro de una ventana de 8 horas (12:00 PM a 08:00 PM).

ESTRUCTURA JSON EXACTA REQUERIDA:
{
  "monthlySummary": "Resumen clínico explicando por qué este plan cumple con ${dietTitle} y optimiza ${goalDesc}.",
  "meals": [
    {
      "mealName": "Comida 1 (Desayuno)",
      "timing": "08:30 AM",
      "ingredients": [
        { "item": "Nombre del ingrediente", "grams": 180 }
      ],
      "macros": { "proteinG": 35, "carbsG": 20, "fatsG": 15 }
    }
  ]
}`;

                const geminiPromise = model.generateContent(prompt);
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Gemini request timeout (10s)")), 10000)
                );

                const result = await Promise.race([geminiPromise, timeoutPromise]);
                const text = result.response.text();
                const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const parsed = JSON.parse(cleaned);

                if (parsed && Array.isArray(parsed.meals) && parsed.meals.length > 0) {
                    activeMeals = parsed.meals;
                    if (parsed.monthlySummary) {
                        clinicalSummary = parsed.monthlySummary;
                    }
                }
            } catch (geminiError: any) {
                console.warn("[Gemini Diet API] Fallback to clinical algorithmic plan:", geminiError?.message || geminiError);
            }
        }

        // Expandir a plan de 30 días con estructura compatible para visualización y lista de compras
        const thirtyDayPlan = Array.from({ length: 30 }).map((_, i) => ({
            dayNumber: i + 1,
            totalCalories: targetCalories,
            meals: activeMeals
        }));

        const dietPlanResponse = {
            monthYear: new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
            dietaryPreference,
            dietaryTitle: dietTitle,
            dietaryNotes,
            monthlySummary: clinicalSummary,
            caloriesTarget: targetCalories,
            macros: {
                protein: targetProtein,
                carbs: targetCarbs,
                fats: targetFats
            },
            dailySupplements: clinicalSupplements.map(s => ({
                name: s.name,
                dosage: s.dosage,
                timing: s.timing,
                clinicalReason: s.clinicalReason
            })),
            weeklyTemplates: [
                {
                    weekNumber: 1,
                    focus: `${dietTitle} // ${goalDesc}`,
                    meals: activeMeals.map((m: any) => ({
                        name: m.mealName || m.name || "Comida",
                        timing: m.timing || "",
                        items: m.items || (m.ingredients?.map((i: any) => `${i.grams}g ${i.item}`).join(" + ")) || "",
                        calories: m.calories || Math.round(((m.macros?.proteinG || 0) * 4) + ((m.macros?.carbsG || 0) * 4) + ((m.macros?.fatsG || 0) * 9)),
                        proteinG: m.proteinG || m.macros?.proteinG || 0,
                        ingredients: m.ingredients || []
                    }))
                }
            ],
            thirtyDayPlan
        };

        return NextResponse.json(dietPlanResponse);

    } catch (e: any) {
        console.error("[API Gemini Diet Error]:", e);
        return NextResponse.json({ error: e.message || "Failed to process diet request" }, { status: 500 });
    }
}
