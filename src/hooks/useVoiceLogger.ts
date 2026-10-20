"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceLoggerResult {
    weightKg?: number;
    weight?: number;
    reps?: number;
    rawText: string;
}

// Convertidor exhaustivo de números hablados en español a dígitos
const SPANISH_WORDS_MAP: Record<string, number> = {
    cero: 0,
    un: 1,
    uno: 1,
    una: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    dieciseis: 16,
    dieciséis: 16,
    diecisiete: 17,
    dieciocho: 18,
    diecinueve: 19,
    veinte: 20,
    veintiuno: 21,
    veintidos: 22,
    veintidós: 22,
    veintitres: 23,
    veintitrés: 23,
    veinticuatro: 24,
    veinticinco: 25,
    veintiseis: 26,
    veintiséis: 26,
    veintisiete: 27,
    veintiocho: 28,
    veintinueve: 29,
    treinta: 30,
    cuarenta: 40,
    cincuenta: 50,
    sesenta: 60,
    setenta: 70,
    ochenta: 80,
    noventa: 90,
    cien: 100,
    ciento: 100,
    doscientos: 200,
    trescientos: 300,
    cuatrocientos: 400,
    quinientos: 500
};

// Convierte frases compuestas como "ciento treinta y cinco" o "cuarenta y cinco" en dígitos
function normalizeSpokenSpanish(text: string): string {
    let clean = text.toLowerCase().trim();

    // Eliminar comas, puntos y caracteres especiales
    clean = clean.replace(/[,;]/g, " ");

    // Manejar casos compuestos como "treinta y cinco" -> "35"
    const compoundTens = ["treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    compoundTens.forEach(ten => {
        const tenVal = SPANISH_WORDS_MAP[ten];
        Object.keys(SPANISH_WORDS_MAP).forEach(unit => {
            const unitVal = SPANISH_WORDS_MAP[unit];
            if (unitVal > 0 && unitVal < 10) {
                const phrase = `${ten} y ${unit}`;
                clean = clean.replace(new RegExp(`\\b${phrase}\\b`, "g"), String(tenVal + unitVal));
            }
        });
    });

    // Manejar "ciento X" -> "100 + X"
    Object.keys(SPANISH_WORDS_MAP).forEach(w => {
        const val = SPANISH_WORDS_MAP[w];
        if (val > 0 && val < 100) {
            clean = clean.replace(new RegExp(`\\bciento ${w}\\b`, "g"), String(100 + val));
        }
    });

    // Reemplazar palabras individuales por dígitos
    const tokens = clean.split(/\s+/);
    const converted = tokens.map(token => {
        if (SPANISH_WORDS_MAP[token] !== undefined) {
            return String(SPANISH_WORDS_MAP[token]);
        }
        return token;
    });

    return converted.join(" ");
}

export function parseSpokenWorkout(text: string): VoiceLoggerResult | null {
    if (!text || text.trim() === "") return null;

    const normalized = normalizeSpokenSpanish(text);

    // Patrón 1: "X [kilos/libras/kg/lbs] [por/x/*/con/a/y] Y [reps/repeticiones]"
    // Ejemplos: "135 por 10", "80 kilos por 10", "135 x 10", "80 con 10", "80 a 10", "135 y 10"
    const regex1 = /(\d+(?:\.\d+)?)\s*(?:kilos?|kg|libras?|lbs?|lb)?\s*(?:por|x|\*|con|a|y)\s*(\d+)(?:\s*(?:reps?|repeticiones?))?/i;
    const match1 = normalized.match(regex1);
    if (match1) {
        const w = parseFloat(match1[1]);
        const r = parseInt(match1[2], 10);
        return {
            weightKg: w,
            weight: w,
            reps: r,
            rawText: text
        };
    }

    // Patrón 2: "Y [reps/repeticiones] [con/a/en] X [kilos/libras/kg/lbs]"
    // Ejemplos: "10 reps con 80 kilos", "12 repeticiones a 135 libras", "10 con 80"
    const regex2 = /(\d+)\s*(?:reps?|repeticiones?)\s*(?:con|a|en|de)\s*(\d+(?:\.\d+)?)(?:\s*(?:kilos?|kg|libras?|lbs?|lb))?/i;
    const match2 = normalized.match(regex2);
    if (match2) {
        const r = parseInt(match2[1], 10);
        const w = parseFloat(match2[2]);
        return {
            weightKg: w,
            weight: w,
            reps: r,
            rawText: text
        };
    }

    // Patrón 3: "X [kilos/libras/kg/lbs] [,] Y [reps/repeticiones]"
    // Ejemplos: "80 kilos 10 repeticiones", "135 lbs 10 reps", "80 10"
    const regex3 = /(\d+(?:\.\d+)?)\s*(?:kilos?|kg|libras?|lbs?|lb)\s+(\d+)(?:\s*(?:reps?|repeticiones?))?/i;
    const match3 = normalized.match(regex3);
    if (match3) {
        const w = parseFloat(match3[1]);
        const r = parseInt(match3[2], 10);
        return {
            weightKg: w,
            weight: w,
            reps: r,
            rawText: text
        };
    }

    // Patrón 4: Dos números separados por espacio: "80 10" o "135 12"
    const regex4 = /\b(\d+(?:\.\d+)?)\s+(\d+)\b/;
    const match4 = normalized.match(regex4);
    if (match4) {
        const w = parseFloat(match4[1]);
        const r = parseInt(match4[2], 10);
        return {
            weightKg: w,
            weight: w,
            reps: r,
            rawText: text
        };
    }

    // Patrón 5: Solo repeticiones ("10 reps", "12 repeticiones", "hice 10", "saqué 10")
    const regexRepsOnly = /(?:hice|saqué|fueron|saque)?\s*(\d+)\s*(?:reps?|repeticiones?)/i;
    const matchRepsOnly = normalized.match(regexRepsOnly);
    if (matchRepsOnly) {
        return {
            reps: parseInt(matchRepsOnly[1], 10),
            rawText: text
        };
    }

    // Patrón 6: Solo peso ("80 kilos", "135 libras", "80 kg")
    const regexWeightOnly = /(\d+(?:\.\d+)?)\s*(?:kilos?|kg|libras?|lbs?|lb)/i;
    const matchWeightOnly = normalized.match(regexWeightOnly);
    if (matchWeightOnly) {
        const w = parseFloat(matchWeightOnly[1]);
        return {
            weightKg: w,
            weight: w,
            rawText: text
        };
    }

    // Patrón 7: Si solo dijo un número suelto ("10" o "12")
    const regexSingleNumber = /^\s*(\d+)\s*$/;
    const matchSingle = normalized.match(regexSingleNumber);
    if (matchSingle) {
        const num = parseInt(matchSingle[1], 10);
        // Si el número es 30 o menor, asumimos repeticiones; si es mayor, asumimos peso
        if (num <= 30) {
            return {
                reps: num,
                rawText: text
            };
        } else {
            return {
                weightKg: num,
                weight: num,
                rawText: text
            };
        }
    }

    return null;
}

