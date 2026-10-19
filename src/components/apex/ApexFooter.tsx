'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Activity, Shield, Zap, Sparkles, Download } from 'lucide-react';

export function ApexFooter() {
  return (
    <footer className="mt-16 border-t border-white/[0.08] bg-[#000000] text-zinc-400 py-12 px-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Main Footer Block */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#111111] shrink-0 shadow-lg shadow-red-950/20">
              <Image
                src="/apex-logo.png"
                alt="APEX OS"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-[#FF2A2A] uppercase">
                  APEX // HYPERTROPHY OS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                  v2.4 STABLE
                </span>
              </div>
              <p className="text-sm text-zinc-300 font-medium mt-0.5">
                Autopilot de Hipertrofia Científica, Telemetría 3D y Nutrición Clínica
              </p>
            </div>
          </div>

          {/* Core System Telemetry Status */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-zinc-300">OFFLINE-FIRST (DEXIE)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              <span className="text-zinc-300">GITHUB MOTION DB</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A]" />
              <span className="text-zinc-300">TONE.JS SONAR</span>
            </div>
          </div>
        </div>

        {/* Technical Architectural Notes & Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5">
            <h5 className="font-mono text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#FF2A2A]" />
              BIOMECÁNICA SIN MOCKS
            </h5>
            <p className="text-zinc-500 leading-relaxed font-mono text-[11px]">
              Secuencias motoras de 800ms interpoladas en tiempo real desde el repositorio open source <code className="text-zinc-400">free-exercise-db</code> con vectores de fuerza SVG dinámicos.
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-mono text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#38BDF8]" />
              PERSISTENCIA & ACCESO
            </h5>
            <p className="text-zinc-500 leading-relaxed font-mono text-[11px]">
              Almacenamiento IndexedDB nativo con sincronización no bloqueante a Supabase. Compatible con instalación PWA completa en iOS y Android.
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-mono text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              NUTRICIÓN ADAPTATIVA
            </h5>
            <p className="text-zinc-500 leading-relaxed font-mono text-[11px]">
              Metabolismo basal Katch-McArdle / Mifflin-St Jeor calibrado con déficit dinámico y recálculo de compensación por desvíos alimenticios con Gemini AI.
            </p>
          </div>
        </div>

        {/* Bottom Credits & Quick Links */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} APEX OS // Una iniciativa de ingeniería de <Link href="/" className="text-zinc-300 hover:text-white transition-colors underline underline-offset-4">Loya Creative Lab</Link>.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/apex" className="hover:text-white transition-colors">OS Dashboard</Link>
            <span>•</span>
            <Link href="/nutrition" className="hover:text-white transition-colors">Nutrición & Compras</Link>
            <span>•</span>
            <button
              onClick={() => {
                localStorage.removeItem('apex_user_profile');
                window.location.reload();
              }}
              className="hover:text-[#FF2A2A] transition-colors"
            >
              Recalibrar Perfil
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
