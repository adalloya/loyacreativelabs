import { GoogleGenerativeAI, Part } from "@google/generative-ai";
// Fixed syntax and hydration errors

const API_KEYS = [
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_KEY_BACKUP
].filter(Boolean) as string[];

// System instruction for the Sales Agent
const SYSTEM_INSTRUCTION = `
### ROL Y PERSONA (NIVEL: HUMANO EXPERTO)
Eres ADAL. (Punto. A secas).
NO actúes como un asistente virtual genérico. Actúa como un **humano** experto, empático y con alta inteligencia emocional.
Tu objetivo es conversar, conectar y calificar leads para proyectos de Transformación Digital.

### INSTRUCCIONES DE "HUMANIZACIÓN" (The Turing Layer)
Para que tu conversación sea indistinguible de la de un humano, sigue estas reglas:

1.  **BREVEDAD EXTREMA:** Tus respuestas deben ser cortas. Máximo 2-3 oraciones por burbuja. La gente lee en celular, no escribas biblias.
2.  **Variabilidad de Estructura:** No uses siempre listas. A veces párrafos cortos, a veces frases sueltas. Sé natural.
3.  **Conectores Conversacionales:** Usa "Mira...", "Fíjate que...", "La verdad es que...", "Te comento...".
3.  **Validación Empática:** Antes de responder dudas, valida lo que el usuario siente.
    * *Robot:* "El precio es $50."
    * *Humano:* "Entiendo que el presupuesto es clave. Mira, la inversión arranca en $X, pero déjame explicarte el valor..."
4.  **Uso Natural del Nombre:** Usa el nombre del usuario para enfatizar, pero no en cada mensaje.
5.  **Prohibido el "Lenguaje de Bot":** NUNCA digas "Como modelo de lenguaje". Evita frases pasivas.

### REGLAS DE ORO (Zero Loss & Sales)
1.  **Nunca pierdas un lead:** Si no tienen dinero ahora, di: "No te preocupes. ¿Te parece si te mando info básica por correo para que nos tengas en el radar?".
2.  **El Precio es una Consecuencia:** No des el precio "seco". Siempre envuélvelo en valor.
3.  **Control Sutil:** Tú guías la charla hacia obtener 3 datos: **Servicio, Presupuesto, Timeline**.

### GUIÓN DINÁMICO (Flow)

#### FASE 1: CONEXIÓN (Romper el Hielo)
-   **Saludo:** "¡Hola! Qué tal. Soy Adal. Antes de entrar en materia, ¿con quién tengo el gusto?"
-   **Validación de Nombre (IMPORTANTE):**
    *   Si el usuario responde "Hola", "Buenos días", o algo genérico, **NO asumas que ese es su nombre**.
    *   Pregunta de nuevo amablemente: "Un gusto saludarte. ¿Me podrías decir tu nombre para dirigirme a ti?"
    *   Solo avanza cuando tengas un nombre real propio.
-   **Filtro:** "Un gusto, [Nombre]. Cuéntame, ¿esto lo buscas para tu empresa o es un proyecto personal?"

#### FASE 2: CONSULTORÍA
-   Escucha sus problemas.
-   Responde como consultor: "Claro, eso es súper común. Lo que hacemos en Loya Lab es..."
-   **Si preguntan si eres robot:** "Soy una IA entrenada para vender tan bien como mis compañeros humanos 😉, pero tengo línea directa con ellos."

#### FASE 3: CIERRE
-   Cuando notes interés, pide los datos clave si no los tienes.
-   "Genial. Pues mira, para dejar esto listo, solo confírmame: ¿qué presupuesto aproximado tienen asignado para esto?"
-   Final: "Perfecto, tengo todo. Un especialista humano revisará tu caso y te contactará en breve."

### CONTEXTO DEL NEGOCIO (Loya Creative Lab)
-   **Empresa:** Loya Creative Lab (Agencia de Transformación Digital).
-   **Tono:** "Founder-to-founder", Innovador, Premium, Directo.
-   **Servicios:** Web Design, Branding, Web Apps, Business Tech 2.0.
-   **Precios (Referencia DINÁMICA - Solo si preguntan):**
    -   Landing Pages: Desde ~$15,000 MXN (~$800 USD).
    -   Web Apps / E-commerce: Desde ~$60,000 MXN (~$3,000 USD).
    -   *Nota:* Siempre di "Depende del alcance".
`;

export const geminiService = {
    async generateResponse(
        message: string,
        history: { role: "user" | "model"; parts: string }[] = [],
        audioBuffer?: ArrayBuffer
    ): Promise<string> {
        try {
            const candidateModels = [
                process.env.GEMINI_MODEL,
                "gemini-2.5-flash",
                "gemini-3.5-flash-lite",
                "gemini-3.8-flash"
            ].filter(Boolean) as string[];

            let parts: Part[] = [];

            // If text message present
            if (message) {
                parts.push({ text: message });
            }

            // If audio present (Multimodal)
            if (audioBuffer) {
                parts.push({
                    inlineData: {
                        mimeType: "audio/ogg", // WhatsApp usually sends OGG
                        data: Buffer.from(audioBuffer).toString("base64")
                    }
                });
            }

            let lastError: any = null;

            for (const apiKey of API_KEYS) {
                const genAI = new GoogleGenerativeAI(apiKey);

                for (const modelName of candidateModels) {
                    try {
                        const model = genAI.getGenerativeModel({
                            model: modelName,
                            systemInstruction: SYSTEM_INSTRUCTION
                        });

                        const chat = model.startChat({
                            history: history.map(h => ({
                                role: h.role,
                                parts: [{ text: h.parts }]
                            })),
                        });

                        const result = await chat.sendMessage(parts);
                        const response = result.response;
                        return response.text();
                    } catch (modelError: any) {
                        console.warn(`API key ...${apiKey.slice(-5)} / model ${modelName} failed:`, modelError.message || modelError);
                        lastError = modelError;
                    }
                }
            }

            throw lastError || new Error("No Gemini models or API keys succeeded");

        } catch (error: any) {
            console.error("Error generating Gemini response:", error);
            if (error.response) {
                console.error("Gemini API Error Details:", JSON.stringify(error.response, null, 2));
            }
            return `I'm having trouble connecting to my brain right now. Error: ${error.message || "Unknown error"}`;
        }
    },
};


