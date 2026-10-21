'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSpotifyPlayback } from '@/hooks/useSpotifyPlayback';
import { useApexFx } from '@/hooks/useApexFx';

export function ApexFooter() {
  const footerRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isZenActive, setIsZenActive] = useState(false);
  const zenTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isPlaying } = useSpotifyPlayback();
  const { isFxActive, visualizerMode } = useApexFx();

  // 1. Detectar cuando el scroll del usuario llega al footer ("este lugar")
  useEffect(() => {
    const el = footerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Temporizador de 3 segundos para activar el Modo Zen (desaparecer texto)
  useEffect(() => {
    // Requisitos: Footer en pantalla + Música reproduciendo + Efecto Three.js activo
    const shouldStartTimer = isInView && isPlaying && isFxActive && visualizerMode !== 'OFF';

    if (zenTimerRef.current) {
      clearTimeout(zenTimerRef.current);
      zenTimerRef.current = null;
    }

    if (shouldStartTimer) {
      zenTimerRef.current = setTimeout(() => {
        setIsZenActive(true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('apex:zen-mode', { detail: { active: true } }));
        }
      }, 3000);
    } else {
      setIsZenActive(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apex:zen-mode', { detail: { active: false } }));
      }
    }

    return () => {
      if (zenTimerRef.current) {
        clearTimeout(zenTimerRef.current);
      }
    };
  }, [isInView, isPlaying, isFxActive, visualizerMode]);

  // 3. Despertar / Restaurar texto si el usuario interactúa (toque, scroll, ratón o tecla)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserInteraction = () => {
      if (isZenActive) {
        setIsZenActive(false);
        window.dispatchEvent(new CustomEvent('apex:zen-mode', { detail: { active: false } }));
      }

      // Reiniciar la cuenta de 3 segundos si sigue en el footer con música y FX
      if (isInView && isPlaying && isFxActive && visualizerMode !== 'OFF') {
        if (zenTimerRef.current) clearTimeout(zenTimerRef.current);
        zenTimerRef.current = setTimeout(() => {
          setIsZenActive(true);
          window.dispatchEvent(new CustomEvent('apex:zen-mode', { detail: { active: true } }));
        }, 3000);
      }
    };

    window.addEventListener('scroll', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('mousemove', handleUserInteraction, { passive: true });
    window.addEventListener('mousedown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('mousedown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isZenActive, isInView, isPlaying, isFxActive, visualizerMode]);

  const handleWakeUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZenActive(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apex:zen-mode', { detail: { active: false } }));
    }
  };

  return (
    <>
      <footer
        ref={footerRef}
        className={`mt-16 border-t border-white/[0.08] bg-transparent text-zinc-400 py-12 px-4 font-sans relative z-10 transition-all duration-1000 ease-out ${
          isZenActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Main Footer Block */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
            {/* Logo & Brand Identity */}
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#111111] shrink-0 shadow-lg shadow-red-950/20">
                <Image
                  src="/apex-logo.png"
                  alt="APEX"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-widest text-[#FF2A2A] uppercase">
                    APEX
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
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="text-zinc-300">GITHUB MOTION DB</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A]" />
                <span className="text-zinc-300">TONE.JS SONAR</span>
              </div>
            </div>
          </div>

          {/* Bottom Credits & Quick Links */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
            <div>
              &copy; {new Date().getFullYear()} APEX // Una iniciativa de ingeniería de <Link href="/" className="text-zinc-300 hover:text-white transition-colors underline underline-offset-4">Loya Creative Lab</Link>.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/apex" className="hover:text-white transition-colors">APEX Dashboard</Link>
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

      {/* Indicador sutil de Modo Zen Inmersivo */}
      {isZenActive && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-in fade-in duration-500">
          <button
            type="button"
            onClick={handleWakeUp}
            className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white/80 hover:text-white text-[10px] font-mono flex items-center gap-2 shadow-2xl transition-all active:scale-95 cursor-pointer"
            title="Toca para mostrar el texto nuevamente"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span className="tracking-wide">APEX 3D VISUAL • TOCA PARA RESTAURAR</span>
          </button>
        </div>
      )}
    </>
  );
}
