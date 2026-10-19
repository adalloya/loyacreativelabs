// src/components/ui/Tooltip.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

export function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al tocar fuera en pantallas táctiles
  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [show]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-zinc-500 hover:text-white transition-colors focus:outline-none p-0.5 active:scale-95"
        aria-label="Información técnica"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {show && (
        <>
          {/* Backdrop invisible para móviles */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setShow(false)}
          />

          {/* Caja de Tooltip segura para móviles: se ancla a la derecha para no salirse de la pantalla */}
          <div className="absolute bottom-full mb-2.5 right-0 sm:left-1/2 sm:-translate-x-1/2 w-64 max-w-[calc(100vw-2.5rem)] p-3 bg-[#18181B]/95 border border-white/20 text-zinc-200 text-xs rounded-2xl shadow-2xl z-50 font-sans leading-relaxed backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            {text}
            {/* Flecha indicadora orientada */}
            <div className="absolute top-full right-2 sm:left-1/2 sm:-translate-x-1/2 border-4 border-transparent border-t-[#18181B]" />
          </div>
        </>
      )}
    </div>
  );
}
