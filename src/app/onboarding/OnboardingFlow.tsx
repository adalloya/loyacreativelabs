// src/app/onboarding/OnboardingFlow.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SliderField } from '@/components/onboarding/SliderField';
import { Tooltip } from '@/components/ui/Tooltip';
import { CheckCircle2, Shield, Activity, Sparkles, AlertCircle } from 'lucide-react';
import { calculateMetabolism } from '@/lib/nutrition-logistics';

export type FitnessGoal = 'deficit' | 'maintenance' | 'surplus';

export interface UserApexProfile {
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number;
  trainingDaysPerWeek: number;
  sessionDurationMins: number;
  preferredCardio: 'incline_treadmill' | 'stairmaster' | 'stationary_bike' | 'none';
  fitnessGoal: FitnessGoal;
  caloricAdjustmentPct: number; // e.g. -15 for deficit, 0 for maintenance, +15 for surplus
  caloricDeficitPct: number; // backwards compatibility
  isConfigured: boolean;
}

export const initialProfile: UserApexProfile = {
  firstName: '',
  lastName: '',
  age: 38,
  gender: 'male',
  weightKg: 80,
  heightCm: 178,
  trainingDaysPerWeek: 6,
  sessionDurationMins: 60,
  preferredCardio: 'incline_treadmill',
  fitnessGoal: 'deficit',
  caloricAdjustmentPct: -15,
  caloricDeficitPct: 15,
  isConfigured: false,
};

const TELEMETRY_STEPS = [
  { label: 'Calibrando metabolismo basal (Katch-McArdle) y macros', detail: 'TDEE y ratio proteico adaptativo' },
  { label: 'Estructurando periodización y volumen semanal', detail: 'Distribución de series efectivas por grupo muscular' },
  { label: 'Indexando catálogo biomecánico (876 ejercicios respaldados)', detail: 'Mapeo offline con cinemática y vectores' },
  { label: 'Consultando motor clínico Gemini IA y lista inteligente', detail: 'Generando blueprint de 7 días y micronutrientes' }
];

