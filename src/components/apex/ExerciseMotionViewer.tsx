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
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(prev => (prev === 0 ? 1 : 0));
        }, 900);
        return () => clearInterval(interval);
    }, []);

    const imgUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${githubId}/${frame}.jpg`;

    return (
        <div className={`relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0A0A0C] flex items-center justify-center select-none shadow-inner group ${className}`}>
            {!hasError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imgUrl}
                    alt={`${exerciseName} - frame ${frame}`}
                    onError={() => setHasError(true)}
                    className="w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:grayscale-0 transition-all duration-500 ease-out"
                    loading="lazy"
                />
            ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-zinc-500">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                        {exerciseName}
                    </span>
                    <span className="text-[10px] text-zinc-600">Demostración en memoria local</span>
                </div>
            )}

            {/* Top-Left Activation Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-[10px] font-mono tracking-wider text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A] animate-pulse" />
                <span>ACTIVACIÓN: {activationPct}%</span>
            </div>

            {/* Bottom-Right Movement Vector Indicator */}
            <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-white/80" title="Vector de fuerza">
                <svg className="w-3.5 h-3.5 text-[#FF2A2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
            </div>

            {/* Subtle Frame Indicator */}
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full transition-all ${frame === 0 ? "bg-white" : "bg-white/30"}`} />
                <span className={`w-1.5 h-1.5 rounded-full transition-all ${frame === 1 ? "bg-white" : "bg-white/30"}`} />
            </div>
        </div>
    );
}
