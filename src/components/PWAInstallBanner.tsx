'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, X } from 'lucide-react';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previene que Chrome muestre el banner automático feo
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar si ya está instalada como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Muestra el prompt nativo del sistema operativo (Android / Chrome)
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4 text-white">
        
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-[#111111] shrink-0 shadow-lg shadow-red-950/20">
            <Image
              src="/apex-logo.png"
              alt="APEX"
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight">Instalar APEX</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Acceso instantáneo sin barra de navegador.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-white hover:bg-zinc-200 text-black font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Instalar
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