export function OnboardingFlow({ onComplete }: { onComplete?: (savedProfile?: UserApexProfile) => void }) {
  const [profile, setProfile] = useLocalStorage<UserApexProfile>('apex_user_profile', initialProfile);
  const [step, setStep] = useState(1);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [activeTelemetryIndex, setActiveTelemetryIndex] = useState(0);

  const handleChange = (field: keyof UserApexProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.firstName?.trim() || !profile.lastName?.trim()) {
      alert('Por favor ingresa tu Nombre y Apellido para continuar.');
      setStep(1);
      return;
    }

    const finalProfile: UserApexProfile = {
      ...profile,
      isConfigured: true,
      fitnessGoal: profile.fitnessGoal || 'deficit',
      caloricAdjustmentPct: typeof profile.caloricAdjustmentPct === 'number' ? profile.caloricAdjustmentPct : -15,
      caloricDeficitPct: profile.caloricAdjustmentPct ? Math.abs(profile.caloricAdjustmentPct) : (profile.caloricDeficitPct || 15)
    };

    // Guardar inmediatamente en localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('apex_user_profile', JSON.stringify(finalProfile));
      window.dispatchEvent(new Event('local-storage-update'));
      window.dispatchEvent(new Event('storage'));
    }

    setProfile(finalProfile);
    setIsCalibrating(true);
  };

  // Manejador secuencial de calibración con feedback de alta tecnología
  useEffect(() => {
    if (!isCalibrating) return;

    const t1 = setTimeout(() => {
      setCalibrationProgress(25);
      setActiveTelemetryIndex(1);
    }, 500);

    const t2 = setTimeout(() => {
      setCalibrationProgress(60);
      setActiveTelemetryIndex(2);
    }, 1200);

    const t3 = setTimeout(() => {
      setCalibrationProgress(88);
      setActiveTelemetryIndex(3);
    }, 2000);

    const t4 = setTimeout(() => {
      setCalibrationProgress(100);
      setActiveTelemetryIndex(4);
    }, 2800);

    const t5 = setTimeout(() => {
      if (onComplete) {
        onComplete(profile);
      }
    }, 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isCalibrating, onComplete, profile]);

  // Pantalla de Calibración Obsidian HUD (Apple / Tesla UX)
  if (isCalibrating) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6 selection:bg-[#FF2A2A]/30 selection:text-white">
        <div className="w-full max-w-lg bg-[#121214]/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Logo APEX con pulso biomecánico */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl overflow-hidden border border-white/[0.15] bg-[#111111] shadow-2xl shadow-red-950/40 flex items-center justify-center">
            <Image
              src="/apex-logo.png"
              alt="APEX"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
            <div className="absolute inset-0 border border-[#FF2A2A]/40 rounded-2xl animate-ping opacity-25" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A2A]/10 border border-[#FF2A2A]/20 text-[10px] font-mono tracking-widest text-[#FF2A2A] uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A] animate-pulse" />
              SISTEMA EN CALIBRACIÓN
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Configurando tu Ecosistema APEX
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Atleta: <span className="text-white font-medium">{profile.firstName} {profile.lastName}</span>
            </p>
          </div>

          {/* Barra de Progreso Minimalista */}
          <div className="space-y-2">
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden border border-white/[0.08] p-0.5">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${calibrationProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400">
              <span>PROGRESO BIOMÉTRICO</span>
              <span className="text-white font-bold">{calibrationProgress}%</span>
            </div>
          </div>

          {/* Checklist de Telemetría Dinámica */}
          <div className="space-y-2.5 text-left border-t border-b border-white/[0.06] py-4">
            {TELEMETRY_STEPS.map((stepItem, idx) => {
              const isDone = activeTelemetryIndex > idx;
              const isCurrent = activeTelemetryIndex === idx;

              return (
                <div 
                  key={idx}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                    isCurrent ? 'bg-white/[0.05] border border-white/[0.08]' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-[#10B981]" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium tracking-tight ${isDone ? 'text-zinc-200' : isCurrent ? 'text-white font-semibold' : 'text-zinc-500'}`}>
                      {stepItem.label}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                      {stepItem.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner de Reaseguro al Usuario */}
          <div className="p-3.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center gap-3 text-left">
            <AlertCircle size={18} className="text-zinc-400 shrink-0" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <span className="text-white font-medium">Por favor no cierres ni recargues el navegador.</span> Estamos sintetizando tu plan clínico y conectando el motor offline.
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6 selection:bg-[#FF2A2A]/30 selection:text-white">
      <div className="w-full max-w-xl bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {/* Header de Configuración con Logo APEX */}
        <div className="mb-6 border-b border-white/[0.08] pb-4 flex items-start gap-4">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#111111] shrink-0 shadow-lg shadow-red-950/20">
            <Image
              src="/apex-logo.png"
              alt="APEX"
              width={48}
              height={48}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF2A2A] animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-[#FF2A2A] uppercase">
                CALIBRACIÓN // APEX
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase mt-0.5">
              {step === 1 ? 'Identificación del Atleta' : 'Parámetros Biomecánicos'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Paso {step} de 2 • Todo el motor de hipertrofia y dieta se adaptará a estos datos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 flex items-center">
                    NOMBRE
                    <Tooltip text="Utilizado para personalizar las consignas de psicología deportiva y mensajes de mentalidad." />
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre"
                    value={profile.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">APELLIDO</label>
                  <input
                    type="text"
                    required
                    placeholder="Apellido"
                    value={profile.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Edad y Género */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">EDAD</label>
                  <input
                    type="number"
                    min="15"
                    max="90"
                    required
                    placeholder="Edad"
                    value={profile.age || ''}
                    onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">GÉNERO BIOLÓGICO</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange('gender', 'male')}
                      className={`py-3 rounded-xl text-xs font-mono font-medium transition-all border ${
                        profile.gender === 'male'
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white'
                      }`}
                    >
                      MASCULINO
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('gender', 'female')}
                      className={`py-3 rounded-xl text-xs font-mono font-medium transition-all border ${
                        profile.gender === 'female'
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white'
                      }`}
                    >
                      FEMENINO
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón Siguiente */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!profile.firstName?.trim() || !profile.lastName?.trim()) {
                      alert('Por favor ingresa tu Nombre y Apellido para continuar.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Continuar a Biometría</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Peso, Altura y Grasa */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SliderField
                  label="PESO ACTUAL"
                  unit="kg"
                  value={profile.weightKg}
                  min={45}
                  max={150}
                  step={0.5}
                  onChange={(v) => handleChange('weightKg', v)}
                />
                <SliderField
                  label="ESTATURA"
                  unit="cm"
                  value={profile.heightCm}
                  min={140}
                  max={215}
                  step={1}
                  onChange={(v) => handleChange('heightCm', v)}
                />
                <SliderField
                  label="% GRASA EST."
                  unit="%"
                  value={profile.bodyFatPct || 15}
                  min={5}
                  max={40}
                  step={0.5}
                  onChange={(v) => handleChange('bodyFatPct', v)}
                />
              </div>

              {/* Días y Tiempo de Sesión */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SliderField
                  label="DÍAS ENTRENAMIENTO"
                  unit="días/sem"
                  value={profile.trainingDaysPerWeek}
                  min={3}
                  max={6}
                  step={1}
                  onChange={(v) => handleChange('trainingDaysPerWeek', v)}
                />
                <SliderField
                  label="DURACIÓN SESIÓN"
                  unit="min"
                  value={profile.sessionDurationMins}
                  min={30}
                  max={120}
                  step={5}
                  onChange={(v) => handleChange('sessionDurationMins', v)}
                />
              </div>

              {/* Objetivo Nutricional */}
              {/* Objetivo Nutricional con Cálculo de Calorías Diarias Totales */}
              {(() => {
                const currentMeta = calculateMetabolism({
                  gender: profile.gender || 'male',
                  age: profile.age || 30,
                  weightKg: profile.weightKg || 80,
                  heightCm: profile.heightCm || 178,
                  bodyFatPct: profile.bodyFatPct,
                  trainingDaysPerWeek: profile.trainingDaysPerWeek || 5,
                  fitnessGoal: profile.fitnessGoal,
                  caloricAdjustmentPct: profile.caloricAdjustmentPct
                });

                return (
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3">
                    <label className="text-xs font-mono text-zinc-400 block flex items-center justify-between flex-wrap gap-1.5">
                      <span>OBJETIVO NUTRICIONAL & CALÓRICO</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {currentMeta.targetCalories.toLocaleString()} kcal/día (
                        {profile.fitnessGoal === 'deficit' && `${profile.caloricAdjustmentPct || -15}% Déficit`}
                        {profile.fitnessGoal === 'maintenance' && 'Mantenimiento 0%'}
                        {profile.fitnessGoal === 'surplus' && `+${profile.caloricAdjustmentPct || 15}% Superávit`}
                        )
                      </span>
                    </label>

                    {/* 3 Tarjetas de Objetivo */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('fitnessGoal', 'deficit');
                          handleChange('caloricAdjustmentPct', -15);
                          handleChange('caloricDeficitPct', 15);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          profile.fitnessGoal === 'deficit'
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold uppercase">Déficit</div>
                        <div className="text-[10px] mt-0.5 opacity-80">Perder grasa</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleChange('fitnessGoal', 'maintenance');
                          handleChange('caloricAdjustmentPct', 0);
                          handleChange('caloricDeficitPct', 0);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          profile.fitnessGoal === 'maintenance'
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold uppercase">Mantener</div>
                        <div className="text-[10px] mt-0.5 opacity-80">Recomposición</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleChange('fitnessGoal', 'surplus');
                          handleChange('caloricAdjustmentPct', 15);
                          handleChange('caloricDeficitPct', 0);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          profile.fitnessGoal === 'surplus'
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold uppercase">Superávit</div>
                        <div className="text-[10px] mt-0.5 opacity-80">Ganar masa</div>
                      </button>
                    </div>

                    {/* Selector de Porcentaje con Total Calórico por Opción */}
                    <div className="pt-2">
                      {profile.fitnessGoal === 'deficit' && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-zinc-400">Intensidad del Déficit (Total Calórico Diario):</span>
                          <div className="grid grid-cols-4 gap-2">
                            {[10, 15, 20, 25].map((val) => {
                              const cal = Math.round(currentMeta.tdee * (1 - val / 100));
                              const isSelected = Math.abs(profile.caloricAdjustmentPct || 15) === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => {
                                    handleChange('caloricAdjustmentPct', -val);
                                    handleChange('caloricDeficitPct', val);
                                  }}
                                  className={`py-2 px-1 text-center font-mono rounded-xl border transition-all ${
                                    isSelected
                                      ? 'bg-amber-500/20 border-amber-400 text-white font-bold shadow-sm'
                                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  <div className="text-xs font-bold">-{val}%</div>
                                  <div className={`text-[10px] ${isSelected ? 'text-amber-300 font-semibold' : 'text-zinc-500'}`}>
                                    {cal} kcal
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {profile.fitnessGoal === 'maintenance' && (
                        <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-center space-y-1">
                          <div className="text-xs font-mono font-bold text-white">
                            {currentMeta.tdee.toLocaleString()} kcal/día (100% TDEE de Equilibrio)
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                            Maximiza la fuerza muscular y mantén tu composición corporal actual con precisión metabólica.
                          </p>
                        </div>
                      )}

                      {profile.fitnessGoal === 'surplus' && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-zinc-400">Intensidad del Superávit (Total Calórico Diario):</span>
                          <div className="grid grid-cols-4 gap-2">
                            {[5, 10, 15, 20].map((val) => {
                              const cal = Math.round(currentMeta.tdee * (1 + val / 100));
                              const isSelected = (profile.caloricAdjustmentPct || 15) === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => {
                                    handleChange('caloricAdjustmentPct', val);
                                    handleChange('caloricDeficitPct', 0);
                                  }}
                                  className={`py-2 px-1 text-center font-mono rounded-xl border transition-all ${
                                    isSelected
                                      ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold shadow-sm'
                                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  <div className="text-xs font-bold">+{val}%</div>
                                  <div className={`text-[10px] ${isSelected ? 'text-emerald-300 font-semibold' : 'text-zinc-500'}`}>
                                    {cal} kcal
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}


              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 font-semibold text-xs py-3.5 rounded-xl transition-all"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
                >
                  Guardar y Activar Sistema
                </button>
              </div>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}
