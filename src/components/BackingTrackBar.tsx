"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Upload, Repeat, Gauge, RotateCcw, Music } from "lucide-react";

interface BackingTrackBarProps {
  onTimeUpdateSec?: (currentTime: number) => void;
}

export default function BackingTrackBar({ onTimeUpdateSec }: BackingTrackBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string>("Sin pista MP3 cargada");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Estado del Loop A-B para ensayar coros difíciles
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setTrackName(file.name.replace(/\.[^/.]+$/, ""));
    setIsPlaying(false);
    setLoopA(null);
    setLoopB(null);
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.preservesPitch = true;
      audioRef.current.playbackRate = rate;
    }
  };

  const handleSetLoopPoint = () => {
    if (!audioRef.current) return;
    const now = audioRef.current.currentTime;
    if (loopA === null) {
      setLoopA(now);
    } else if (loopB === null && now > loopA + 1) {
      setLoopB(now);
    } else {
      setLoopA(null);
      setLoopB(null);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      if (onTimeUpdateSec) onTimeUpdateSec(t);

      if (loopA !== null && loopB !== null && t >= loopB) {
        audio.currentTime = loopA;
      }
    };

    const handleLoaded = () => {
      setDuration(audio.duration || 0);
      audio.preservesPitch = true;
    };

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("loadedmetadata", handleLoaded);
    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("loadedmetadata", handleLoaded);
    };
  }, [loopA, loopB, onTimeUpdateSec]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="apple-glass rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 border border-white/10">
      <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlaying(false)} />

      {/* Subir Pista + Play/Pause */}
      <div className="flex items-center gap-2.5 min-w-0">
        <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5 shrink-0 border border-white/10 transition">
          <Upload className="w-3.5 h-3.5 text-[#0A84FF]" />
          <span>Cargar Pista MP3</span>
          <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
        </label>

        {audioUrl && (
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-xl bg-[#30D158] text-black font-bold shadow-[0_0_15px_rgba(48,209,88,0.4)] shrink-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
        )}

        <div className="truncate">
          <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{trackName}</span>
          </div>
          {audioUrl && (
            <div className="text-[10px] font-mono text-zinc-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          )}
        </div>
      </div>

      {/* Controles de Práctica Vocal: Loop A-B y Velocidad sin alterar el tono */}
      {audioUrl && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrentTime(val);
              if (audioRef.current) audioRef.current.currentTime = val;
            }}
            className="w-28 sm:w-36 accent-[#0A84FF] cursor-pointer"
          />

          {/* Botón Loop A-B para repetir coros */}
          <button
            onClick={handleSetLoopPoint}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
              loopA !== null && loopB !== null
                ? "bg-[#BF5AF2] text-white border-[#BF5AF2] shadow-[0_0_15px_rgba(191,90,242,0.4)]"
                : loopA !== null
                ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                : "bg-white/10 text-zinc-300 border-white/10 hover:bg-white/15"
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>
              {loopA === null
                ? "Marcar Loop A"
                : loopB === null
                ? `A (${formatTime(loopA)}) → Marcar B`
                : `Loop ${formatTime(loopA)}-${formatTime(loopB)}`}
            </span>
          </button>

          {/* Selector de Velocidad Pitch-Preserved */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
            <Gauge className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            {[0.75, 0.85, 1.0].map((rate) => (
              <button
                key={rate}
                onClick={() => changeSpeed(rate)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  playbackRate === rate ? "bg-[#0A84FF] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = 0;
            }}
            className="p-1.5 rounded-xl bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
            title="Reiniciar pista"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
