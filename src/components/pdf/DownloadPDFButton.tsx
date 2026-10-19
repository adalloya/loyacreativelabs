// src/components/pdf/DownloadPDFButton.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { WorkoutPDFDocument } from './WorkoutPDFDocument';
import { Download } from 'lucide-react';

interface DownloadPDFButtonProps {
  profile: any;
  routine: any[];
  diet: any;
}

function PDFButtonInner({ profile, routine, diet }: DownloadPDFButtonProps) {
  const [instance] = usePDF({
    document: <WorkoutPDFDocument profile={profile} routine={routine} diet={diet} />
  });

  if (instance.loading) {
    return (
      <button
        disabled
        className="bg-white/10 text-zinc-400 font-mono text-xs px-4 py-2.5 rounded-xl cursor-not-allowed flex items-center gap-2 border border-white/5"
      >
        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <span>GENERANDO BLUEPRINT...</span>
      </button>
    );
  }

  if (instance.error) {
    return <span className="text-xs text-red-400 font-mono">Error al generar PDF</span>;
  }

  return (
    <a
      href={instance.url || '#'}
      download="APEX-Blueprint.pdf"
      className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-white/10 flex items-center gap-2 select-none active:scale-95"
    >
      <Download className="w-4 h-4 text-black" />
      <span>EXPORTAR BLUEPRINT PDF</span>
    </a>
  );
}

export function DownloadPDFButton({ profile, routine, diet }: DownloadPDFButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        disabled
        className="bg-white/10 text-zinc-400 font-mono text-xs px-4 py-2.5 rounded-xl cursor-not-allowed flex items-center gap-2 border border-white/5"
      >
        <Download className="w-4 h-4 text-zinc-500" />
        <span>CARGANDO MOTOR PDF...</span>
      </button>
    );
  }

  return <PDFButtonInner profile={profile} routine={routine} diet={diet} />;
}
