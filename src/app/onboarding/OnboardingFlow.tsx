// src/app/onboarding/OnboardingFlow.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SliderField } from '@/components/onboarding/SliderField';
import { Tooltip } from '@/components/ui/Tooltip';

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
  caloricDeficitPct: number;
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
              alt="APEX OS Logo"
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
                SISTEMA DE CALIBRACIÓN // APEX OS
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
                    placeholder="Adalberto"
                    value={profile.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">APELLIDO</label>
                  <input
                    type="text"
                    required
                    placeholder="Loya"
                    value={profile.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40"
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
                  label="Déficit Calórico"
                  value={profile.caloricDeficitPct}
                  min={5}
                  max={30}
                  step={5}
                  unit="%"
                  onChange={(val) => handleChange('caloricDeficitPct', val)}
                />
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
