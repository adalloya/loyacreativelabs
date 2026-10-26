'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { OperatorName } from '@/lib/arco-maestro/database.types';
import Arco3DStudio from '@/components/arco-maestro/Arco3DStudio';
import CutListOptimizerView from '@/components/arco-maestro/CutListOptimizerView';
import AreaPriceManager from '@/components/arco-maestro/AreaPriceManager';
import AcademyView from '@/components/arco-maestro/AcademyView';
import FinanceTracker from '@/components/arco-maestro/FinanceTracker';
import SpotifyWeldingPlayer from '@/components/arco-maestro/SpotifyWeldingPlayer';
import OperatorSelector from '@/components/arco-maestro/OperatorSelector';
import {
  Box,
  Scissors,
  DollarSign,
  BookOpen,
  ArrowLeft,
  Users,
  Wallet,
} from 'lucide-react';

const STORAGE_KEY = 'arco_maestro_operator_v1';

export default function ArcoMaestroApp() {
  const [activeOperator, setActiveOperator] = useState<OperatorName>('Adal');
  const [showFirstRunModal, setShowFirstRunModal] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<
    'studio-3d' | 'cuts-6m' | 'local-prices' | 'academy' | 'finances'
  >('studio-3d');

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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Identidad de la App */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition"
              title="Volver a Loya Creative Labs"
            >
              <ArrowLeft size={16} />
            </Link>

            <div className="relative h-10 w-10 rounded-2xl overflow-hidden border border-yellow-400/40 bg-black shadow-[0_0_15px_rgba(234,179,8,0.3)] shrink-0">
              <Image
                src="/logo-arco-maestro.png"
                alt="Arco Maestro"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold tracking-tight text-white">
                  Arco Maestro <span className="text-yellow-400 font-medium">· 3D Structural CAD</span>
                </h1>
                <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                  Mérida, Yuc.
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Constructor de Estructuras & Optimizador de Tramos de 6m
              </p>
            </div>
          </div>

          {/* Navegación por Módulos Principales */}
          <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/15 bg-white/[0.04] p-1">
            {[
              { id: 'studio-3d', label: 'Constructor 3D', icon: Box },
              { id: 'cuts-6m', label: 'Despiece & Cortes 6m', icon: Scissors },
              { id: 'local-prices', label: 'Precios de mi Área', icon: DollarSign },
              { id: 'academy', label: 'Manual & Soldadura', icon: BookOpen },
              { id: 'finances', label: 'Finanzas 50/50', icon: Wallet },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentSection(item.id as typeof currentSection)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-yellow-400 text-zinc-950 font-extrabold shadow-md'
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
        {currentSection === 'studio-3d' && (
          <Arco3DStudio
            onOpenCutList={() => setCurrentSection('cuts-6m')}
            onOpenPriceManager={() => setCurrentSection('local-prices')}
          />
        )}
        {currentSection === 'cuts-6m' && <CutListOptimizerView />}
        {currentSection === 'local-prices' && <AreaPriceManager />}
        {currentSection === 'academy' && <AcademyView />}
        {currentSection === 'finances' && <FinanceTracker activeOperator={activeOperator} />}
      </main>

      {/* Reproductor Flotante de Spotify para el Taller */}
      <SpotifyWeldingPlayer />
    </div>
  );
}
