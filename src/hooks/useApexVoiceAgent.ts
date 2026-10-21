// src/hooks/useApexVoiceAgent.ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ApexV2Tab } from "@/components/apex/v2/ApexV2BottomNav";

export interface VoiceAgentWorkoutResult {
    exerciseName: string | null;
    sets: number;
    reps: number | null;
    weight: number | null;
    weightUnit: "kg" | "lbs" | null;
}

export interface VoiceAgentNutritionResult {
    mealCategory: "breakfast" | "lunch" | "dinner" | "snack1" | "snack2";
    foods: Array<{
        name: string;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatsG: number;
    }>;
}

export interface VoiceAgentActionResult {
    intent: "LOG_WORKOUT" | "LOG_NUTRITION" | "LOG_DIET_PLAN" | "SEARCH_EXERCISE" | "NAVIGATE" | "MUSIC_CONTROL" | "UNKNOWN";
    targetTab?: ApexV2Tab;
    summary: string;
    workout?: VoiceAgentWorkoutResult;
    nutrition?: VoiceAgentNutritionResult;
    search?: { query: string };
    music?: {
        action: "play" | "pause" | "next" | "previous" | "play_bpm" | "search_play";
        bpmCategory?: "low" | "mid" | "high" | null;
        query?: string | null;
    };
    rawTranscript: string;
}

/**
 * Limpia repeticiones de palabras consecutivas que algunos motores de SpeechRecognition generan por error.
 * Ej: "press press de banca" -> "press de banca"
 */
export function deduplicateVoiceTranscript(text: string): string {
    if (!text) return "";
    let clean = text.trim();
    // 1. Palabras individuales consecutivas duplicadas (ignorando mayúsculas/minúsculas)
    clean = clean.replace(/\b([a-záéíóúñ0-9]+)(?:\s+\1\b)+/gi, "$1");
    // 2. Frases cortas de 2 palabras repetidas consecutivamente
    clean = clean.replace(/\b([a-záéíóúñ0-9]+\s+[a-záéíóúñ0-9]+)\s+\1\b/gi, "$1");
    // 3. Normalizar espacios
    return clean.replace(/\s+/g, " ").trim();
}

interface UseApexVoiceAgentProps {
    currentTab: ApexV2Tab;
    activeExerciseNames: string[];
    onActionResult: (action: VoiceAgentActionResult) => void;
    onBatchActions?: (actions: VoiceAgentActionResult[], overallSummary?: string) => void;
}

