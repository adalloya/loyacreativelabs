"use client";

import { useState, useEffect } from "react";

interface ExerciseMotionViewerProps {
    githubId: string;
    exerciseName: string;
    activationPct?: number;
    className?: string;
}

export function ExerciseMotionViewer({
    githubId,
    exerciseName,
    activationPct = 94,
    className = ""
}: ExerciseMotionViewerProps) {
    const [frame, setFrame] = useState<0 | 1>(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const frame0Url = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${githubId}/0.jpg`;
    const frame1Url = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${githubId}/1.jpg`;

    // Preload both images into browser cache to eliminate any visual flickers
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);

        let active = true;
        const img0 = new Image();
        const img1 = new Image();

        img0.src = frame0Url;
        img1.src = frame1Url;

        img0.onload = () => {
            if (active) setIsLoaded(true);
        };
        img0.onerror = () => {
            if (active) setHasError(true);
        };

        return () => {
            active = false;
        };
    }, [githubId, frame0Url, frame1Url]);

    // Intercalate between frame 0 and frame 1 every 800ms (real biomechanical motion cadence)
    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(prev => (prev === 0 ? 1 : 0));
        }, 800);

        return () => clearInterval(interval);
    }, []);

    const currentImgUrl = frame === 0 ? frame0Url : frame1Url;

    return (
        <div className={`relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0A0A0C] flex items-center justify-center select-none shadow-inner group ${className}`}>
            {!hasError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={currentImgUrl}
                    alt={`${exerciseName} - frame ${frame}`}
                    onError={() => setHasError(true)}
                    className={`w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:grayscale-0 transition-opacity duration-300 ease-out ${
                        isLoaded ? "opacity-100" : "opacity-40"
                    }`}
                />
            ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-zinc-500">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                        {exerciseName}
                    </span>
                    <span className="text-[10px] text-zinc-600">Demostración biomecánica en memoria</span>
                </div>
            )}

            {/* Top-Left Translucent Activation Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-[10px] font-mono tracking-wider text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A] animate-pulse" />
                <span>ACTIVACIÓN: {activationPct}%</span>
            </div>

            {/* Bottom-Right Biomechanical Vector Indicator */}
            <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-white/80" title="Vector de fuerza biomecánica">
                <svg className="w-3.5 h-3.5 text-[#FF2A2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
            </div>

            {/* Active Frame Indicator (0 / 1) */}
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
                <span className={`w-1.5 h-1.5 rounded-full transition-all ${frame === 0 ? "bg-white scale-125" : "bg-white/30"}`} />
                <span className={`w-1.5 h-1.5 rounded-full transition-all ${frame === 1 ? "bg-white scale-125" : "bg-white/30"}`} />
                <span className="text-[9px] font-mono text-zinc-400 ml-1">F{frame}</span>
            </div>
        </div>
    );
}
