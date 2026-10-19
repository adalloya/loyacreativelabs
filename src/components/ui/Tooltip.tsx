// src/components/ui/Tooltip.tsx
'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

export function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-zinc-500 hover:text-white transition-colors focus:outline-none"
        aria-label="Información técnica"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 p-2.5 bg-zinc-900 border border-white/15 text-zinc-300 text-[11px] rounded-xl shadow-2xl z-50 pointer-events-none font-sans leading-relaxed backdrop-blur-md">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
}
