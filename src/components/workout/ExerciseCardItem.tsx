// src/components/workout/ExerciseCardItem.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export function ExerciseCardItem({ exercise }: { exercise: any }) {
  const [frameIndex, setFrameIndex] = useState(0);

  // Animación secuencial alterna usando el repositorio de GitHub free-exercise-db
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev === 0 ? 1 : 0));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  // Generar link de búsqueda directa optimizada en YouTube para el ejercicio
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.name + ' form technique hypertrophy'
  )}`;

  const exerciseId = exercise.github_id || exercise.id || 'Barbell_Bench_Press_-_Medium_Grip';

  return (
    <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 mb-4 text-white">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Columna Izquierda: Visor Biomecánico de GitHub */}
        <div className="w-full md:w-48 h-44 bg-black/60 rounded-2xl border border-white/10 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${exerciseId}/${frameIndex}.jpg`}
            alt={exercise.name}
            className="w-full h-full object-cover grayscale contrast-125 brightness-90"
            onError={(e) => {
              // Fallback si el ID no tiene imagen exacta en el repo
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono text-zinc-300">
            ACTIVACIÓN: {exercise.activation_pct || 94}%
          </div>
        </div>

        {/* Columna Derecha: Detalles, Tooltips y Video de YouTube */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 bg-white/[0.06] text-zinc-300 rounded uppercase">
                  {exercise.anatomicalSubdivision || exercise.anatomical_subdivision}
                </span>
                <span className="text-[10px] font-mono text-[#FF2A2A] uppercase font-bold">
                  TIER {exercise.hypertrophyTier || exercise.hypertrophy_tier}
                </span>
              </div>

              {/* Botón de YouTube para ver cómo se hace */}
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-1.5 rounded-xl transition-all text-zinc-200 hover:text-white"
              >
                <Play className="w-3 h-3 fill-white text-white" />
                Ver en YouTube
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>

            <h3 className="text-lg font-semibold tracking-tight mt-2 flex items-center">
              {exercise.name}
              <Tooltip text="Seleccionado por su perfil de resistencia óptimo para generar tensión mecánica en fase de estiramiento." />
            </h3>

            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {exercise.biomechanicalCue || exercise.biomechanical_cue}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-between items-center text-xs font-mono text-zinc-400">
            <span>PREDICCIÓN: {exercise.default_sets || 3} SERIES × {exercise.rep_range_min || 8}-{exercise.rep_range_max || 12} REPS</span>
            <span className="text-emerald-400">RIR 1 (1-2 EN RESERVA)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
