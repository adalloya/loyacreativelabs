'use client';

import React, { useState } from 'react';
import {
  ACADEMY_CURRICULUM,
  ELECTRODE_MASTER_TABLE,
  STEEL_MATERIALS_GUIDE,
  WELD_TROUBLESHOOTING,
  AcademyClass,
} from '@/lib/arco-maestro/academy-content';
import { BookOpen, ExternalLink, Flame, Shield, CheckCircle2, AlertTriangle, PlayCircle } from 'lucide-react';

export default function AcademyView() {
  const [viewMode, setViewMode] = useState<'classes' | 'reference'>('classes');
  // Inicia en Clase 5 (etapa actual del usuario)
  const [selectedClassNum, setSelectedClassNum] = useState<number>(5);
  const activeClass: AcademyClass =
    ACADEMY_CURRICULUM.find((c) => c.classNumber === selectedClassNum) || ACADEMY_CURRICULUM[4];

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Barra de Navegación & Progreso */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.04] p-2.5 backdrop-blur-2xl">
        <div className="flex gap-1.5">
          <button
            onClick={() => setViewMode('classes')}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              viewMode === 'classes'
                ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Ruta de 14 Clases (Taller)
          </button>
          <button
            onClick={() => setViewMode('reference')}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              viewMode === 'reference'
                ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Manual de Electrodos, Aceros & Fallas
          </button>
        </div>

        <div className="flex items-center gap-3 px-2">
          <span className="text-xs text-zinc-400">Avance de Carrera:</span>
          <div className="h-2.5 w-32 overflow-hidden rounded-full bg-black/50 border border-white/10">
            <div className="h-full w-[36%] rounded-full bg-yellow-400" />
          </div>
          <span className="text-xs font-bold tabular-nums text-yellow-300">Clase 5 de 14</span>
        </div>
      </div>

      {viewMode === 'classes' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* COLUMNA IZQUIERDA: Índice de Clases */}
          <div className="space-y-2 lg:col-span-4 max-h-[750px] overflow-y-auto pr-1">
            {ACADEMY_CURRICULUM.map((cls) => {
              const isSelected = cls.classNumber === selectedClassNum;
              const badgeColor =
                cls.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : cls.status === 'current'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : 'bg-white/5 text-zinc-400 border-white/10';

              return (
                <button
                  key={cls.classNumber}
                  onClick={() => setSelectedClassNum(cls.classNumber)}
                  className={`w-full text-left rounded-2xl border p-3.5 transition-all ${
                    isSelected
                      ? 'border-yellow-400/50 bg-yellow-400/10 backdrop-blur-2xl shadow-lg'
                      : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Clase {cls.classNumber}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${badgeColor}`}>
                      {cls.status === 'completed'
                        ? 'Completada'
                        : cls.status === 'current'
                        ? 'En Curso Hoy'
                        : `Módulo ${cls.moduleNumber}`}
                    </span>
                  </div>
                  <div className="mt-1 text-xs sm:text-sm font-bold text-white line-clamp-2">
                    {cls.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* COLUMNA DERECHA: Ficha de la Clase */}
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-semibold text-yellow-400">{activeClass.moduleTitle}</span>
                  <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-white">
                    {activeClass.title}
                  </h2>
                </div>
                <span className="rounded-xl border border-white/15 bg-black/40 px-3 py-1 text-xs font-bold tabular-nums text-zinc-300">
                  Sesión #{activeClass.classNumber} / 14
                </span>
              </div>

              {/* Objetivo */}
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-yellow-400">
                  Objetivo Práctico de Taller
                </span>
                <p className="mt-1 text-xs sm:text-sm text-zinc-100 leading-relaxed">
                  {activeClass.objective}
                </p>
              </div>

              {/* Conceptos Clave */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                  Conceptos Técnicos Críticos
                </h3>
                <ul className="space-y-2">
                  {activeClass.keyTakeaways.map((point, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-zinc-200"
                    >
                      <span className="font-bold text-yellow-400">0{i + 1}</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hoja de Práctica */}
              <div className="rounded-2xl border border-white/15 bg-black/40 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <Flame size={15} /> Hoja de Práctica en Mesa de Trabajo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <span className="block text-[10px] text-zinc-400 uppercase">Material Necesario</span>
                    <span className="mt-0.5 block text-xs font-bold text-white">
                      {activeClass.workshopPractice.materialNeeded}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <span className="block text-[10px] text-zinc-400 uppercase">Electrodo & Polaridad</span>
                    <span className="mt-0.5 block text-xs font-bold text-yellow-300">
                      {activeClass.workshopPractice.electrodeAndPolarity}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <span className="block text-[10px] text-zinc-400 uppercase">Amperaje Sugerido</span>
                    <span className="mt-0.5 block text-xs font-bold tabular-nums text-white">
                      {activeClass.workshopPractice.amperageRange}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-bold text-zinc-300">Paso a Paso del Ejercicio:</span>
                  {activeClass.workshopPractice.stepByStep.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-zinc-950">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs">
                  <strong className="text-emerald-300">Criterio de Aprobación: </strong>
                  <span className="text-zinc-200">{activeClass.workshopPractice.qualityCheck}</span>
                </div>
              </div>

              {/* Secretos & Videos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Secreto de Maestro Herrero
                  </span>
                  {activeClass.proTips.map((tip, idx) => (
                    <p key={idx} className="text-xs leading-relaxed text-zinc-200 italic">
                      &ldquo;{tip}&rdquo;
                    </p>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Videoteca Técnica de Referencia
                  </span>
                  {activeClass.videoSearchQueries.map((vid, idx) => (
                    <a
                      key={idx}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(vid.query)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs transition hover:border-yellow-400/40 hover:bg-yellow-400/10"
                    >
                      <div>
                        <div className="font-bold text-white">{vid.title}</div>
                        <div className="text-[10px] text-zinc-400">Ref: {vid.channelRef}</div>
                      </div>
                      <ExternalLink size={13} className="text-yellow-400" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA 2: MANUAL DE REFERENCIA DE BOLSILLO */
        <div className="space-y-6">
          {/* Electrodos AWS */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase">
              1. Comparativa Técnica de Electrodos AWS (E6013 vs E6011 vs E7018)
            </h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {ELECTRODE_MASTER_TABLE.map((elec) => (
                <div
                  key={elec.awsCode}
                  className="flex flex-col justify-between rounded-2xl border border-white/15 bg-black/40 p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-white">{elec.awsCode}</span>
                      <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                        {elec.tensileStrengthPSI}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-300">{elec.commonName}</div>
                    <div className="space-y-1 text-xs">
                      <div>
                        <strong className="text-zinc-400">Polaridad: </strong>
                        <span className="text-zinc-200">{elec.polarity}</span>
                      </div>
                      <div>
                        <strong className="text-zinc-400">Amperaje 3/32&quot;: </strong>
                        <span className="font-bold tabular-nums text-yellow-300">{elec.amperage3_32}</span>
                      </div>
                      <div>
                        <strong className="text-zinc-400">Amperaje 1/8&quot;: </strong>
                        <span className="font-bold tabular-nums text-yellow-300">{elec.amperage1_8}</span>
                      </div>
                      <div>
                        <strong className="text-zinc-400">Uso Mérida: </strong>
                        <span className="text-zinc-200">{elec.idealUseInMerida}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-2.5 text-[11px] text-yellow-200">
                    <strong>Regla de Taller:</strong> {elec.workshopTip}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aceros Comerciales */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase">
              2. Guía de Materiales Comerciales en Mostrador (Mérida)
            </h3>
            <div className="space-y-3">
              {STEEL_MATERIALS_GUIDE.map((mat, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-yellow-400">{mat.category}</h4>
                    <span className="text-zinc-400 font-mono text-[11px]">{mat.commonGauges}</span>
                  </div>
                  <p className="text-zinc-300">
                    <strong>En mostrador:</strong> {mat.commercialNames}
                  </p>
                  <p className="text-zinc-300">
                    <strong>Soldabilidad:</strong> {mat.weldability}
                  </p>
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2 text-amber-200 text-[11px]">
                    <strong>Protocolo Mérida:</strong> {mat.meridaCorrosionWarning}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fallas */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase">
              3. Diagnóstico Rápido de Defectos en Taller
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {WELD_TROUBLESHOOTING.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-1">
                  <div className="font-bold text-rose-300">Problema: {item.symptom}</div>
                  <div className="text-zinc-400">
                    <strong>Causa:</strong> {item.cause}
                  </div>
                  <div className="text-emerald-300">
                    <strong>Solución:</strong> {item.fix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
