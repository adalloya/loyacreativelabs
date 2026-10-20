// src/hooks/useApexFx.ts
"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "apex_fx_enabled";
const EVENT_NAME = "apex:fx-change";

export function useApexFx() {
    const [isFxActive, setIsFxActive] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Carga inicial desde localStorage (por defecto false para modo silencioso/máximo ahorro)
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            setIsFxActive(stored === "true");
        }

        const handleSync = (e: any) => {
            if (e?.detail?.enabled !== undefined) {
                setIsFxActive(Boolean(e.detail.enabled));
            } else {
                const updated = localStorage.getItem(STORAGE_KEY) === "true";
                setIsFxActive(updated);
            }
        };

        window.addEventListener(EVENT_NAME, handleSync);
        window.addEventListener("storage", handleSync);

        return () => {
            window.removeEventListener(EVENT_NAME, handleSync);
            window.removeEventListener("storage", handleSync);
        };
    }, []);

    const toggleFx = useCallback(() => {
        setIsFxActive(prev => {
            const next = !prev;
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY, String(next));
                window.dispatchEvent(
                    new CustomEvent(EVENT_NAME, { detail: { enabled: next } })
                );
            }
            return next;
        });
    }, []);

    const setFx = useCallback((value: boolean) => {
        setIsFxActive(value);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, String(value));
            window.dispatchEvent(
                new CustomEvent(EVENT_NAME, { detail: { enabled: value } })
            );
        }
    }, []);

    return {
        isFxActive,
        toggleFx,
        setFx
    };
}
