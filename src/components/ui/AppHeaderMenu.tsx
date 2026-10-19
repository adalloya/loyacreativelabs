// src/components/ui/AppHeaderMenu.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Menu, X, Download, Shield, Sliders } from 'lucide-react';

export function AppHeaderMenu({ 
  environmentMode, 
  onEnvironmentChange, 
  onInstallClick, 
  showInstallButton 
}: { 
  environmentMode: string;
  onEnvironmentChange: (mode: string) => void;
  onInstallClick: () => void;
  showInstallButton: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      {/* Botón de tres rayitas (Hamburguesa) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.1] hover:border-white/30 text-white p-2.5 sm:p-3 rounded-2xl transition-all shadow-lg flex items-center justify-center active:scale-95"
        aria-label="Menú principal"
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Menú desplegable tipo iOS / Tesla */}
      {isOpen && (
        <>
          {/* Backdrop invisible para cerrar al hacer clic afuera */}
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="absolute right-0 mt-3 w-72 bg-[#121214]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-5 shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Cabecera del Menú con Logo APEX */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="relative w-6 h-6 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0">
                  <Image
                    src="/apex-logo.png"
                    alt="APEX"
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-mono tracking-widest uppercase text-white font-bold">APEX</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                MENU
              </span>
            </div>

            {/* Selector de Disposición / Entorno dentro del menú */}
            <div className="mb-5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">
                Disposición / Entorno Activo
              </label>
              <div className="grid grid-cols-1 gap-1.5 font-mono text-xs">
                {[
                  { id: 'full_gym', label: 'Gimnasio Completo' },
                  { id: 'hotel_gym', label: 'Hotel (Mancuernas)' },
                  { id: 'bodyweight', label: 'Peso Corporal' },
                ].map((env) => (
                  <button
                    key={env.id}
                    onClick={() => {
                      onEnvironmentChange(env.id);
                      setIsOpen(false);
                    }}
                    className={`text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                      environmentMode === env.id
                        ? 'bg-white text-black font-semibold'
                        : 'bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span>{env.label}</span>
                    {environmentMode === env.id && <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón de Instalar PWA (Aparece si el navegador permite la instalación o para abrir modal) */}
            {showInstallButton && (
              <div className="pt-3 border-t border-white/[0.08]">
                <button
                  onClick={() => {
                    onInstallClick();
                    setIsOpen(false);
                  }}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>Instalar Aplicación PWA</span>
                </button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>APEX // V2.5</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3 h-3 text-emerald-400" /> Seguro
              </span>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
