"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useGymHardware() {
    const wakeLockRef = useRef<any>(null);
    const [isScreenLocked, setIsScreenLocked] = useState(false);

    // 1. Screen Wake Lock API
    const requestWakeLock = useCallback(async () => {
        try {
            if (typeof window !== "undefined" && "wakeLock" in navigator) {
                wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
                setIsScreenLocked(true);

                wakeLockRef.current.addEventListener("release", () => {
                    setIsScreenLocked(false);
                });
            }
        } catch (err) {
            console.warn("Wake Lock no soportado o bloqueado por ahorro de batería:", err);
            setIsScreenLocked(false);
        }
    }, []);

    useEffect(() => {
        requestWakeLock();

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                requestWakeLock();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            try {
                wakeLockRef.current?.release();
            } catch (e) { }
        };
    }, [requestWakeLock]);

    // 2. Beep & Haptic Feedback (Doesn't pause music in AirPods/iOS)
    const triggerRestTimerAlert = useCallback((type: "countdown" | "start_set") => {
        // Haptic Vibration
        if (typeof window !== "undefined" && "vibrate" in navigator) {
            try {
                navigator.vibrate(type === "start_set" ? [200, 100, 200] : [80]);
            } catch (e) { }
        }

        // Web Audio API Synthesized Pulse
        if (typeof window !== "undefined") {
            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioCtx) return;

                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = "sine";
                // A5 (880Hz) para inicio de serie, A4 (440Hz) para cuenta regresiva
                osc.frequency.setValueAtTime(type === "start_set" ? 880 : 440, ctx.currentTime);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === "start_set" ? 0.35 : 0.12));

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + (type === "start_set" ? 0.35 : 0.12));
            } catch (e) { }
        }
    }, []);

    return {
        isScreenLocked,
        triggerRestTimerAlert,
        requestWakeLock
    };
}
