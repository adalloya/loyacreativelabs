// src/hooks/useApexFx.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { VisualizerMode } from "@/services/spotifyTelemetry";

const STORAGE_KEY_ENABLED = "apex_fx_enabled";
const STORAGE_KEY_MODE = "apex_fx_mode";
const EVENT_NAME = "apex:fx-change";

const MODES: VisualizerMode[] = ["CANVAS", "ORB", "WAVE", "APEX", "AURA", "TUNNEL", "VORTEX", "SPECTRUM", "OFF"];

export function useApexFx() {
    const [visualizerMode, setVisualizerModeState] = useState<VisualizerMode>("OFF");

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Carga inicial desde localStorage
        const storedMode = localStorage.getItem(STORAGE_KEY_MODE) as VisualizerMode | null;
        const storedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);

        if (storedMode && MODES.includes(storedMode)) {
            setVisualizerModeState(storedMode);
        } else if (storedEnabled === "true") {
            setVisualizerModeState("CANVAS");
        } else {
            setVisualizerModeState("OFF");
        }

        const handleSync = (e: any) => {
            if (e?.detail?.mode !== undefined && MODES.includes(e.detail.mode)) {
                setVisualizerModeState(e.detail.mode);
            } else if (e?.detail?.enabled !== undefined) {
                setVisualizerModeState(e.detail.enabled ? "WAVE" : "OFF");
            } else {
                const currentStoredMode = localStorage.getItem(STORAGE_KEY_MODE) as VisualizerMode | null;
                const currentEnabled = localStorage.getItem(STORAGE_KEY_ENABLED) === "true";
                if (currentStoredMode && MODES.includes(currentStoredMode)) {
                    setVisualizerModeState(currentStoredMode);
                } else {
                    setVisualizerModeState(currentEnabled ? "WAVE" : "OFF");
                }
            }
        };

        window.addEventListener(EVENT_NAME, handleSync);
        window.addEventListener("storage", handleSync);

        return () => {
            window.removeEventListener(EVENT_NAME, handleSync);
            window.removeEventListener("storage", handleSync);
        };
    }, []);

    const setVisualizerMode = useCallback((mode: VisualizerMode) => {
        setVisualizerModeState(mode);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_MODE, mode);
            localStorage.setItem(STORAGE_KEY_ENABLED, String(mode !== "OFF"));
            window.dispatchEvent(
                new CustomEvent(EVENT_NAME, {
                    detail: { mode, enabled: mode !== "OFF" }
                })
            );
        }
    }, []);

    const toggleFx = useCallback(() => {
        setVisualizerModeState(prev => {
            const nextMode: VisualizerMode = prev === "OFF" ? "WAVE" : "OFF";
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY_MODE, nextMode);
                localStorage.setItem(STORAGE_KEY_ENABLED, String(nextMode !== "OFF"));
                window.dispatchEvent(
                    new CustomEvent(EVENT_NAME, {
                        detail: { mode: nextMode, enabled: nextMode !== "OFF" }
                    })
                );
            }
            return nextMode;
        });
    }, []);

    const cycleMode = useCallback(() => {
        setVisualizerModeState(prev => {
            const currentIndex = MODES.indexOf(prev);
            const nextIndex = (currentIndex + 1) % MODES.length;
            const nextMode = MODES[nextIndex];
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY_MODE, nextMode);
                localStorage.setItem(STORAGE_KEY_ENABLED, String(nextMode !== "OFF"));
                window.dispatchEvent(
                    new CustomEvent(EVENT_NAME, {
                        detail: { mode: nextMode, enabled: nextMode !== "OFF" }
                    })
                );
            }
            return nextMode;
        });
    }, []);

    const setFx = useCallback((value: boolean) => {
        setVisualizerMode(value ? "CANVAS" : "OFF");
    }, [setVisualizerMode]);

    const turnOffFx = useCallback(() => {
        setVisualizerMode("OFF");
    }, [setVisualizerMode]);

    return {
        isFxActive: visualizerMode !== "OFF",
        visualizerMode,
        toggleFx,
        cycleMode,
        turnOffFx,
        setVisualizerMode,
        setFx
    };
}
