"use client";

import React, { useState, useRef, useEffect } from "react";
import { PitchData } from "@/lib/vocalEngine";
import { persistTake, loadSavedTakes, removeTake, AcapellaTakeRecord } from "@/lib/acapella-supabase";
import { Disc, Square, Trash2, CheckCircle, Sparkles, Clock, Bot, Loader2 } from "lucide-react";

interface SessionRecorderViewProps {
  currentPitch: PitchData | null;
  mediaStream: MediaStream | null;
  isListening: boolean;
  onToggleMic: () => void;
}

export default function SessionRecorderView({
  currentPitch,
  mediaStream,
  isListening,
  onToggleMic,
}: SessionRecorderViewProps) {
  const [takes, setTakes] = useState<AcapellaTakeRecord[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [takeTitle, setTakeTitle] = useState<string>("Coro - Lamento Boliviano");
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [analyzingTakeId, setAnalyzingTakeId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const accuracySamplesRef = useRef<number[]>([]);
  const notesCountRef = useRef<Record<string, number>>({});
  const startTimeRef = useRef<number>(0);

  // Cargar tomas previas de Supabase / LocalStorage
  useEffect(() => {
    loadSavedTakes().then((saved) => {
      if (saved && saved.length > 0) {
        setTakes(saved);
      }
    });
  }, []);

  // Recolectar métricas de afinación mientras está grabando la toma
  useEffect(() => {
    if (!isRecording || !currentPitch || currentPitch.clarity < 0.7) return;
    const sampleScore = Math.max(0, 100 - Math.abs(currentPitch.cents) * 1.8);
    accuracySamplesRef.current.push(sampleScore);
    notesCountRef.current[currentPitch.noteName] =
      (notesCountRef.current[currentPitch.noteName] || 0) + 1;
  }, [currentPitch, isRecording]);

  // Cronómetro de grabación
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecordingTake = async () => {
    let stream = mediaStream;
    if (!stream) {
      onToggleMic();
      return;
    }

    chunksRef.current = [];
    accuracySamplesRef.current = [];
    notesCountRef.current = {};
    startTimeRef.current = Date.now();

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      const samples = accuracySamplesRef.current;
      const avgAccuracy =
        samples.length > 0
          ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
          : 85;

      let dominantNote = "E3";
      let maxCount = 0;
      Object.entries(notesCountRef.current).forEach(([note, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantNote = note;
        }
      });

      const newTake: AcapellaTakeRecord = {
        id: `take-${Date.now()}`,
        title: takeTitle || `Toma Vocal #${takes.length + 1}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        durationSec,
        avgAccuracy,
        dominantNote,
        audioUrl: url,
      };

      setTakes((prev) => [newTake, ...prev]);
      // Sincronizar con Supabase y memoria persistente
      await persistTake(newTake);
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecordingTake = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleDeleteTake = async (id: string) => {
    setTakes((prev) => prev.filter((t) => t.id !== id));
    await removeTake(id);
  };

  // Análisis inteligente con Gemini AI
  const handleAnalyzeWithAI = async (take: AcapellaTakeRecord) => {
    setAnalyzingTakeId(take.id);
    try {
      const res = await fetch("/api/acapella/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze-take",
          payload: {
            title: take.title,
            durationSec: take.durationSec,
            avgAccuracy: take.avgAccuracy,
            dominantNote: take.dominantNote,
          },
        }),
      });
      const data = await res.json();
      const diagnosis = data.result || "Toma registrada exitosamente. Buen balance armónico.";

      const updatedTake = { ...take, aiDiagnosis: diagnosis };
      setTakes((prev) => prev.map((t) => (t.id === take.id ? updatedTake : t)));
      await persistTake(updatedTake);
    } catch (err) {
      console.error("Error analizando con Gemini:", err);
    } finally {
      setAnalyzingTakeId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Panel Izquierdo: Grabadora en Vivo */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="apple-glass rounded-3xl p-5 sm:p-7 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Grabadora de Bitácora Vocal
            </span>
            {isRecording && (
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                REC 00:{recordingSeconds.toString().padStart(2, "0")}
              </span>
            )}
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-2">Etiqueta de la toma o ejercicio:</label>
            <input
              type="text"
              value={takeTitle}
              onChange={(e) => setTakeTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-[#0A84FF]"
              placeholder="Ej. Coro Lamento Boliviano - Toma 1"
            />
          </div>

          {!isListening ? (
            <button
              onClick={onToggleMic}
              className="w-full py-4 rounded-2xl bg-[#0A84FF] text-white font-semibold text-sm shadow-[0_0_25px_rgba(10,132,255,0.4)] cursor-pointer hover:bg-[#0070E0] transition"
            >
              Activar Micrófono Primero para Grabar
            </button>
          ) : (
            <button
              onClick={isRecording ? stopRecordingTake : startRecordingTake}
              className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isRecording
                  ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:brightness-95"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.45)]"
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 fill-current" /> Finalizar y Evaluar Toma
                </>
              ) : (
                <>
                  <Disc className="w-5 h-5" /> Grabar Toma con Evaluación de Pitch
                </>
              )}
            </button>
          )}

          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-zinc-400 leading-relaxed">
            <strong className="text-white block mb-1">¿Cómo funciona el Comparador A/B?</strong>
            Mientras grabas, el motor mide tu desviación en cents a 60 muestras por segundo y guarda tu <strong>% de Afinación</strong> en Supabase junto con el audio para que compares tu primera toma contra la última con feedback de Gemini IA.
          </div>
        </div>
      </div>

      {/* Panel Derecho: Historial de Tomas A/B */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="apple-glass rounded-3xl p-5 sm:p-7 min-h-[420px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#30D158]" />
                Tomas Grabadas en esta Sesión ({takes.length})
              </h2>
              <p className="text-xs text-zinc-400">Escucha y compara tu progreso vocal sincronizado</p>
            </div>
          </div>

          {takes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4 border border-dashed border-white/10 rounded-2xl">
              <Disc className="w-10 h-10 text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-300">Aún no hay tomas en esta sesión</p>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Graba un fragmento de tu calentamiento o del coro de tu canción para comparar tu afinación y timbre.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {takes.map((take, index) => (
                <div
                  key={take.id}
                  className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-zinc-300">
                          #{takes.length - index}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{take.title}</h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {take.timestamp} ({take.durationSec}s)
                        </span>
                        <span>•</span>
                        <span>Centro tonal: <strong className="text-zinc-200">{take.dominantNote}</strong></span>
                        <span>•</span>
                        <span className="text-[#30D158] font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {take.avgAccuracy}% Afinación
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      {take.audioUrl && (
                        <audio controls src={take.audioUrl} className="h-9 max-w-[200px]" />
                      )}
                      
                      {/* Botón de análisis con Gemini */}
                      <button
                        onClick={() => handleAnalyzeWithAI(take)}
                        disabled={analyzingTakeId === take.id}
                        className="px-3 py-1.5 rounded-xl bg-[#BF5AF2]/20 hover:bg-[#BF5AF2]/30 text-[#BF5AF2] border border-[#BF5AF2]/40 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        title="Analizar esta toma con Gemini Vocal Coach"
                      >
                        {analyzingTakeId === take.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Bot className="w-3.5 h-3.5" />
                        )}
                        <span>{take.aiDiagnosis ? "Re-analizar" : "Coach IA"}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTake(take.id)}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                        title="Eliminar toma"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Diagnóstico de Gemini Coach si existe */}
                  {take.aiDiagnosis && (
                    <div className="mt-1 p-3.5 rounded-xl bg-purple-950/25 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
                      <Bot className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="text-white block mb-1">Feedback de Gemini Vocal Coach:</strong>
                        <div className="whitespace-pre-line text-zinc-300 font-sans">{take.aiDiagnosis}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
