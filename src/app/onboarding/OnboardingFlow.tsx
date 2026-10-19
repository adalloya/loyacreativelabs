// src/app/onboarding/OnboardingFlow.tsx
'use client';

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
    if (!profile.firstName || !profile.lastName) return;
    setProfile((prev) => ({ ...prev, isConfigured: true }));
    onComplete();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-[#FF2A2A]/30 selection:text-white">
      <div className="w-full max-w-xl bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
        
        {/* Header de Configuración */}
        <div className="mb-8 border-b border-white/[0.08] pb-4">
          <span className="text-[10px] font-mono tracking-widest text-[#FF2A2A] uppercase">
            SISTEMA DE CALIBRACIÓN // APEX OS
          </span>
          <h1 className="text-2xl font-bold tracking-tight uppercase mt-1">
            {step === 1 ? 'Identificación del Atleta' : 'Parámetros Biomecánicos'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Paso {step} de 2 • Todo el motor de hipertrofia y dieta se adaptará a estos datos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">NOMBRE</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">EDAD (AÑOS)</label>
                  <input
                    type="number"
                    required
                    value={profile.age}
                    onChange={(e) => handleChange('age', Number(e.target.value))}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">GÉNERO</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full bg-[#1A1A1C] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!profile.firstName || !profile.lastName) {
                    alert('Por favor ingresa tu Nombre y Apellido para continuar.');
                    return;
                  }
                  setStep(2);
                }}
                className="w-full mt-6 bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Siguiente: Biometría y Cargas →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">PESO (KG)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={profile.weightKg}
                    onChange={(e) => handleChange('weightKg', Number(e.target.value))}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">ALTURA (CM)</label>
                  <input
                    type="number"
                    required
                    value={profile.heightCm}
                    onChange={(e) => handleChange('heightCm', Number(e.target.value))}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">DÍAS / SEM</label>
                  <input
                    type="number"
                    min="2"
                    max="7"
                    required
                    value={profile.trainingDaysPerWeek}
                    onChange={(e) => handleChange('trainingDaysPerWeek', Number(e.target.value))}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">PREFERENCIA DE CARDIO FINAL</label>
                <select
                  value={profile.preferredCardio}
                  onChange={(e) => handleChange('preferredCardio', e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                >
                  <option value="incline_treadmill">Caminadora con Inclinación (Zona 2)</option>
                  <option value="stairmaster">Escaladora</option>
                  <option value="stationary_bike">Bicicleta Estática</option>
                  <option value="none">Ninguno</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
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