export function useVoiceLogger(onLogDetected: (result: VoiceLoggerResult) => void) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef<any>(null);
    const onLogDetectedRef = useRef(onLogDetected);
    onLogDetectedRef.current = onLogDetected;

    // Detectar soporte en navegador al montar
    useEffect(() => {
        if (typeof window !== "undefined") {
            const hasSupport = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
            setIsSupported(hasSupport);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // ignore
            }
        }
        setIsListening(false);
        setInterimTranscript("");
    }, []);

    const startListening = useCallback(() => {
        if (typeof window === "undefined") return;

        setErrorMessage(null);
        setTranscript("");
        setInterimTranscript("");

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            setErrorMessage("El reconocimiento de voz automático no es compatible con este navegador. Puedes usar el micrófono de tu teclado o ingresar el peso manualmente.");
            return;
        }

        try {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // ignore
                }
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 3;

            // Detección de idioma preferente
            const userLang = (typeof navigator !== "undefined" && navigator.language) || "es-MX";
            recognition.lang = userLang.startsWith("es") ? userLang : "es-MX";

            recognition.onstart = () => {
                setIsListening(true);
                setErrorMessage(null);
            };

            recognition.onresult = (event: any) => {
                let interim = "";
                let final = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const res = event.results[i];
                    if (res.isFinal) {
                        final += res[0].transcript;
                    } else {
                        interim += res[0].transcript;
                    }
                }

                if (interim) {
                    setInterimTranscript(interim);
                }

                const spokenText = final || interim;
                if (spokenText) {
                    setTranscript(spokenText);
                }

                if (final) {
                    const parsed = parseSpokenWorkout(final);
                    if (parsed) {
                        onLogDetectedRef.current(parsed);
                        stopListening();
                    }
                }
            };

            recognition.onerror = (event: any) => {
                const err = event.error;
                console.warn("Speech Recognition Error:", err);
                setIsListening(false);

                if (err === "not-allowed" || err === "service-not-allowed") {
                    setErrorMessage("Acceso al micrófono denegado. Permite el micrófono en los ajustes de tu navegador para dictar tus series.");
                } else if (err === "no-speech") {
                    setErrorMessage("No se escuchó ninguna voz. Presiona el micrófono y habla claro cerca de tu teléfono.");
                } else if (err === "network") {
                    setErrorMessage("Error de red al procesar voz. Verifica tu conexión.");
                } else {
                    setErrorMessage(`Error de reconocimiento: ${err}. Intenta de nuevo.`);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();

        } catch (e: any) {
            console.warn("Error starting speech recognition:", e);
            setIsListening(false);
            setErrorMessage("No fue posible inicializar el micrófono. Intenta de nuevo o ingresa el peso manualmente.");
        }
    }, [stopListening]);

    return {
        isListening,
        transcript,
        interimTranscript,
        errorMessage,
        isSupported,
        startListening,
        stopListening,
        clearError: () => setErrorMessage(null)
    };
}
