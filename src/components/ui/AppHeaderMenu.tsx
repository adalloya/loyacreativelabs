// src/components/ui/AppHeaderMenu.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Menu, X, Download, Shield, RefreshCw, Zap, Music, Sparkles, Layers, Flame, Sun, Moon } from 'lucide-react';
import { DownloadPDFButton } from '@/components/pdf/DownloadPDFButton';
import { getInitialTheme, setSiteTheme, Theme } from '@/lib/theme';

export function AppHeaderMenu({ 
  environmentMode, 
  onEnvironmentChange, 
  weightUnit = 'lbs',
  onWeightUnitChange,
  trainingMethodology = 'traditional',
  onTrainingMethodologyChange,
  onOpenRoutineImporter,
  onInstallClick, 
  showInstallButton,
  pdfProfile,
  pdfRoutine,
  pdfDiet,
  onResetProfile,
  readiness = 'normal',
  onReadinessChange,
  onOpenSpotifyModal,
  isSpotifyConnected = false
}: { 
  environmentMode: string;
  onEnvironmentChange: (mode: string) => void;
  weightUnit?: 'lbs' | 'kg';
  onWeightUnitChange?: (unit: 'lbs' | 'kg') => void;
  trainingMethodology?: 'traditional' | 'cycled_circuits';
  onTrainingMethodologyChange?: (methodology: 'traditional' | 'cycled_circuits') => void;
  onOpenRoutineImporter?: () => void;
  onInstallClick: () => void;
  showInstallButton: boolean;
  pdfProfile?: any;
  pdfRoutine?: any[];
  pdfDiet?: any;
  onResetProfile?: () => void;
  readiness?: string;
  onReadinessChange?: (readiness: any) => void;
  onOpenSpotifyModal?: () => void;
  isSpotifyConnected?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTheme(getInitialTheme());
    const handleThemeChange = (e: Event) => {
      const customEvt = e as CustomEvent<{ theme: Theme }>;
      if (customEvt.detail?.theme) {
        setTheme(customEvt.detail.theme);
      }
    };
    window.addEventListener('apex_theme_change', handleThemeChange);
    return () => window.removeEventListener('apex_theme_change', handleThemeChange);
  }, []);

  // Cerrar al hacer clic/tap fuera del menú o presionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && 
        !menuRef.current.contains(target) && 
        buttonRef.current && 
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    setSiteTheme(newTheme);
  };

  return (
    <div className="relative z-50">
      {/* Botón de tres rayitas (Hamburguesa) */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.1] hover:border-white/30 text-white p-2.5 rounded-2xl transition-all shadow-lg flex items-center justify-center active:scale-95"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú principal"}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Menú desplegable tipo iOS / Tesla */}
      {isOpen && (
        <>
          {/* Backdrop con blur para cerrar al hacer clic afuera */}
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" 
            onClick={() => setIsOpen(false)} 
            aria-hidden="true"
          />

          <div 
            ref={menuRef}
            className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 max-h-[88vh] overflow-y-auto bg-[#121214]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-5 shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2 duration-200 font-sans"
          >
            
            {/* Cabecera del Menú con Logo APEX y Cruz de Cierre */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="relative w-6 h-6 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0">
                  <Image
                    src="/apex-logo.png"
                    alt="APEX"
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-mono tracking-widest uppercase text-white font-bold">APEX</span>
                <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                  SISTEMA
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white border border-white/[0.08] flex items-center justify-center transition-all active:scale-90"
                title="Cerrar menú"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Apariencia del Sitio: Modo Oscuro vs Modo Claro */}
            <div className="mb-4 pb-4 border-b border-white/[0.08]">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 flex items-center justify-between">
                <span>APARIENCIA DEL SITIO</span>
                <span className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider font-bold bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">
                  {theme === 'dark' ? '🌙 OSCURO // DEFAULT' : '☀️ MODO CLARO'}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-2xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => handleToggleTheme('dark')}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                    theme === 'dark'
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold leading-none">Oscuro</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTheme('light')}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                    theme === 'light'
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold leading-none">Claro</span>
                </button>
              </div>
            </div>

            {/* Exportar Blueprint PDF */}
            {pdfProfile && (
              <div className="mb-4 pb-4 border-b border-white/[0.08]">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">
                  DOCUMENTO CLÍNICO & RUTINA
                </label>
                <div onClick={() => setIsOpen(false)}>
                  <DownloadPDFButton 
                    profile={pdfProfile} 
                    routine={pdfRoutine || []} 
                    diet={pdfDiet} 
                  />
                </div>
              </div>
            )}

            {/* Disposición del Atleta Hoy (Readiness) */}
            {onReadinessChange && (
              <div className="mb-4 pb-4 border-b border-white/[0.08]">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 flex items-center justify-between">
                  <span>DISPOSICIÓN HOY (READINESS)</span>
                  <span className="text-[#FF2A2A] text-[9px]">AUTORREGULACIÓN</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-2xl border border-white/[0.08]">
                  {[
                    { id: 'optimal', label: 'Óptimo', sub: 'RIR 1' },
                    { id: 'normal', label: 'Normal', sub: 'RIR 1-2' },
                    { id: 'fatigued', label: 'Fatigado', sub: '-5%' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onReadinessChange(item.id)}
                      className={`py-2 px-1 rounded-xl text-center transition-all ${
                        readiness === item.id
                          ? 'bg-white text-black font-semibold shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs leading-none">{item.label}</div>
                      <div className={`text-[9px] mt-0.5 ${readiness === item.id ? 'text-zinc-700' : 'text-zinc-500'}`}>
                        {item.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Unidad de Peso (LBS / KG) */}
            <div className="mb-4 pb-4 border-b border-white/[0.08]">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 flex items-center justify-between">
                <span>UNIDAD DE PESAS</span>
                <span className="text-white font-mono text-[9px] uppercase tracking-wider font-bold bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">
                  {weightUnit === 'lbs' ? 'LBS // DEFAULT' : 'KG // MÉTRICO'}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-2xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => onWeightUnitChange?.('lbs')}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all ${
                    weightUnit === 'lbs'
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs leading-none font-bold">LBS (Libras)</div>
                  <div className={`text-[9px] mt-0.5 ${weightUnit === 'lbs' ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    Barra 45 lbs
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onWeightUnitChange?.('kg')}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all ${
                    weightUnit === 'kg'
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs leading-none font-bold">KG (Kilos)</div>
                  <div className={`text-[9px] mt-0.5 ${weightUnit === 'kg' ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    Barra 20 kg
                  </div>
                </button>
              </div>
            </div>

            {/* Metodología de Entrenamiento */}
            {onTrainingMethodologyChange && (
              <div className="mb-4 pb-4 border-b border-white/[0.08]">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 flex items-center justify-between">
                  <span>METODOLOGÍA DE ENTRENAMIENTO</span>
                  <span className="text-[#FF2A2A] text-[9px] uppercase font-mono font-bold">
                    {trainingMethodology === 'cycled_circuits' ? 'CIRCUITOS & CICLADO' : 'HIPERTROFIA LINEAL'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-2xl border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => onTrainingMethodologyChange('traditional')}
                    className={`py-2 px-1.5 rounded-xl text-center transition-all ${
                      trainingMethodology === 'traditional'
                        ? 'bg-white text-black font-semibold shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs leading-none font-bold">Lineal Tradicional</div>
                    <div className={`text-[9px] mt-0.5 ${trainingMethodology === 'traditional' ? 'text-zinc-700' : 'text-zinc-500'}`}>
                      Series rectas & RIR
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTrainingMethodologyChange('cycled_circuits')}
                    className={`py-2 px-1.5 rounded-xl text-center transition-all ${
                      trainingMethodology === 'cycled_circuits'
                        ? 'bg-white text-black font-semibold shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs leading-none font-bold">Ciclado & Circuitos</div>
                    <div className={`text-[9px] mt-0.5 ${trainingMethodology === 'cycled_circuits' ? 'text-zinc-700' : 'text-zinc-500'}`}>
                      Bloques 3x & Ciclado Carb
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Botón de Importar Rutina en Texto Libre */}
            {onOpenRoutineImporter && (
              <div className="mb-4 pb-4 border-b border-white/[0.08]">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 flex items-center justify-between">
                  <span>RUTINA PERSONALIZADA</span>
                  <span className="text-[#10B981] text-[9px] font-mono">TEXT-TO-APEX</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenRoutineImporter();
                  }}
                  className="w-full bg-[#FF2A2A]/10 hover:bg-[#FF2A2A]/20 border border-[#FF2A2A]/30 text-white font-medium text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-between active:scale-95 group"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF2A2A]" />
                    <span className="font-bold">Importar Rutina (Texto a APEX)</span>
                  </div>
                  <Layers className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                </button>
              </div>
            )}

            {/* Spotify Integration Section */}
            {onOpenSpotifyModal && (
              <div className="mb-4 pb-4 border-b border-white/[0.08]">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 flex items-center justify-between">
                  <span>MÚSICA // SPOTIFY</span>
                  <span className={isSpotifyConnected ? "text-[#1DB954]" : "text-zinc-500"}>
                    {isSpotifyConnected ? "CONECTADO" : "SINCRONIZAR"}
                  </span>
                </label>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSpotifyModal();
                  }}
                  className="w-full bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/30 text-white font-medium text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-between active:scale-95 group"
                >
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-[#1DB954]" />
                    <span>{isSpotifyConnected ? "Control & Playlists (140 BPM)" : "Conectar Spotify"}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isSpotifyConnected ? "bg-[#1DB954] animate-pulse" : "bg-zinc-600"}`} />
                </button>
              </div>
            )}

            {/* Selector de Disposición / Entorno dentro del menú */}
            <div className="mb-4 pb-4 border-b border-white/[0.08]">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">
                Entorno de Entrenamiento
              </label>
              <div className="grid grid-cols-1 gap-1.5 font-mono text-xs">
                {[
                  { id: 'full_gym', label: 'Gimnasio Completo' },
                  { id: 'hotel_gym', label: 'Hotel (Mancuernas)' },
                  { id: 'bodyweight', label: 'Peso Corporal' },
                  { id: 'home_gym', label: 'Ejercicios en Casa' },
                ].map((env) => (
                  <button
                    key={env.id}
                    onClick={() => {
                      onEnvironmentChange(env.id);
                      setIsOpen(false);
                    }}
                    className={`text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                      environmentMode === env.id
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span>{env.label}</span>
                    {environmentMode === env.id && <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón de Instalar PWA */}
            {showInstallButton && (
              <div className="mb-3">
                <button
                  onClick={() => {
                    onInstallClick();
                    setIsOpen(false);
                  }}
                  className="w-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Instalar Aplicación PWA</span>
                </button>
              </div>
            )}

            {/* Reconfigurar Perfil */}
            {onResetProfile && (
              <div className="mb-3">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onResetProfile();
                  }}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-400 hover:text-white text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 font-mono"
                >
                  <RefreshCw className="w-3 h-3 text-zinc-400" />
                  <span>Reconfigurar Perfil Biométrico</span>
                </button>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>APEX // V2.5</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3 h-3 text-emerald-400" /> Seguro
              </span>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
