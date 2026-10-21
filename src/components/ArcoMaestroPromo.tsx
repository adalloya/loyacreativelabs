"use client";

import Link from "next/link";
import { Zap, Wrench, Shield, Sparkles, ArrowRight, Flame, Music, Cpu } from "lucide-react";

export default function ArcoMaestroPromo() {
  return (
    <section id="arco-maestro-project" className="relative py-24 px-4 bg-[#060709] overflow-hidden border-t border-b border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-yellow-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="flex justify-center mb-2">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-yellow-400/30 bg-gradient-to-br from-yellow-400/20 to-black flex items-center justify-center shadow-2xl shadow-yellow-950/40">
              <Flame className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-950/40 border border-yellow-500/30 text-yellow-400 text-xs font-mono font-bold tracking-widest uppercase">
            <Zap size={14} className="fill-yellow-400" /> NUEVA SECCIÓN INDEPENDIENTE // ARCO MAESTRO
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Arco Maestro <span className="text-yellow-400">· AI Welding</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-400 font-normal leading-relaxed">
            Plataforma especializada en ingeniería de costos, optimización de cortes de perfiles de 6m, escáner estructural por fotografía con <strong>Gemini Vision</strong> y academia viva para herrería residencial en <strong>Mérida, Yucatán</strong>.
          </p>
        </div>

        {/* Hero Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
          {/* Left: Key Pillars */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 bg-[#0D0E12] border border-white/10 rounded-2xl hover:border-yellow-500/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                  <Cpu size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Optimizador 1D (Bin Packing) & Especificación Mérida</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                Cálculo de tramos estándar de 6.00 metros con descuento kerf de 3mm, minimización de desperdicio y costeo automático de protección anticorrosiva para alta humedad y salitre.
              </p>
            </div>

            <div className="p-6 bg-[#0D0E12] border border-white/10 rounded-2xl hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Escáner de Estructuras & OCR de Tickets con Gemini Vision</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                Fotografía cualquier plano o ticket de ferretería para obtener despieces automáticos, esquemas ASCII, balance de aportación entre socios y guardado directo en Supabase.
              </p>
            </div>

            <div className="p-6 bg-[#0D0E12] border border-white/10 rounded-2xl hover:border-orange-500/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Wrench size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Academia de Taller (14 Clases) & Stream de Spotify</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                Manual interactivo de calibres y electrodos AWS (E6013, E6011, E7018), diagnóstico de defectos y reproductor musical integrado para soldar en el taller.
              </p>
            </div>
          </div>

          {/* Right: Interactive CTA Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#14151B] to-[#0A0B0E] border border-yellow-500/20 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-gray-400 border-b border-white/5 pb-3">
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /> PROYECTO INDEPENDIENTE
                </span>
                <span>PWA • iOS & ANDROID</span>
              </div>

              <h4 className="text-2xl font-black text-white tracking-tight">
                Accede a la herramienta de taller
              </h4>

              <p className="text-xs sm:text-sm text-gray-400 font-mono leading-relaxed">
                Diseñada con estética Apple Glass para usarse con guantes y bajo el sol de Mérida. Selección de operador Adal / Marco, cotizaciones inmediatas y biblioteca de planos open source.
              </p>

              <div className="pt-4">
                <Link
                  href="/arco-maestro"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 text-sm font-bold text-zinc-950 shadow-xl shadow-yellow-500/10 transition-all hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Abrir Arco Maestro App</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
