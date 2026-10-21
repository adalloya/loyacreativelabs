"use client";

import { useState, useEffect } from "react";
import { getExerciseGitHubId } from "@/data/exerciseDatabase";

interface ExerciseMotionViewerProps {
    githubId: string;
    exerciseName: string;
    activationPct?: number;
    className?: string;
    imgClassName?: string;
    showBadges?: boolean;
}

export function ExerciseMotionViewer({
    githubId,
    exerciseName,
    activationPct = 94,
    className = "",
    imgClassName = "",
    showBadges = false
}: ExerciseMotionViewerProps) {
    const [frame, setFrame] = useState<0 | 1>(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const resolvedId = getExerciseGitHubId(githubId || exerciseName);
    const frame0Url = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${resolvedId}/0.jpg`;
    const frame1Url = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${resolvedId}/1.jpg`;

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
        <div className={`relative w-full overflow-hidden flex items-center justify-center select-none ${className}`}>
            {!hasError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={currentImgUrl}
                    alt={`${exerciseName}`}
                    onError={() => setHasError(true)}
                    className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
                        isLoaded ? "opacity-100" : "opacity-40"
                    } ${imgClassName}`}
                />
            ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-zinc-500">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                        {exerciseName}
                    </span>
                    <span className="text-[10px] text-zinc-600">Demostración biomecánica</span>
                </div>
            )}

            {/* Badges opcionales (desactivados por defecto para máxima limpieza visual) */}
            {showBadges && !hasError && (
                <>
                    {/* Top-Left Translucent Activation Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-[10px] font-mono tracking-wider text-white pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span>ACTIVACIÓN: {activationPct}%</span>
                    </div>

                    {/* Bottom-Right Biomechanical Vector Indicator */}
                    <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-white/80 pointer-events-none" title="Vector de fuerza biomecánica">
                        <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                    </div>
                </>
            )}
        </div>
    );
}
