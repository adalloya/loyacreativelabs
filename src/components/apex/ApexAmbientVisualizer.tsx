// src/components/apex/ApexAmbientVisualizer.tsx
"use client";

import React from "react";
import { useApexFx } from "@/hooks/useApexFx";
import { useSpotifyPlayback } from "@/hooks/useSpotifyPlayback";
import { SpotifyThreeCanvas } from "@/components/spotify/SpotifyThreeCanvas";

export const ApexAmbientVisualizer: React.FC = () => {
    const { isFxActive, visualizerMode } = useApexFx();
    const { isPlaying, bpm, energy, accentRgb, progressMs } = useSpotifyPlayback();

    // Si FX está apagado, liberar todo (0% CPU / 0% GPU)
    if (!isFxActive || visualizerMode === "OFF") {
        return null;
    }

    return (
        <div
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-1000 opacity-90"
            aria-hidden="true"
        >
            {/* Visualizador 3D Reactivo de Alta Fidelidad en Toda la Pantalla */}
            <SpotifyThreeCanvas
                mode={visualizerMode}
                isPlaying={isPlaying}
                bpm={bpm}
                energy={energy}
                progressMs={progressMs}
                accentRgb={accentRgb}
                className="w-full h-full"
            />

            {/* Luces Ambientales Reactivas Sincronizadas con la Portada del Álbum */}
            <div
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-1000"
                style={{
                    backgroundColor: `rgb(${accentRgb})`
                }}
            />
            <div
                className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-25 transition-all duration-1000"
                style={{
                    backgroundColor: isPlaying ? `rgb(${accentRgb})` : "#FF2A2A"
                }}
            />
        </div>
    );
};
