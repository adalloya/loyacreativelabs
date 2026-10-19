// src/app/onboarding/OnboardingFlow.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SliderField } from '@/components/onboarding/SliderField';
import { Tooltip } from '@/components/ui/Tooltip';

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

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [profile, setProfile] = useLocalStorage<UserApexProfile>('apex_user_profile', initialProfile);
  const [step, setStep] = useState(1);

  const handleChange = (field: keyof UserApexProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      alert('Por favor ingresa tu Nombre y Apellido para continuar.');
      return;
    }
    setProfile((prev) => ({ ...prev, isConfigured: true }));
    onComplete();
  };

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

              {/* Slider de Edad */}
              <SliderField
                label="Edad Biológica"
                value={profile.age}
                min={16}
                max={85}
                step={1}
                unit="años"
                onChange={(val) => handleChange('age', val)}
              />

              {/* Género */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-2 flex items-center">
                  GÉNERO BIOLÓGICO
                  <Tooltip text="Determina el ratio metabólico basal (fórmula Mifflin-St Jeor / Katch-McArdle) y partición de nutrientes." />
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!profile.firstName.trim() || !profile.lastName.trim()) {
                    alert('Por favor ingresa tu Nombre y Apellido para continuar.');
                    return;
                  }
                  setStep(2);
                }}
                className="w-full mt-4 bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Siguiente: Biometría y Cargas →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Sliders de Peso, Altura y Frecuencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SliderField
                  label="Peso Corporal"
                  value={profile.weightKg}
                  min={40}
                  max={160}
                  step={0.5}
                  unit="kg"
                  onChange={(val) => handleChange('weightKg', val)}
                />
                <SliderField
                  label="Estatura"
                  value={profile.heightCm}
                  min={140}
                  max={220}
                  step={1}
                  unit="cm"
                  onChange={(val) => handleChange('heightCm', val)}
                />
              </div>

              {/* Frecuencia y Duración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SliderField
                  label="Días / Semana"
                  value={profile.trainingDaysPerWeek}
                  min={2}
                  max={7}
                  step={1}
                  unit="días"
                  onChange={(val) => handleChange('trainingDaysPerWeek', val)}
                />
                <SliderField
                  label="Duración Sesión"
                  value={profile.sessionDurationMins}
                  min={45}
                  max={90}
                  step={15}
                  unit="min"
                  onChange={(val) => handleChange('sessionDurationMins', val)}
                />
              </div>

              {/* OBJETIVO PRINCIPAL DEL ATLETA */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center">
                    OBJETIVO PRINCIPAL
                    <Tooltip text="Define si el balance calórico y macronutrientes se dirigen a pérdida de grasa, mantenimiento de peso o construcción de masa muscular." />
                  </label>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    (profile.fitnessGoal || 'deficit') === 'deficit'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : (profile.fitnessGoal || 'deficit') === 'surplus'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {profile.caloricAdjustmentPct > 0 ? `+${profile.caloricAdjustmentPct}%` : `${profile.caloricAdjustmentPct ?? -15}%`}
                  </span>
                </div>

                {/* Selector de las 3 opciones principales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Opción 1: Pérdida / Definición */}
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('fitnessGoal', 'deficit');
                      handleChange('caloricAdjustmentPct', -15);
                      handleChange('caloricDeficitPct', 15);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      (profile.fitnessGoal || 'deficit') === 'deficit'
                        ? 'bg-white/[0.08] border-white text-white shadow-md'
                        : 'bg-black/40 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono tracking-tight text-white">DÉFICIT</span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Negativo (-)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Definición y quema de grasa protegiendo masa magra
                    </p>
                  </button>

                  {/* Opción 2: Mantenimiento / Recomposición */}
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('fitnessGoal', 'maintenance');
                      handleChange('caloricAdjustmentPct', 0);
                      handleChange('caloricDeficitPct', 0);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      profile.fitnessGoal === 'maintenance'
                        ? 'bg-white/[0.08] border-white text-white shadow-md'
                        : 'bg-black/40 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono tracking-tight text-white">MANTENER</span>
                      <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">
                        0% Balance
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Recomposición corporal y sostenimiento de peso actual
                    </p>
                  </button>

                  {/* Opción 3: Superávit / Volumen */}
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('fitnessGoal', 'surplus');
                      handleChange('caloricAdjustmentPct', 15);
                      handleChange('caloricDeficitPct', 0);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      profile.fitnessGoal === 'surplus'
                        ? 'bg-white/[0.08] border-white text-white shadow-md'
                        : 'bg-black/40 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono tracking-tight text-white">SUPERÁVIT</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Positivo (+)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Volumen muscular e hipertrofia acelerada
                    </p>
                  </button>
                </div>

                {/* Ajuste fino del porcentaje según el objetivo */}
                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  {(profile.fitnessGoal || 'deficit') === 'deficit' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-mono text-zinc-400 uppercase">Intensidad del Déficit</span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {profile.caloricAdjustmentPct ?? -15}%
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {[-10, -15, -20, -25].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              handleChange('caloricAdjustmentPct', val);
                              handleChange('caloricDeficitPct', Math.abs(val));
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-mono font-semibold transition-all border ${
                              (profile.caloricAdjustmentPct ?? -15) === val
                                ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                                : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.fitnessGoal === 'maintenance' && (
                    <div className="text-center py-1">
                      <span className="text-xs font-mono text-zinc-300">
                        Normocalórica exacta (0% de ajuste) • 100% de tu gasto calórico diario (TDEE).
                      </span>
                    </div>
                  )}

                  {profile.fitnessGoal === 'surplus' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-mono text-zinc-400 uppercase">Excedente Calórico (Surplus)</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          +{profile.caloricAdjustmentPct || 15}%
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {[5, 10, 15, 20].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              handleChange('caloricAdjustmentPct', val);
                              handleChange('caloricDeficitPct', 0);
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-mono font-semibold transition-all border ${
                              (profile.caloricAdjustmentPct || 15) === val
                                ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                                : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white'
                            }`}
                          >
                            +{val}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preferencia de Cardio */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                <label className="text-xs font-mono text-zinc-400 block mb-2 flex items-center">
                  CARDIO FINAL (ZONA 2)
                  <Tooltip text="Estimulación mitocondrial suave al final de la sesión para oxidación lipídica sin interferencia con mTOR." />
                </label>
                <select
                  value={profile.preferredCardio}
                  onChange={(e) => handleChange('preferredCardio', e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                >
                  <option value="incline_treadmill">Caminadora con Inclinación (12° / 4.8 km/h)</option>
                  <option value="stairmaster">Escaladora (Nivel 5-7)</option>
                  <option value="stationary_bike">Bicicleta Estática (Cadencia constante)</option>
                  <option value="none">Ninguno (Solo cargas de hipertrofia)</option>
                </select>
              </div>

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
