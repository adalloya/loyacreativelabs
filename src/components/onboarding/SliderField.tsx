// src/components/onboarding/SliderField.tsx
'use client';

import React from 'react';

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (val: number) => void;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{label}</label>
        <span className="font-mono text-base font-bold text-white">
          {value} <span className="text-xs text-zinc-500 font-normal">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
      />
    </div>
  );
}
