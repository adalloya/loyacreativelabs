// src/components/ui/AppHeaderMenu.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Menu, 
  X, 
  Download, 
  Shield, 
  RefreshCw, 
  Zap, 
  Music, 
  Sparkles, 
  Layers, 
  Flame, 
  Sun, 
  Moon,
  BookOpen,
  MessageSquareHeart,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { DownloadPDFButton } from '@/components/pdf/DownloadPDFButton';
import { getInitialTheme, setSiteTheme, Theme } from '@/lib/theme';
import { getInitialUxVersion, setUxVersion, UxVersion } from '@/lib/uxVersion';

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
  pdfWeeklyProgram,
  pdfDiet,
  onResetProfile,
  readiness = 'normal',
  onReadinessChange,
  onOpenSpotifyModal,
  isSpotifyConnected = false,
  onOpenOnboarding,
  onOpenFeedback,
  onOpenDietPlanModal,
  uxVersion: propUxVersion,
  onUxVersionChange
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
  pdfWeeklyProgram?: any[];
  pdfDiet?: any;
  onResetProfile?: () => void;
  readiness?: string;
  onReadinessChange?: (readiness: any) => void;
  onOpenSpotifyModal?: () => void;
  isSpotifyConnected?: boolean;
  onOpenOnboarding?: () => void;
  onOpenFeedback?: () => void;
  onOpenDietPlanModal?: () => void;
  uxVersion?: UxVersion;
  onUxVersionChange?: (version: UxVersion) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [internalUxVersion, setInternalUxVersion] = useState<UxVersion>('stable');
  const activeUxVersion = propUxVersion ?? internalUxVersion;
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTheme(getInitialTheme());
    setInternalUxVersion(getInitialUxVersion());

    const handleThemeChange = (e: Event) => {
      const customEvt = e as CustomEvent<{ theme: Theme }>;
      if (customEvt.detail?.theme) {
        setTheme(customEvt.detail.theme);
      }
    };

    const handleUxVersionChange = (e: Event) => {
      const customEvt = e as CustomEvent<{ version: UxVersion }>;
      if (customEvt.detail?.version) {
        setInternalUxVersion(customEvt.detail.version);
      }
    };

    window.addEventListener('apex_theme_change', handleThemeChange);
    window.addEventListener('apex_ux_version_change', handleUxVersionChange);
    return () => {
      window.removeEventListener('apex_theme_change', handleThemeChange);
      window.removeEventListener('apex_ux_version_change', handleUxVersionChange);
    };
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

  const userName = pdfProfile?.firstName || (() => {
    if (typeof window === 'undefined') return 'Atleta';
    try {
      const raw = localStorage.getItem('apex_user_profile');
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.firstName) return p.firstName;
      }
    } catch {}
    return 'Atleta';
  })();

  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const handleToggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    setSiteTheme(newTheme);
  };

  const isLight = theme === 'light';

  return (
    <div className="relative z-50">
      {/* Botón de tres rayitas (Hamburguesa) */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-2xl transition-all shadow-lg flex items-center justify-center active:scale-95 border backdrop-blur-xl ${
          isLight
            ? "bg-white/90 border-slate-200 text-slate-800 hover:bg-slate-100 shadow-slate-900/5"
            : "bg-[#121214]/90 border-white/[0.1] hover:border-white/30 text-white"
        }`}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú principal"}
      >
        {isOpen ? (
          <X className={`w-5 h-5 ${isLight ? "text-slate-800" : "text-white"}`} />
        ) : (
          <Menu className={`w-5 h-5 ${isLight ? "text-slate-800" : "text-white"}`} />
        )}
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
            className={`fixed top-0 right-0 bottom-0 z-50 h-full w-full sm:w-96 max-w-full overflow-y-auto backdrop-blur-2xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-right duration-250 font-sans border-l ${
              isLight
                ? "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/15"
                : "bg-[#121214]/95 border-white/[0.12] text-white"
            }`}
          >
            
            {/* Cabecera del Menú con Saludo Personalizado, Logo APEX y Cruz de Cierre */}
            <div className={`flex items-center justify-between pb-3.5 mb-4 border-b ${
              isLight ? "border-slate-200" : "border-white/[0.08]"
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`relative w-8 h-8 rounded-xl overflow-hidden border shrink-0 ${
                  isLight ? "border-slate-300 bg-slate-100" : "border-white/10 bg-black"
                }`}>
                  <Image
                    src="/apex-logo.png"
                    alt="APEX"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold tracking-tight truncate ${
                    isLight ? "text-slate-950" : "text-white"
                  }`}>
                    Buenos días, {userName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-mono tracking-wider uppercase font-semibold ${
                      isLight ? "text-slate-500" : "text-zinc-400"
                    }`}>APEX</span>
                    <span className="text-[10px] text-zinc-500">•</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                      isLight
                        ? "text-slate-500 bg-slate-100 border-slate-200"
                        : "text-zinc-500 bg-white/[0.04] border-white/[0.06]"
                    }`}>
                      SISTEMA
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-90 shrink-0 cursor-pointer ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200"
                    : "bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white border-white/[0.08]"
                }`}
                title="Cerrar menú"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nutrición & Generar Dieta Gemini AI */}
            {onOpenDietPlanModal && (
              <div className={`mb-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
                <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 flex items-center justify-between ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}>
                  <span>NUTRICIÓN & PROTOCOLO IA</span>
                  <span className="text-emerald-500 font-bold text-[9px] font-mono">IA GENERATIVA</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenDietPlanModal();
                  }}
                  className={`w-full font-medium text-xs py-2.5 px-3 rounded-2xl transition-all flex items-center justify-between active:scale-95 group text-left border cursor-pointer ${
                    isLight
                      ? "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950 shadow-xs"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                      isLight
                        ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                        : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Generar Dieta Personalizada</div>
                      <div className={`text-[10px] ${isLight ? "text-emerald-700/80" : "text-emerald-400/80"}`}>
                        IA: Macros, 7 días & suplementos
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

            {/* Guía y Buzón de Sugerencias */}
            {(onOpenOnboarding || onOpenFeedback) && (
              <div className={`mb-4 pb-4 border-b space-y-1.5 ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
                <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}>
                  AYUDA & MEJORA CONTINUA
                </label>

                {/* Botón de Onboarding Detallado */}
                {onOpenOnboarding && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenOnboarding();
                    }}
                    className={`w-full font-medium text-xs py-2.5 px-3 rounded-2xl transition-all flex items-center justify-between active:scale-95 group text-left border ${
                      isLight
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                        : "bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${
                        isLight
                          ? "bg-slate-100 border-slate-200 text-slate-700 group-hover:text-slate-900"
                          : "bg-white/[0.06] border-white/[0.08] text-zinc-300 group-hover:text-white"
                      }`}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`font-semibold text-xs ${isLight ? "text-slate-900" : "text-white"}`}>Guía y Tutorial para Todos</div>
                        <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Paso a paso para volverse experto</div>
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-colors ${
                      isLight ? "text-slate-400 group-hover:text-slate-800" : "text-zinc-500 group-hover:text-white"
                    }`} />
                  </button>
                )}

                {/* Botón de Formulario de Feedback */}
                {onOpenFeedback && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenFeedback();
                    }}
                    className={`w-full font-medium text-xs py-2.5 px-3 rounded-2xl transition-all flex items-center justify-between active:scale-95 group text-left border ${
                      isLight
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                        : "bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${
                        isLight
                          ? "bg-slate-100 border-slate-200 text-slate-700 group-hover:text-slate-900"
                          : "bg-white/[0.06] border-white/[0.08] text-zinc-300 group-hover:text-white"
                      }`}>
                        <MessageSquareHeart className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`font-semibold text-xs ${isLight ? "text-slate-900" : "text-white"}`}>Danos tu Opinión / Qué te Falta</div>
                        <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>Buzón de sugerencias</div>
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-colors ${
                      isLight ? "text-slate-400 group-hover:text-slate-800" : "text-zinc-500 group-hover:text-white"
                    }`} />
                  </button>
                )}
              </div>
            )}

            {/* Apariencia del Sitio: Modo Oscuro vs Modo Claro */}
            <div className={`mb-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
              <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 flex items-center justify-between ${
                isLight ? "text-slate-500" : "text-zinc-500"
              }`}>
                <span>APARIENCIA DEL SITIO</span>
                <span className={`font-mono text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
                  isLight
                    ? "text-slate-700 bg-slate-100 border-slate-200"
                    : "text-zinc-400 bg-white/[0.06] border-white/[0.08]"
                }`}>
                  {theme === 'dark' ? '🌙 OSCURO // DEFAULT' : '☀️ MODO CLARO'}
                </span>
              </label>
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-2xl border ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-white/[0.08]"
              }`}>
                <button
                  type="button"
                  onClick={() => handleToggleTheme('dark')}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    theme === 'dark'
                      ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-white text-black font-semibold shadow-md')
                      : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold leading-none">Oscuro</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTheme('light')}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    theme === 'light'
                      ? (isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-white text-black font-semibold shadow-md')
                      : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold leading-none">Claro</span>
                </button>
              </div>
            </div>

            {/* Exportar Blueprint PDF */}
            {pdfProfile && (
              <div className={`mb-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
                <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}>
                  DOCUMENTO CLÍNICO & RUTINA
                </label>
                <div onClick={() => setIsOpen(false)}>
                  <DownloadPDFButton 
                    profile={pdfProfile} 
                    routine={pdfRoutine || []} 
                    weeklyProgram={pdfWeeklyProgram || []}
                    diet={pdfDiet} 
                  />
                </div>
              </div>
            )}

            {/* Disposición del Atleta Hoy (Readiness) */}
            {onReadinessChange && (
              <div className={`mb-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
                <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 flex items-center justify-between ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}>
                  <span>DISPOSICIÓN HOY (READINESS)</span>
                  <span className="text-[#FF2A2A] text-[9px] font-bold">AUTORREGULACIÓN</span>
                </label>
                <div className={`grid grid-cols-3 gap-1 p-1 rounded-2xl border ${
                  isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-white/[0.08]"
                }`}>
                  {[
                    { id: 'optimal', label: 'Óptimo', sub: 'RIR 1' },
                    { id: 'normal', label: 'Normal', sub: 'RIR 1-2' },
                    { id: 'fatigued', label: 'Fatigado', sub: '-5%' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onReadinessChange(item.id)}
                      className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                        readiness === item.id
                          ? (isLight ? 'bg-white text-slate-950 font-bold shadow-sm' : 'bg-white text-black font-semibold shadow-md')
                          : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                      }`}
                    >
                      <div className="text-xs leading-none">{item.label}</div>
                      <div className={`text-[9px] mt-0.5 ${
                        readiness === item.id
                          ? (isLight ? 'text-slate-600 font-semibold' : 'text-zinc-700')
                          : (isLight ? 'text-slate-400' : 'text-zinc-500')
                      }`}>
                        {item.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Unidad de Peso (LBS / KG) */}
            <div className={`mb-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
              <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 flex items-center justify-between ${
                isLight ? "text-slate-500" : "text-zinc-500"
              }`}>
                <span>UNIDAD DE PESAS</span>
                <span className={`font-mono text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
                  isLight
                    ? "text-slate-700 bg-slate-100 border-slate-200"
                    : "text-white bg-white/[0.06] border-white/[0.08]"
                }`}>
                  {weightUnit === 'lbs' ? 'LBS // DEFAULT' : 'KG // MÉTRICO'}
                </span>
              </label>
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-2xl border ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-white/[0.08]"
              }`}>
                <button
                  type="button"
                  onClick={() => onWeightUnitChange?.('lbs')}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer ${
                    weightUnit === 'lbs'
                      ? (isLight ? 'bg-white text-slate-950 font-bold shadow-sm' : 'bg-white text-black font-semibold shadow-md')
                      : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                  }`}
                >
                  <div className="text-xs leading-none font-bold">LBS (Libras)</div>
                  <div className={`text-[9px] mt-0.5 ${
                    weightUnit === 'lbs'
                      ? (isLight ? 'text-slate-600' : 'text-zinc-700')
                      : (isLight ? 'text-slate-400' : 'text-zinc-500')
                  }`}>
                    Barra 45 lbs
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onWeightUnitChange?.('kg')}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer ${
                    weightUnit === 'kg'
                      ? (isLight ? 'bg-white text-slate-950 font-bold shadow-sm' : 'bg-white text-black font-semibold shadow-md')
                      : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                  }`}
                >
                  <div className="text-xs leading-none font-bold">KG (Kilos)</div>
                  <div className={`text-[9px] mt-0.5 ${
                    weightUnit === 'kg'
                      ? (isLight ? 'text-slate-600' : 'text-zinc-700')
                      : (isLight ? 'text-slate-400' : 'text-zinc-500')
                  }`}>
                    Barra 20 kg
                  </div>
                </button>
              </div>
            </div>

            {/* Metodología de Entrenamiento */}
            {onTrainingMethodologyChange && (
              <div className={`mb-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
                <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 flex items-center justify-between ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}>
                  <span>METODOLOGÍA DE ENTRENAMIENTO</span>
                  <span className="text-[#FF2A2A] text-[9px] uppercase font-mono font-bold">
                    {trainingMethodology === 'cycled_circuits' ? 'CIRCUITOS & CICLADO' : 'HIPERTROFIA LINEAL'}
                  </span>
                </label>
                <div className={`grid grid-cols-2 gap-1 p-1 rounded-2xl border ${
                  isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-white/[0.08]"
                }`}>
                  <button
                    type="button"
                    onClick={() => onTrainingMethodologyChange('traditional')}
                    className={`py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer ${
                      trainingMethodology === 'traditional'
                        ? (isLight ? 'bg-white text-slate-950 font-bold shadow-sm' : 'bg-white text-black font-semibold shadow-md')
                        : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                    }`}
                  >
                    <div className="text-xs leading-none font-bold">Lineal Tradicional</div>
                    <div className={`text-[9px] mt-0.5 ${
                      trainingMethodology === 'traditional'
                        ? (isLight ? 'text-slate-600' : 'text-zinc-700')
                        : (isLight ? 'text-slate-400' : 'text-zinc-500')
                    }`}>
                      Series rectas & RIR
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTrainingMethodologyChange('cycled_circuits')}
                    className={`py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer ${
                      trainingMethodology === 'cycled_circuits'
                        ? (isLight ? 'bg-white text-slate-950 font-bold shadow-sm' : 'bg-white text-black font-semibold shadow-md')
                        : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white')
                    }`}
                  >
                    <div className="text-xs leading-none font-bold">Ciclado & Circuitos</div>
                    <div className={`text-[9px] mt-0.5 ${
                      trainingMethodology === 'cycled_circuits'
                        ? (isLight ? 'text-slate-600' : 'text-zinc-700')
                        : (isLight ? 'text-slate-400' : 'text-zinc-500')
                    }`}>
                      Bloques 3x & Ciclado Carb
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Botón de Importar Rutina en Texto Libre */}
            {onOpenRoutineImporter && (
              <div className={`mb-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
                <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 flex items-center justify-between ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}>
                  <span>RUTINA PERSONALIZADA</span>
                  <span className="text-[#10B981] text-[9px] font-mono font-bold">TEXT-TO-APEX</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenRoutineImporter();
                  }}
                  className={`w-full font-medium text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-between active:scale-95 group border cursor-pointer ${
                    isLight
                      ? "bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-950"
                      : "bg-[#FF2A2A]/10 hover:bg-[#FF2A2A]/20 border-[#FF2A2A]/30 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF2A2A]" />
                    <span className="font-bold">Importar Rutina (Texto a APEX)</span>
                  </div>
                  <Layers className={`w-3.5 h-3.5 transition-colors ${
                    isLight ? "text-rose-400 group-hover:text-rose-900" : "text-zinc-400 group-hover:text-white"
                  }`} />
                </button>
              </div>
            )}

            {/* Spotify Integration Section */}
            {onOpenSpotifyModal && (
              <div className={`mb-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
                <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 flex items-center justify-between ${
                  isLight ? "text-slate-500" : "text-zinc-500"
                }`}>
                  <span>MÚSICA // SPOTIFY</span>
                  <span className={isSpotifyConnected ? "text-[#1DB954] font-bold" : (isLight ? "text-slate-400" : "text-zinc-500")}>
                    {isSpotifyConnected ? "CONECTADO" : "SINCRONIZAR"}
                  </span>
                </label>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSpotifyModal();
                  }}
                  className={`w-full font-medium text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-between active:scale-95 group border cursor-pointer ${
                    isLight
                      ? "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950"
                      : "bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border-[#1DB954]/30 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-[#1DB954]" />
                    <span className="font-semibold">{isSpotifyConnected ? "Control & Playlists (140 BPM)" : "Conectar Spotify"}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isSpotifyConnected ? "bg-[#1DB954] animate-pulse" : (isLight ? "bg-slate-300" : "bg-zinc-600")}`} />
                </button>
              </div>
            )}

            {/* Selector de Disposición / Entorno dentro del menú */}
            <div className={`mb-4 pb-4 border-b ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
              <label className={`text-[10px] font-mono uppercase tracking-wider block mb-2 ${
                isLight ? "text-slate-500" : "text-zinc-500"
              }`}>
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
                    className={`text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                      environmentMode === env.id
                        ? (isLight ? 'bg-white text-slate-950 font-bold border-slate-300 shadow-xs' : 'bg-white text-black font-semibold shadow-sm border-white')
                        : (isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] border-transparent')
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
                  className={`w-full font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 border cursor-pointer ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                      : "bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-white"
                  }`}
                >
                  <Download className={`w-3.5 h-3.5 ${isLight ? "text-slate-600" : "text-zinc-300"}`} />
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
                  className={`w-full text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 font-mono border cursor-pointer ${
                    isLight
                      ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                      : "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] text-zinc-400 hover:text-white"
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
                  <span>Reconfigurar Perfil Biométrico</span>
                </button>
              </div>
            )}

            {/* Selector de Versión UX (v1 Estable vs v2 Nueva) */}
            {activeUxVersion === 'stable' && (
              <div className={`mb-3 pt-3 border-t ${isLight ? "border-slate-200" : "border-white/[0.08]"}`}>
                <button
                  type="button"
                  onClick={() => {
                    const nextV: UxVersion = 'v2';
                    setInternalUxVersion(nextV);
                    setUxVersion(nextV);
                    onUxVersionChange?.(nextV);
                    setIsOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-purple-600/20 hover:from-violet-600/30 hover:via-indigo-600/30 hover:to-purple-600/30 border border-violet-500/40 hover:border-violet-400 text-white font-medium text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-between active:scale-95 group shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400 group-hover:rotate-12 transition-transform" />
                    <div className="text-left">
                      <div className={`font-semibold ${isLight ? "text-violet-950" : "text-white"}`}>Probar Nueva Versión (v2)</div>
                      <div className={`text-[10px] ${isLight ? "text-violet-700" : "text-zinc-400"}`}>Activar nueva experiencia UX</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-violet-500/30 text-violet-200 border border-violet-400/40">
                    BETA
                  </span>
                </button>
              </div>
            )}

            <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
              isLight ? "border-slate-200 text-slate-500" : "border-white/[0.06] text-zinc-500"
            }`}>
              <span className="flex items-center gap-1.5 font-bold tracking-wider">
                APEX
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Seguro
              </span>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
