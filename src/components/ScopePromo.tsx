"use client";

import Image from "next/image";
import Link from "next/link";
import { Usb, ZoomIn, Share2, ArrowRight } from "lucide-react";

export default function ScopePromo() {
  return (
    <section
      id="scope-project"
      className="relative py-24 px-4 bg-[#050709] overflow-hidden border-t border-b border-white/5"
    >
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="flex justify-center mb-2">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-emerald-400/40 bg-black/60 shadow-2xl shadow-emerald-500/20 flex items-center justify-center">
              <Image
                src="/scope-icon.png"
                alt="Loya Scope USB-C Optical Viewer Logo"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300 text-xs font-mono tracking-widest uppercase">
            LAB 04 // USB-C UVC OPTICAL TELEMETRY & IMAGING
          </div>

          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Loya Scope <span className="text-zinc-400 font-light">· USB-C Optical Viewer</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-400 font-normal leading-relaxed">
            Visor óptico de baja latencia para cámaras externas <strong>USB-C / UVC</strong>, microscopios y endoscopios de inspección. Captura fotografías en alta resolución, graba video con zoom digital en vivo y guarda directamente en el carrete del teléfono.
          </p>
        </div>

        {/* Hero Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
          {/* Left: Key Pillars */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 bg-[#0B0E13] border border-white/10 rounded-2xl hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Usb size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Detección Plug-and-Play por USB-C (UVC)
                </h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                Enumeración dinámica de dispositivos WebRTC con conmutación automática al conectar cámaras externas USB-C en celulares o computadoras.
              </p>
            </div>

            <div className="p-6 bg-[#0B0E13] border border-white/10 rounded-2xl hover:border-teal-500/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <ZoomIn size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Zoom Táctil 1x–8x, Paneo, Rotación 90° y Retícula
                </h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                Pellizca la pantalla para acercar hasta 8x, arrastra el encuadre, congela fotogramas y procesa el zoom en tiempo real sobre el canvas de captura.
              </p>
            </div>

            <div className="p-6 bg-[#0B0E13] border border-white/10 rounded-2xl hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Share2 size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Foto, Video MP4 y Guardado Directo en el Carrete
                </h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                Integración nativa con Web Share API para enviar fotos y videos capturados directamente a la app Fotos de iOS y Android con un toque.
              </p>
            </div>
          </div>

          {/* Right: Interactive CTA Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#11171D] to-[#080B0E] border border-emerald-500/20 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-gray-400 border-b border-white/5 pb-3">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> VISOR USB-C ACTIVO
                </span>
                <span>PWA • iOS & ANDROID</span>
              </div>

              <h4 className="text-2xl font-black text-white tracking-tight">
                Abre el visor óptico USB-C
              </h4>

              <p className="text-xs sm:text-sm text-gray-400 font-mono leading-relaxed">
                Conecta tu cámara USB-C al celular, haz zoom táctil en tiempo real y guarda fotos o videos directo en tu carrete.
              </p>

              <div className="pt-4">
                <Link
                  href="/scope"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-bold text-zinc-950 shadow-xl shadow-emerald-500/10 transition-all hover:bg-emerald-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Abrir Loya Scope App</span>
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
