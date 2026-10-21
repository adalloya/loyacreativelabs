'use client';

import React from 'react';
import Image from 'next/image';

export type OperatorName = 'Adal' | 'Marco';

interface OperatorSelectorProps {
  isOpen: boolean;
  onSelect: (operator: OperatorName) => void;
}

export default function OperatorSelector({ isOpen, onSelect }: OperatorSelectorProps) {
  if (!isOpen) return null;

  const operators: Array<{
    name: OperatorName;
    role: string;
    badge: string;
    focus: string;
  }> = [
    {
      name: 'Adal',
      role: 'Co-Fundador & Operador',
      badge: 'Clase 5 / 14',
      focus: 'Diseño Residencial, Cotizaciones, Finanzas & Armado',
    },
    {
      name: 'Marco',
      role: 'Co-Fundador & Operador',
      badge: 'Clase 5 / 14',
      focus: 'Taller, Corte de Precisión, Soldadura & Instalación',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-3xl">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/20 bg-white/[0.07] p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-yellow-400/40 bg-black shadow-xl shadow-yellow-500/20">
              <Image
                src="/logo-arco-maestro.png"
                alt="Arco Maestro"
                width={56}
                height={56}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
          <span className="inline-block rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-yellow-300">
            Configuración Única de Dispositivo
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Arco Maestro · AI Welding
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Selecciona quién utiliza este dispositivo para registrar automáticamente gastos, tickets, cotizaciones y prácticas de taller.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {operators.map((op) => (
            <button
              key={op.name}
              onClick={() => onSelect(op.name)}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.05] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-yellow-400/50 hover:bg-white/[0.12] hover:shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/10 text-xl font-bold text-yellow-400 group-hover:bg-yellow-400 group-hover:text-zinc-950 transition-colors">
                    {op.name[0]}
                  </div>
                  <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-300">
                    {op.badge}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-bold text-white">{op.name}</h2>
                <p className="text-xs font-medium text-yellow-400">{op.role}</p>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">{op.focus}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold text-white">
                <span>Entrar como {op.name}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
