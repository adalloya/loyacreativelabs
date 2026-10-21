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

interface UseApexVoiceAgentProps {
    currentTab: ApexV2Tab;
    activeExerciseNames: string[];
    onActionResult: (action: VoiceAgentActionResult) => void;
}

export function useApexVoiceAgent({
    currentTab,
    activeExerciseNames,
    onActionResult
}: UseApexVoiceAgentProps) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showPromoTooltip, setShowPromoTooltip] = useState(true);

    const recognitionRef = useRef<any>(null);
    const transcriptAccumulatorRef = useRef<string>("");
    const isHoldingRef = useRef<boolean>(false);
    const currentTabRef = useRef<ApexV2Tab>(currentTab);
    const activeExerciseNamesRef = useRef<string[]>(activeExerciseNames);
    const onActionResultRef = useRef(onActionResult);

    useEffect(() => {
        currentTabRef.current = currentTab;
    }, [currentTab]);

    useEffect(() => {
        activeExerciseNamesRef.current = activeExerciseNames;
    }, [activeExerciseNames]);

    useEffect(() => {
        onActionResultRef.current = onActionResult;
    }, [onActionResult]);

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
        }, 3800);
    }, []);

    // Función de procesamiento: evalúa primero fast-path local y luego Gemini
    const processTranscript = useCallback(async (spokenText: string) => {
        const clean = spokenText.trim();
        if (!clean) return;

        setIsProcessing(true);

        // --- Fast-path local: "Comí lo de la dieta" o variantes ---
        const lower = clean.toLowerCase();
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
            const action: VoiceAgentActionResult = {
                intent: data.intent || "UNKNOWN",
                targetTab: data.targetTab || currentTabRef.current,
                summary: data.summary || "Comando procesado",
                workout: data.workout,
                nutrition: data.nutrition,
                search: data.search,
                music: data.music,
                rawTranscript: clean
            };

            onActionResultRef.current(action);

            if (data.summary) {
                showToast(`✓ ${data.summary}`);
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

            transcriptAccumulatorRef.current = "";
            setTranscript("");
            setInterimTranscript("");
            setIsListening(true);
            isHoldingRef.current = true;

            recognition.onresult = (event: any) => {
                let finalStr = "";
                let interimStr = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const res = event.results[i];
                    if (res.isFinal) {
                        finalStr += res[0].transcript + " ";
                    } else {
                        interimStr += res[0].transcript;
                    }
                }

                if (finalStr) {
                    transcriptAccumulatorRef.current += finalStr;
                    setTranscript(transcriptAccumulatorRef.current.trim());
                }
                setInterimTranscript(interimStr);
            };

            recognition.onerror = (e: any) => {
                if (e.error !== "no-speech" && e.error !== "aborted") {
                    console.warn("[SpeechRecognition] Error:", e.error);
                }
            };

            recognition.onend = () => {
                // Si el usuario sigue sosteniendo el botón pero terminó la frase, reiniciamos suavemente
                if (isHoldingRef.current) {
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

        const fullText = (transcriptAccumulatorRef.current + " " + interimTranscript).trim();
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
