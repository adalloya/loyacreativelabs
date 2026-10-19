// src/app/nutrition/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DownloadPDFButton } from '@/components/pdf/DownloadPDFButton';

export interface DietPlanData {
  monthYear: string;
  caloriesTarget: number;
  macros: { protein: number; carbs: number; fats: number };
  dailySupplements: Array<{
    name: string;
    dosage: string;
    timing: string;
    clinicalReason: string;
  }>;
  thirtyDayPlan: Array<{
    dayNumber: number;
    totalCalories: number;
    meals: Array<{
      mealName: string;
      timing: string;
      ingredients: Array<{ item: string; grams: number }>;
      macros: { proteinG: number; carbsG: number; fatsG: number };
    }>;
  }>;
}

export default function NutritionPage() {
  // 1. Guardar y leer el plan de dieta localmente en el navegador
  const [dietPlan, setDietPlan] = useLocalStorage<DietPlanData | null>('apex_diet_plan', null);
  const [profile] = useLocalStorage('apex_user_profile', { weightKg: 80, targetCalories: 2200, targetProteinG: 180, caloricDeficitPct: 15 });
  const [loading, setLoading] = useState(false);

  // 2. Función para invocar a Gemini y guardar el resultado localmente
  const handleGenerateDiet = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await response.json();
      if (data) {
        setDietPlan(data); // Se guarda automáticamente en localStorage
      }
    } catch (error) {
      console.error('Error generando dieta:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 max-w-5xl mx-auto selection:bg-[#FF2A2A]/30 selection:text-white">
      
      {/* Back button */}
      <div className="mb-6">
        <Link href="/apex" className="text-xs text-zinc-400 hover:text-white font-mono flex items-center gap-1.5 transition-colors">
          ← VOLVER A APEX DASHBOARD
        </Link>
      </div>

      {/* Header Editorial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.08] pb-6 mb-8 gap-4">
        <div>
          <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">MÓDULO CLÍNICO // NUTRICIÓN OS</span>
          <h1 className="text-3xl font-bold tracking-tight mt-1">PLAN MENSUAL & SUPLEMENTACIÓN</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {dietPlan && (
            <DownloadPDFButton 
              profile={profile} 
              routine={[]} // Pasa tu rutina activa aquí
              diet={dietPlan} 
            />
          )}
          
          <button
            onClick={handleGenerateDiet}
            disabled={loading}
            className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] font-semibold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'PROCESANDO CON GEMINI...' : dietPlan ? 'REGENERAR PLAN' : 'GENERAR PLAN 30 DÍAS'}
          </button>
        </div>
      </div>

      {/* Contenido Dinámico */}
      {!dietPlan ? (
        <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-12 text-center my-12 shadow-2xl">
          <h3 className="text-lg font-semibold mb-2">No hay un plan activo en este navegador</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
            Genera tu protocolo mensual basado en tu déficit calórico y métricas biométricas locales. Se guardará de forma independiente en tu dispositivo.
          </p>
          <button
            onClick={handleGenerateDiet}
            disabled={loading}
            className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95"
          >
            {loading ? 'GENERANDO...' : 'CREAR PLAN DE 30 DÍAS'}
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Tarjetas Resumen de Macros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">CALORÍAS OBJETIVO</span>
              <p className="text-2xl font-mono font-bold mt-1">{dietPlan.caloriesTarget} KCAL</p>
            </div>
            <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">PROTEÍNA DIARIA</span>
              <p className="text-2xl font-mono font-bold mt-1 text-[#FF2A2A]">{dietPlan.macros?.protein} G</p>
            </div>
            <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">ESTADO DE MEMORIA</span>
              <p className="text-xs font-mono font-medium text-emerald-400 mt-2">● GUARDADO LOCALMENTE</p>
            </div>
          </div>

          {/* Stack de Suplementos Grado A */}
          <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
            <h3 className="text-sm font-mono tracking-wider text-zinc-400 uppercase mb-4">SUPLEMENTACIÓN CLÍNICA DIARIA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dietPlan.dailySupplements?.map((sup, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{sup.name}</span>
                    <span className="font-mono text-xs text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded">{sup.dosage}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">{sup.timing}</p>
                  <p className="text-[11px] text-zinc-500 italic">{sup.clinicalReason}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
