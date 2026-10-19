"use client";

import { useState, useRef, useCallback } from "react";

interface VoiceLoggerResult {
    weightKg: number;
    reps: number;
}

export function useVoiceLogger(onLogDetected: (result: VoiceLoggerResult) => void) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<any>(null);

    // Parser inteligente de texto a números (soporta español e inglés)
    const parseSpokenWorkout = (text: string): VoiceLoggerResult | null => {
        const clean = text.toLowerCase();

        // Patrón 1: "X kilos por Y" o "X por Y" (ej. "80 kilos por 10", "100 por 8")
        const regex1 = /(\d+(?:\.\d+)?)\s*(?:kilos?|kg)?\s*(?:por|x|\*)\s*(\d+)/i;
        const match1 = clean.match(regex1);
        if (match1) {
            return {
                weightKg: parseFloat(match1[1]),
                reps: parseInt(match1[2], 10)
            };
        }

        // Patrón 2: Conversión de palabras comunes (ej. "ochenta por diez")
        const numberWords: Record<string, number> = {
            cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
            diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, treinta: 30, cuarenta: 40,
            cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100
        };

        const tokens = clean.split(/\s+/);
        const numbersFound: number[] = [];

        for (const token of tokens) {
            if (!isNaN(Number(token))) {
                numbersFound.push(Number(token));
            } else if (numberWords[token] !== undefined) {
                numbersFound.push(numberWords[token]);
            }
        }

        if (numbersFound.length >= 2) {
            return {
                weightKg: numbersFound[0],
                reps: Math.round(numbersFound[1])
            };
        }

        return null;
    };

    const startListening = useCallback(() => {
        if (typeof window === "undefined") return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition no soportado en este navegador.");
            return;
        }

        try {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "es-MX";

            recognition.onstart = () => {
                setIsListening(true);
                setTranscript("");
            };

            recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);

                const parsed = parseSpokenWorkout(text);
                if (parsed) {
                    onLogDetected(parsed);
                }
                setIsListening(false);
            };

            recognition.onerror = () => {
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();

        } catch (e) {
            console.warn("Error starting speech recognition:", e);
            setIsListening(false);
        }
    }, [onLogDetected]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening
    };
}
