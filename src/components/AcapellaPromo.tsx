"use client";

import Link from "next/link";
import { Waves, Sparkles, Activity, Music, ArrowRight, Disc, Mic, CheckCircle2 } from "lucide-react";

export default function AcapellaPromo() {
  return (
    <section id="acapella-project" className="relative py-24 px-4 bg-[#040508] overflow-hidden border-t border-b border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="flex justify-center mb-2">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-blue-400/30 bg-gradient-to-tr from-[#0A84FF] via-[#BF5AF2] to-[#30D158] shadow-2xl shadow-blue-500/20 flex items-center justify-center">
              <Waves className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/40 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold tracking-widest uppercase">
            <Sparkles size={14} className="text-[#BF5AF2]" /> NUEVA SECCIÓN INDEPENDIENTE // VOXSTUDIO PRO
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            VoxStudio Pro <span className="bg-gradient-to-r from-[#0A84FF] via-[#BF5AF2] to-[#30D158] bg-clip-text text-transparent">· Vocal Suite</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-400 font-normal leading-relaxed">
            Suite de entrenamiento vocal profesional inspirada en el lenguaje <strong>Apple Liquid Glass</strong> (iOS 18 / visionOS). Afinación continua por autocorrelación <strong>McLeod (NSDF)</strong>, teleprompter tipo <strong>Apple Music Sing</strong> con catálogo abierto <strong>LRCLIB</strong> y coach vocal inteligente potenciado por <strong>Gemini IA & Supabase</strong>.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
          {/* Left: Key Pillars */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 bg-[#0B0C10] border border-white/10 rounded-2xl hover:border-blue-500/40 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#0A84FF]">
                  <Activity size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Monitor Neural de Afinación a 60 FPS (McLeod NSDF)</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                Detección espectral de voz en tiempo real con interpolación parabólica y rechazo armónico de saltos de octava. Visualizador Piano Roll en Canvas 60 FPS y reto de estabilidad de sostenimiento de 5 segundos.
              </p>
            </div>

            <div className="p-6 bg-[#0B0C10] border border-white/10 rounded-2xl hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#BF5AF2]">
                  <Music size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Teleprompter Apple Music Sing + Motor LRCLIB</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                Auto-scroll sincronizado verso por verso conectado al catálogo abierto de más de 3M de canciones de LRCLIB. Importador de mapas vocales UltraStar (.TXT) y cifrados ChordPro con marcas diafragmáticas de respiración.
              </p>
            </div>

            <div className="p-6 bg-[#0B0C10] border border-white/10 rounded-2xl hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#30D158]">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Vocal Coach IA (Gemini) & Supabase Cloud Sync</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                Grabadora de tomas A/B que calcula tu porcentaje medio de afinación en tiempo real. Evaluación anatómica y ejercicios correctivos generados por Gemini IA con sincronización persistente en Supabase.
              </p>
            </div>
          </div>

          {/* Right: Glass Interactive Card Preview */}
          <div className="lg:col-span-5">
            <div className="apple-glass rounded-3xl p-7 border border-white/15 relative overflow-hidden flex flex-col gap-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-pulse shadow-[0_0_8px_#30D158]" />
                  <span className="text-xs font-mono uppercase text-zinc-300">Live Vocal Telemetry</span>
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Mobile-First iOS 18
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Nota en Vivo</div>
                  <div className="text-4xl font-black text-white font-mono flex items-baseline gap-1 mt-0.5">
                    <span className="text-[#30D158]">E</span>
                    <span className="text-xl text-zinc-400">3</span>
                    <span className="text-xs text-[#30D158] font-normal ml-2">0 cents</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40 shadow-[0_0_15px_rgba(48,209,88,0.3)]">
                  <Mic size={22} />
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#30D158] shrink-0" />
                  <span>Sintetizador Web Audio API puro con afinación Rhodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#30D158] shrink-0" />
                  <span>Secuenciador de escalas y vocalizaciones con BPM</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#30D158] shrink-0" />
                  <span>Bottom Tab Bar flotante optimizada para una sola mano</span>
                </div>
              </div>

              <Link
                href="/acapella"
                className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-[#0A84FF] via-[#BF5AF2] to-[#30D158] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(10,132,255,0.4)] hover:brightness-110 active:scale-95 transition-all"
              >
                <span>Abrir VoxStudio Pro</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
