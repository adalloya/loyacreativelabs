// src/components/studio/TapToSyncModal.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { StudioSong, LyricLine, parsePlainLyrics } from "@/lib/musicUtils";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Volume2,
} from "lucide-react";

interface TapToSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: StudioSong | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSaveLyrics: (lyrics: LyricLine[]) => void;
}

export const TapToSyncModal: React.FC<TapToSyncModalProps> = ({
  isOpen,
  onClose,
  song,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onSaveLyrics,
}) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [tapCursor, setTapCursor] = useState<number>(0);
  const [isEditingRaw, setIsEditingRaw] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>("");
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (song) {
      setLyrics(song.lyrics || []);
      // Apuntar al primer verso sin tiempo o al primero
      const firstUnsynced = song.lyrics.findIndex((l) => l.time === null);
      setTapCursor(firstUnsynced >= 0 ? firstUnsynced : 0);
      setRawText(song.lyrics.map((l) => l.text).join("\n"));
    }
  }, [song, isOpen]);

  const stampCurrentLine = useCallback(() => {
    if (lyrics.length === 0) return;

    const stampedTime = Number(currentTime.toFixed(2));
    setLyrics((prev) => {
      const updated = prev.map((line, idx) =>
        idx === tapCursor ? { ...line, time: stampedTime } : line
      );
      return updated;
    });

    const nextCursor = Math.min(lyrics.length - 1, tapCursor + 1);
    setTapCursor(nextCursor);
    lineRefs.current[nextCursor]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentTime, lyrics.length, tapCursor]);

  // Manejo de la barra espaciadora para estampar
  useEffect(() => {
    if (!isOpen || isEditingRaw) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (!isPlaying) {
          onTogglePlay();
        }
        stampCurrentLine();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isEditingRaw, isPlaying, onTogglePlay, stampCurrentLine]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00.0";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${ms}`;
  };

  const handleApplyRawText = () => {
    if (!rawText.trim()) return;
    const parsed = parsePlainLyrics(rawText);
    setLyrics(parsed);
    setTapCursor(0);
    setIsEditingRaw(false);
  };

  const handleResetTimestamps = () => {
    setLyrics((prev) => prev.map((l) => ({ ...l, time: null })));
    setTapCursor(0);
  };

  const handleAdjustTime = (idx: number, delta: number) => {
    setLyrics((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const current = l.time ?? currentTime;
        return { ...l, time: Math.max(0, Number((current + delta).toFixed(2))) };
      })
    );
  };

  const handleSave = () => {
    onSaveLyrics(lyrics);
    onClose();
  };

  const syncedCount = lyrics.filter((l) => l.time !== null).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      <div className="w-full max-w-3xl bg-[#0F111A] border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* HEADER */}
        <div className="px-5 py-4 bg-[#141724] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#30D158] shrink-0">
              <Timer size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                Modo Tap-to-Sync: {song?.title || "Sincronizar Letra"}
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                {syncedCount} de {lyrics.length} versos marcados • Tiempo:{" "}
                <span className="text-emerald-400 font-bold">{formatTime(currentTime)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingRaw(!isEditingRaw)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition ${
                isEditingRaw
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-white/[0.04] text-zinc-300 hover:text-white border-white/10"
              }`}
            >
              <FileText size={13} />
              <span>{isEditingRaw ? "Ver Lista" : "Editar Letra"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition border border-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* CONTROLES DE TRANSPORTE Y BOTÓN DE ESTAMPADO */}
        <div className="p-4 bg-[#090A0F] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={onTogglePlay}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition shadow-md ${
                isPlaying
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
              <span>{isPlaying ? "Pausar" : "Reproducir Audio"}</span>
            </button>

            {/* Reiniciar marcas */}
            <button
              type="button"
              onClick={handleResetTimestamps}
              className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1.5 transition"
              title="Borrar todos los tiempos y empezar de cero"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reiniciar Tiempos</span>
            </button>
          </div>

          {/* BOTÓN PRINCIPAL DE ESTAMPAR VERSO */}
          <button
            type="button"
            onClick={() => {
              if (!isPlaying) onTogglePlay();
              stampCurrentLine();
            }}
            className="px-6 py-2.5 rounded-2xl bg-[#30D158] hover:bg-[#28b84d] text-black font-extrabold text-xs sm:text-sm font-mono transition shadow-[0_0_25px_rgba(48,209,88,0.4)] active:scale-95 flex items-center gap-2"
          >
            <Timer size={16} />
            <span>Estampar Verso [Espacio]</span>
            <span className="bg-black/20 text-black px-2 py-0.5 rounded-lg text-xs font-bold">
              {formatTime(currentTime)}
            </span>
          </button>
        </div>

        {/* CUERPO CENTRAL */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isEditingRaw ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Pega la letra completa aquí (un renglón por verso). Al aplicar se limpiarán los tiempos para que los sincronices con la canción:
              </p>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={14}
                className="w-full bg-black/60 border border-white/15 rounded-2xl p-4 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 leading-relaxed"
                placeholder="Pega la letra aquí..."
              />
              <button
                type="button"
                onClick={handleApplyRawText}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs font-mono transition"
              >
                Aplicar Letra a Lista de Sincronización
              </button>
            </div>
          ) : lyrics.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <FileText size={36} className="text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">No hay líneas de letra cargadas en esta canción.</p>
              <button
                type="button"
                onClick={() => setIsEditingRaw(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition"
              >
                Pegar Letra Ahora
              </button>
            </div>
          ) : (
            lyrics.map((line, idx) => {
              const isTarget = idx === tapCursor;
              const hasTime = line.time !== null;

              return (
                <div
                  key={line.id}
                  ref={(el) => {
                    lineRefs.current[idx] = el;
                  }}
                  onClick={() => setTapCursor(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isTarget
                      ? "bg-[#30D158]/15 border-[#30D158] shadow-[0_0_20px_rgba(48,209,88,0.25)] scale-[1.01]"
                      : hasTime
                      ? "bg-black/40 border-white/10 hover:border-white/20"
                      : "bg-black/20 border-white/5 opacity-50 hover:opacity-80"
                  }`}
                >
                  {/* Número y Texto */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-[10px] font-mono w-6 shrink-0 ${
                        isTarget ? "text-[#30D158] font-bold" : "text-zinc-500"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span
                      className={`text-xs truncate ${
                        isTarget ? "text-white font-bold text-sm" : "text-zinc-200"
                      }`}
                    >
                      {line.text}
                    </span>
                  </div>

                  {/* Acciones y Tiempo */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Botón de reproducción de prueba para esta línea */}
                    {hasTime && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (line.time !== null) onSeek(line.time);
                          if (!isPlaying) onTogglePlay();
                        }}
                        className="p-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition"
                        title="Escuchar desde este punto"
                      >
                        <Volume2 size={12} />
                      </button>
                    )}

                    {/* Micro-ajustes */}
                    {hasTime && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustTime(idx, -0.2);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white"
                          title="-0.2 segundos"
                        >
                          -0.2
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustTime(idx, +0.2);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white"
                          title="+0.2 segundos"
                        >
                          +0.2
                        </button>
                      </div>
                    )}

                    {/* Badge de tiempo */}
                    <span
                      className={`text-xs font-mono px-2.5 py-1 rounded-xl font-bold ${
                        isTarget
                          ? "bg-[#30D158] text-black"
                          : hasTime
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/[0.04] text-zinc-600"
                      }`}
                    >
                      {hasTime ? formatTime(line.time!) : "--:--.-"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER: GUARDAR CAMBIOS */}
        <div className="p-4 bg-[#141724] border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] font-mono text-zinc-400">
            Consejo: Presiona la tecla <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Espacio</kbd> al ritmo de cada verso.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 transition shadow-lg"
            >
              <Check size={14} />
              <span>Guardar Sincronización</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TapToSyncModal;