export function useApexVoiceAgent({
    currentTab,
    activeExerciseNames,
    onActionResult,
    onBatchActions
}: UseApexVoiceAgentProps) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showPromoTooltip, setShowPromoTooltip] = useState(true);

    const recognitionRef = useRef<any>(null);
    const sessionPrefixRef = useRef<string>("");
    const currentSessionFinalRef = useRef<string>("");
    const isHoldingRef = useRef<boolean>(false);
    const currentTabRef = useRef<ApexV2Tab>(currentTab);
    const activeExerciseNamesRef = useRef<string[]>(activeExerciseNames);
    const onActionResultRef = useRef(onActionResult);
    const onBatchActionsRef = useRef(onBatchActions);

    useEffect(() => {
        currentTabRef.current = currentTab;
    }, [currentTab]);

    useEffect(() => {
        activeExerciseNamesRef.current = activeExerciseNames;
    }, [activeExerciseNames]);

    useEffect(() => {
        onActionResultRef.current = onActionResult;
    }, [onActionResult]);

    useEffect(() => {
        onBatchActionsRef.current = onBatchActions;
    }, [onBatchActions]);

    // Ocultar el tooltip promocional después de 8 segundos si no se usa
    useEffect(() => {
        const t = setTimeout(() => {
            setShowPromoTooltip(false);
        }, 8000);
        return () => clearTimeout(t);
    }, []);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((prev) => (prev === msg ? null : prev));
        }, 4200);
    }, []);

    // Función de procesamiento: evalúa primero fast-path local (solo si no es orden compuesta) y luego Gemini
    const processTranscript = useCallback(async (spokenText: string) => {
        const clean = deduplicateVoiceTranscript(spokenText);
        if (!clean) return;

        setIsProcessing(true);

        const lower = clean.toLowerCase();

        // Detectar si el dictado contiene órdenes múltiples ("y", "después", "también", "luego" o mezcla de gym + música/dieta)
        const isCompound = /\b(y|luego|también|tambien|después|despues|además|ademas)\b/i.test(clean) ||
            (clean.split(/\s+/).length > 6 && (
                (/\b(press|sentadilla|curl|remo|peso|libras|kilos|reps|series|ejercicio)\b/i.test(clean) &&
                 /\b(música|musica|spotify|bpm|bad bunny|comí|comi|dieta)\b/i.test(clean))
            ));

        // Solo ejecutar fast-paths si NO es una orden múltiple/compuesta
        if (!isCompound) {
            // --- Fast-path local: "Comí lo de la dieta" o variantes ---
            if (
                lower.includes("comi lo de la dieta") ||
                lower.includes("comí lo de la dieta") ||
                lower.includes("lo de la dieta") ||
                lower.includes("comí mi dieta") ||
                lower.includes("comi mi dieta") ||
                lower.includes("lo del plan") ||
                lower.includes("seguir mi dieta")
            ) {
                const action: VoiceAgentActionResult = {
                    intent: "LOG_DIET_PLAN",
                    targetTab: "nutrition",
                    summary: "Dieta programada registrada para hoy",
                    rawTranscript: clean
                };
                onActionResultRef.current(action);
                showToast("✓ Dieta programada cargada con éxito a Nutrición");
                setIsProcessing(false);
                return;
            }

            // --- Fast-path local: Música y Control de Spotify ---
            // 1. Bad Bunny / Artistas populares
            if (lower.includes("bad bunny") || lower.includes("badbunny")) {
                const action: VoiceAgentActionResult = {
                    intent: "MUSIC_CONTROL",
                    targetTab: currentTabRef.current,
                    summary: "Spotify: Reproduciendo Bad Bunny",
                    music: {
                        action: "search_play",
                        query: "Bad Bunny"
                    },
                    rawTranscript: clean
                };
                onActionResultRef.current(action);
                showToast("✓ Spotify: Reproduciendo Bad Bunny");
                setIsProcessing(false);
                return;
            }

            // 2. Música más calmada / BPM bajo / Lofi recovery
            if (
                lower.includes("calmada") ||
                lower.includes("tranquila") ||
                lower.includes("bpm bajo") ||
                lower.includes("baja intensidad") ||
                lower.includes("relajante") ||
                lower.includes("recuperacion") ||
                lower.includes("recuperación")
            ) {
                const action: VoiceAgentActionResult = {
                    intent: "MUSIC_CONTROL",
                    targetTab: currentTabRef.current,
                    summary: "Spotify: Playlist calmada (80-90 BPM)",
                    music: {
                        action: "play_bpm",
                        bpmCategory: "low",
                        query: "lofi-recovery"
                    },
                    rawTranscript: clean
                };
                onActionResultRef.current(action);
                showToast("✓ Spotify: Playlist calmada activada (80-90 BPM)");
                setIsProcessing(false);
                return;
            }

            // 3. Más intensidad / Sube BPM / Phonk / Hard Techno
            if (
                lower.includes("más intensidad") ||
                lower.includes("mas intensidad") ||
                lower.includes("sube bpm") ||
                lower.includes("sube a otro bpm") ||
                lower.includes("aumenta bpm") ||
                lower.includes("bpm alto") ||
                lower.includes("sube la intensidad") ||
                lower.includes("phonk") ||
                lower.includes("hard techno")
            ) {
                const action: VoiceAgentActionResult = {
                    intent: "MUSIC_CONTROL",
                    targetTab: currentTabRef.current,
                    summary: "Spotify: Máxima intensidad (140-160 BPM)",
                    music: {
                        action: "play_bpm",
                        bpmCategory: "high",
                        query: "gym-phonk"
                    },
                    rawTranscript: clean
                };
                onActionResultRef.current(action);
                showToast("✓ Spotify: Modo Máxima Intensidad activado (140-160 BPM)");
                setIsProcessing(false);
                return;
            }

            // 4. Pausa / Play directo
            if (lower === "pausa" || lower === "pausar" || lower.includes("pausa la música") || lower.includes("pausar música")) {
                const action: VoiceAgentActionResult = {
                    intent: "MUSIC_CONTROL",
                    targetTab: currentTabRef.current,
                    summary: "Spotify: Música pausada",
                    music: { action: "pause" },
                    rawTranscript: clean
                };
                onActionResultRef.current(action);
                showToast("✓ Spotify: Pausa");
                setIsProcessing(false);
                return;
            }

            if (lower === "play" || lower === "reproducir" || lower.includes("pon música") || lower.includes("reanuda la música")) {
                const action: VoiceAgentActionResult = {
                    intent: "MUSIC_CONTROL",
                    targetTab: currentTabRef.current,
                    summary: "Spotify: Reproduciendo",
                    music: { action: "play" },
                    rawTranscript: clean
                };
                onActionResultRef.current(action);
                showToast("✓ Spotify: Reproduciendo");
                setIsProcessing(false);
                return;
            }

            if (lower.includes("siguiente canción") || lower.includes("siguiente pista") || lower === "siguiente") {
                const action: VoiceAgentActionResult = {
                    intent: "MUSIC_CONTROL",
                    targetTab: currentTabRef.current,
                    summary: "Spotify: Siguiente pista",
                    music: { action: "next" },
                    rawTranscript: clean
                };
                onActionResultRef.current(action);
                showToast("✓ Spotify: Siguiente pista");
                setIsProcessing(false);
                return;
            }
        }

        try {
            const res = await fetch("/api/apex/voice-agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcript: clean,
                    currentTab: currentTabRef.current,
                    activeExerciseNames: activeExerciseNamesRef.current
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            const actions: VoiceAgentActionResult[] = Array.isArray(data.actions) && data.actions.length > 0
                ? data.actions
                : [
                    {
                        intent: data.intent || "UNKNOWN",
                        targetTab: data.targetTab || currentTabRef.current,
                        summary: data.summary || "Comando procesado",
                        workout: data.workout,
                        nutrition: data.nutrition,
                        search: data.search,
                        music: data.music,
                        rawTranscript: clean
                    }
                ];

            const overallSummary = data.overallSummary || data.summary || actions.map(a => a.summary).filter(Boolean).join(" • ");

            if (onBatchActionsRef.current) {
                onBatchActionsRef.current(actions, overallSummary);
            } else {
                actions.forEach(a => onActionResultRef.current(a));
            }

            if (overallSummary) {
                showToast(`✓ ${overallSummary}`);
            }
        } catch (err: any) {
            console.warn("[useApexVoiceAgent] Error enviando comando a Gemini:", err);
            showToast("No pudimos interpretar el audio. Intenta de nuevo.");
        } finally {
            setIsProcessing(false);
        }
    }, [showToast]);

    // Iniciar escucha (al presionar)
    const startListening = useCallback(() => {
        if (typeof window === "undefined") return;

        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) {
            showToast("Reconocimiento de voz no soportado en este navegador.");
            return;
        }

        try {
            // Haptic vibration feedback al pulsar
            if (typeof navigator !== "undefined" && navigator.vibrate) {
                try {
                    navigator.vibrate(30);
                } catch (_) {}
            }

            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (_) {}
            }

            const recognition = new SpeechRec();
            recognition.lang = "es-MX";
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            sessionPrefixRef.current = "";
            currentSessionFinalRef.current = "";
            setTranscript("");
            setInterimTranscript("");
            setIsListening(true);
            isHoldingRef.current = true;

            recognition.onresult = (event: any) => {
                let sessionFinal = "";
                let sessionInterim = "";

                // En Web Speech API con continuous = true, event.results contiene la lista de resultados
                for (let i = 0; i < event.results.length; i++) {
                    const item = event.results[i];
                    if (item && item[0]) {
                        const word = item[0].transcript;
                        if (item.isFinal) {
                            sessionFinal += word + " ";
                        } else {
                            sessionInterim += word;
                        }
                    }
                }

                currentSessionFinalRef.current = sessionFinal.trim();
                const totalFinal = deduplicateVoiceTranscript(
                    (sessionPrefixRef.current + " " + currentSessionFinalRef.current).trim()
                );
                setTranscript(totalFinal);

                const cleanInterim = sessionInterim.trim();
                if (cleanInterim && !totalFinal.toLowerCase().endsWith(cleanInterim.toLowerCase())) {
                    setInterimTranscript(cleanInterim);
                } else {
                    setInterimTranscript("");
                }
            };

            recognition.onerror = (e: any) => {
                if (e.error !== "no-speech" && e.error !== "aborted") {
                    console.warn("[SpeechRecognition] Error:", e.error);
                }
            };

            recognition.onend = () => {
                // Si el usuario sigue sosteniendo el botón pero terminó la frase, reiniciamos suavemente
                if (isHoldingRef.current) {
                    sessionPrefixRef.current = deduplicateVoiceTranscript(
                        (sessionPrefixRef.current + " " + currentSessionFinalRef.current).trim()
                    );
                    currentSessionFinalRef.current = "";
                    try {
                        recognition.start();
                    } catch (_) {}
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
        } catch (err) {
            console.error("[useApexVoiceAgent] Error iniciando SpeechRecognition:", err);
            setIsListening(false);
            isHoldingRef.current = false;
        }
    }, [showToast]);

    // Detener escucha y enviar a procesar (al soltar)
    const stopListeningAndProcess = useCallback(() => {
        isHoldingRef.current = false;
        setIsListening(false);

        // Haptic feedback al soltar
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            try {
                navigator.vibrate([20, 30, 20]);
            } catch (_) {}
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (_) {}
            recognitionRef.current = null;
        }

        const rawSpoken = (sessionPrefixRef.current + " " + currentSessionFinalRef.current + " " + interimTranscript).trim();
        const fullText = deduplicateVoiceTranscript(rawSpoken);
        setInterimTranscript("");

        if (fullText) {
            processTranscript(fullText);
        }
    }, [interimTranscript, processTranscript]);

    // Eventos Pointer para Push-to-Talk (Hold-to-talk)
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        setShowPromoTooltip(false);
        startListening();
    }, [startListening]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        if (isHoldingRef.current) {
            stopListeningAndProcess();
        }
    }, [stopListeningAndProcess]);

    const handlePointerCancel = useCallback(() => {
        if (isHoldingRef.current) {
            stopListeningAndProcess();
        }
    }, [stopListeningAndProcess]);

    // Texto dinámico para el tooltip según la sección actual
    const getContextualTooltip = useCallback(() => {
        if (isListening) {
            const preview = interimTranscript || transcript;
            return preview ? `🔴 «${preview}»` : "🔴 Escuchando... habla ahora";
        }
        if (isProcessing) {
            return "⚡ Analizando dictado con Gemini...";
        }

        switch (currentTab) {
            case "workout":
                return "🎙️ Dicta tu ejercicio, repeticiones y peso";
            case "nutrition":
                return "🎙️ Dicta qué comiste o «comí lo de la dieta»";
            case "anatomy":
                return "🎙️ Busca por voz (ej. «mancuernas», «pecho»)";
            case "settings":
            default:
                return "🎙️ Asistente de voz APEX: mantén presionado";
        }
    }, [isListening, isProcessing, interimTranscript, transcript, currentTab]);

    return {
        isListening,
        isProcessing,
        transcript,
        interimTranscript,
        toastMessage,
        showPromoTooltip,
        setShowPromoTooltip,
        startListening,
        stopListeningAndProcess,
        handlePointerDown,
        handlePointerUp,
        handlePointerCancel,
        getContextualTooltip,
        showToast
    };
}
