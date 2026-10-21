'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OperatorName } from '@/lib/arco-maestro/database.types';
import SteelCalculator from '@/components/arco-maestro/SteelCalculator';
import AcademyView from '@/components/arco-maestro/AcademyView';
import FinanceTracker from '@/components/arco-maestro/FinanceTracker';
import ARVisualizerStudio from '@/components/arco-maestro/ARVisualizerStudio';
import OpenSourceDiagramsLibrary from '@/components/arco-maestro/OpenSourceDiagramsLibrary';
import SpotifyWeldingPlayer from '@/components/arco-maestro/SpotifyWeldingPlayer';
import OperatorSelector from '@/components/arco-maestro/OperatorSelector';
import {
  Flame,
  ArrowLeft,
  Sliders,
  BookOpen,
  DollarSign,
  FileCode,
  Users,
  Eye,
} from 'lucide-react';

const STORAGE_KEY = 'arco_maestro_operator_v1';

export default function ArcoMaestroApp() {
  const [activeOperator, setActiveOperator] = useState<OperatorName>('Adal');
  const [showFirstRunModal, setShowFirstRunModal] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<
    'calculator' | 'academy' | 'finances' | 'ar-studio' | 'diagrams'
  >('calculator');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as OperatorName | null;
    if (saved === 'Adal' || saved === 'Marco') {
      setActiveOperator(saved);
      setShowFirstRunModal(false);
    } else {
      setShowFirstRunModal(true);
    }
  }, []);

  const handleSelectOperator = (op: OperatorName) => {
    setActiveOperator(op);
    localStorage.setItem(STORAGE_KEY, op);
    setShowFirstRunModal(false);
  };

  return (
    <div className="min-h-screen bg-[#07080A] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,179,8,0.12),rgba(56,189,248,0.06),rgba(0,0,0,0))] text-zinc-100 selection:bg-yellow-400 selection:text-zinc-950 pb-24">
      {/* Modal First-Run Adal / Marco */}
      <OperatorSelector isOpen={showFirstRunModal} onSelect={handleSelectOperator} />
      {/* Barra de Navegación Superior Estilo VisionOS / Apple Glass */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Identidad de la App */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition"
              title="Volver a Loya Creative Labs"
            >
              <ArrowLeft size={16} />
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/20 to-black text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]">
              <Flame size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold tracking-tight text-white">
                  Arco Maestro <span className="text-yellow-400 font-medium">· AI Welding</span>
                </h1>
                <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                  Mérida, Yuc.
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Sección Independiente · Taller de Herrería Residencial
              </p>
            </div>
          </div>

          {/* Navegación por Módulos */}
          <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/15 bg-white/[0.04] p-1">
            {[
              { id: 'calculator', label: 'Cotizador & Cortes 6m', icon: Sliders },
              { id: 'academy', label: 'Academia (14 Clases)', icon: BookOpen },
              { id: 'finances', label: 'Finanzas & Tickets IA', icon: DollarSign },
              { id: 'ar-studio', label: 'Estudio AR & Fachadas', icon: Eye },
              { id: 'diagrams', label: 'Diagramas Open Source', icon: FileCode },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentSection(item.id as typeof currentSection)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    currentSection === item.id
                      ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md'
                      : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Selector de Operador Adal / Marco */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/15 bg-white/[0.06] p-1 text-xs">
            <span className="px-2 text-zinc-400 text-[11px] flex items-center gap-1">
              <Users size={12} /> Operador:
            </span>
            <button
              onClick={() => handleSelectOperator('Adal')}
              className={`rounded-xl px-3 py-1 font-bold transition ${
                activeOperator === 'Adal'
                  ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Adal
            </button>
            <button
              onClick={() => handleSelectOperator('Marco')}
              className={`rounded-xl px-3 py-1 font-bold transition ${
                activeOperator === 'Marco'
                  ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Marco
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {currentSection === 'calculator' && <SteelCalculator activeOperator={activeOperator} />}
        {currentSection === 'academy' && <AcademyView />}
        {currentSection === 'finances' && <FinanceTracker activeOperator={activeOperator} />}
        {currentSection === 'ar-studio' && <ARVisualizerStudio />}
        {currentSection === 'diagrams' && <OpenSourceDiagramsLibrary />}
      </main>

      {/* Reproductor Flotante de Spotify para el Taller */}
      <SpotifyWeldingPlayer />
    </div>
  );
}
