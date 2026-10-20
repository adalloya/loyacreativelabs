// src/components/apex/TextToApexRoutineModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Sparkles, Dumbbell, Layers, Check, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { parseFreeformRoutine, DEFAULT_CIRCUIT_ROUTINE_TEXT } from '@/lib/routine-parser';
import { ExerciseItem, RoutineDay } from '@/lib/hypertrophy-engine';

interface TextToApexRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRoutine: (days: RoutineDay[]) => void;
  catalog: ExerciseItem[];
}

export function TextToApexRoutineModal({
  isOpen,
  onClose,
  onApplyRoutine,
  catalog
}: TextToApexRoutineModalProps) {
  const [text, setText] = useState<string>('');
  const [previewDays, setPreviewDays] = useState<RoutineDay[] | null>(null);
  const [hasConverted, setHasConverted] = useState(false);

  if (!isOpen) return null;

  const handleLoadExample = () => {
    setText(DEFAULT_CIRCUIT_ROUTINE_TEXT);
    const parsed = parseFreeformRoutine(DEFAULT_CIRCUIT_ROUTINE_TEXT, catalog);
    setPreviewDays(parsed);
    setHasConverted(true);
  };

  const handleConvert = () => {
    if (!text.trim()) return;
    const parsed = parseFreeformRoutine(text, catalog);
    setPreviewDays(parsed);
    setHasConverted(true);
  };

  const handleApply = () => {
    if (!previewDays || previewDays.length === 0) return;
    onApplyRoutine(previewDays);
    onClose();
  };

  const totalExercises = previewDays
    ? previewDays.reduce((acc, d) => acc + d.exercises.length, 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121214] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF2A2A]/10 border border-[#FF2A2A]/20 flex items-center justify-center text-[#FF2A2A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase">
                  IMPORTADOR INTELIGENTE // TEXTO A APEX
                </h3>
                <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20">
                  876 EJERCICIOS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pega tu rutina de notas o WhatsApp con bloques (3x) y notas de máquinas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Action Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Pega tu texto libre en español:
            </span>
            <button
              type="button"
              onClick={handleLoadExample}
              className="text-xs font-mono text-[#FF2A2A] hover:text-[#ff4f4f] bg-[#FF2A2A]/10 hover:bg-[#FF2A2A]/20 border border-[#FF2A2A]/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cargar Ejemplo de Rutina en Circuitos</span>
            </button>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setHasConverted(false);
              }}
              rows={8}
              placeholder={`LUNES (Cuádriceps)
- Curl acostado (Máquina #18 • 10 lentas y 10 rápidas)
- Sentadilla en Smith (Pirámide 15-12-10)
- Pantorrilla prensa
3x
- Extensiones de pierna (Apretando 3 seg)
- Desplante con mancuernas (12 por pierna)
3x`}
              className="w-full bg-black/60 border border-white/[0.1] focus:border-[#FF2A2A]/50 rounded-2xl p-4 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#FF2A2A]/40 resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Live Preview / Results Section */}
          {hasConverted && previewDays && previewDays.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span className="text-xs font-mono text-white font-bold">
                    {previewDays.length} DÍAS DETECTADOS // {totalExercises} EJERCICIOS
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-full">
                  LISTO PARA APLICAR
                </span>
              </div>

              {/* Day badges */}
              <div className="space-y-2">
                {previewDays.map((day) => (
                  <div
                    key={day.dayNumber}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {day.dayName || `DÍA ${day.dayNumber}`}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          • {day.focus}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {day.exercises.length} ejercicios vinculados con animaciones de GitHub
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          day.carbCyclePhase === 'high_carb'
                            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {day.carbCyclePhase === 'high_carb' ? 'HIGH CARB' : 'LOW/MOD CARB'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasConverted && (!previewDays || previewDays.length === 0) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                No se detectaron días con ejercicios. Asegúrate de incluir encabezados como &quot;LUNES&quot; y ejercicios con guiones.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.06] text-xs font-mono text-zinc-400 hover:text-white transition-all"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConvert}
              className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-mono text-white transition-all flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Convertir al Formato APEX</span>
            </button>

            {previewDays && previewDays.length > 0 && (
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#0fa472] text-black font-bold text-xs transition-all shadow-lg flex items-center gap-1.5 active:scale-95"
              >
                <span>Aplicar a mi Rutina</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
