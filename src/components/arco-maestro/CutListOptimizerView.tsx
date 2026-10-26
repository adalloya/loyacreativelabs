'use client';

import React, { useState } from 'react';
import {
  CutRequestItem,
  optimizeLinearCuts1D,
  StockBarAllocation,
  CutOptimizationResult,
} from '@/lib/arco-maestro/steel-formulas';
import {
  Scissors,
  Plus,
  Trash2,
  Share2,
  Check,
  Layers,
} from 'lucide-react';

export default function CutListOptimizerView() {
  const [requests, setRequests] = useState<CutRequestItem[]>([
    { id: '1', length_m: 3.0, label: 'Poste Columna Frontal (PTR 3x3)', quantity: 2 },
    { id: '2', length_m: 2.6, label: 'Poste Columna Posterior (PTR 3x3)', quantity: 2 },
    { id: '3', length_m: 4.0, label: 'Viga Maestra Frontal (PTR 4x2)', quantity: 2 },
    { id: '4', length_m: 5.0, label: 'Larguero Montén C (4x2)', quantity: 5 },
  ]);

  const [kerf_mm, setKerf_mm] = useState<number>(3);
  const [newLen, setNewLen] = useState<string>('3.0');
  const [newLabel, setNewLabel] = useState<string>('Pieza Taller');
  const [newCount, setNewCount] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  // Ejecutar optimización FFD en barras comerciales de 6m
  const result: CutOptimizationResult = optimizeLinearCuts1D(requests, 6.0, kerf_mm);

  const handleAddPiece = () => {
    const len = parseFloat(newLen);
    if (!isNaN(len) && len > 0 && len <= 6.0) {
      setRequests([
        ...requests,
        {
          id: Date.now().toString(),
          length_m: len,
          label: newLabel || `Pieza ${requests.length + 1}`,
          quantity: newCount > 0 ? newCount : 1,
        },
      ]);
      setNewLen('3.0');
      setNewLabel('');
      setNewCount(1);
    }
  };

  const handleRemovePiece = (id: string) => {
    setRequests(requests.filter((p) => p.id !== id));
  };

  const handleCopyWhatsApp = () => {
    let text = `📋 *PLAN DE CORTES Y TRAMOS DE 6.00M*\n`;
    text += `Total Tramos Comerciales Requeridos: ${result.totalBarsNeeded} barras de 6.00m\n`;
    text += `Aprovechamiento Global: ${result.overallEfficiencyPercent}%\n`;
    text += `Sobrantes / Retales: ${result.totalWasteMeters.toFixed(2)}m\n\n`;

    text += `*DIAGRAMA DE CORTE POR BARRA:*\n`;
    result.bars.forEach((bar) => {
      text += `• *Barra ${bar.barNumber}:* `;
      const cuts = bar.cuts.map((c) => `${c.label} (${c.length_m}m)`).join(' + ');
      text += `${cuts} | *Sobrante: ${bar.waste_m}m*\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const totalCuts = requests.reduce((acc, p) => acc + p.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Resumen Principal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-2xl">
          <span className="text-zinc-400 text-xs font-semibold block">Tramos Comerciales (6.00m)</span>
          <span className="text-3xl font-black text-yellow-400 tabular-nums">
            {result.totalBarsNeeded}{' '}
            <span className="text-xs font-medium text-zinc-300">barras</span>
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            Cada barra rinde 6.00 metros de acero estándar
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-2xl">
          <span className="text-zinc-400 text-xs font-semibold block">Aprovechamiento Global</span>
          <span className="text-3xl font-black text-emerald-400 tabular-nums">
            {result.overallEfficiencyPercent}%
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            {result.totalWasteMeters.toFixed(2)} m en retales aprovechables
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-2xl">
          <span className="text-zinc-400 text-xs font-semibold block">Grosor Disco de Corte (Kerf)</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-sky-400 tabular-nums">{kerf_mm} mm</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((k) => (
                <button
                  key={k}
                  onClick={() => setKerf_mm(k)}
                  className={`rounded-lg px-2 py-0.5 text-xs font-bold transition ${
                    kerf_mm === k ? 'bg-sky-400 text-zinc-950' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {k}mm
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Descuento físico por pasada de disco</p>
        </div>
      </div>

      {/* Editor de Piezas a Cortar */}
      <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-2xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Scissors size={16} className="text-yellow-400" />
            <span>Lista de Despiece (Piezas a Medida)</span>
          </h4>
          <span className="text-xs text-zinc-400">{totalCuts} cortes totales</span>
        </div>

        {/* Input para agregar pieza personalizada */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <input
            type="text"
            placeholder="Etiqueta (ej. Poste, Viga)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-yellow-400 focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="6.0"
              placeholder="Medida (m)"
              value={newLen}
              onChange={(e) => setNewLen(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-yellow-400 focus:outline-none tabular-nums"
            />
            <span className="text-zinc-400 font-bold">m</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-400 text-[11px]">Cant:</span>
            <input
              type="number"
              min="1"
              value={newCount}
              onChange={(e) => setNewCount(parseInt(e.target.value) || 1)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none tabular-nums"
            />
          </div>
          <button
            onClick={handleAddPiece}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-yellow-400 text-zinc-950 font-extrabold py-2 hover:bg-yellow-300 transition"
          >
            <Plus size={14} />
            <span>Agregar</span>
          </button>
        </div>

        {/* Tabla de piezas */}
        <div className="space-y-1.5 pt-2">
          {requests.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">{p.label}</span>
                <span className="text-zinc-400">
                  {p.length_m} m ({Math.round(p.length_m * 1000)} mm)
                </span>
                <span className="rounded-lg bg-yellow-400/20 text-yellow-300 px-2 py-0.5 text-[10px] font-bold">
                  x{p.quantity}
                </span>
              </div>
              <button
                onClick={() => handleRemovePiece(p.id)}
                className="text-zinc-500 hover:text-rose-400 transition p-1"
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Diagramas Visuales de Corte por Tramo de 6 Metros */}
      <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-2xl space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Layers size={16} className="text-yellow-400" />
              <span>Diagrama de Corte por Barra de 6.00m (1D Bin Packing)</span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Distribución calculada para minimizar desperdicio y agrupar retales utilizables
            </p>
          </div>

          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-extrabold px-3 py-2 text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copied ? '¡Copiado!' : 'Copiar Plan de Cortes'}</span>
          </button>
        </div>

        {/* Barras de 6m */}
        <div className="space-y-4 pt-2">
          {result.bars.map((bar) => {
            return (
              <div
                key={bar.barNumber}
                className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-white">
                    Tramo #{bar.barNumber} (6.00 m)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Aprovechado:{' '}
                    <span className="text-emerald-400 font-bold">
                      {bar.usedLength_m.toFixed(2)} m ({bar.efficiencyPercent}%)
                    </span>{' '}
                    | Sobrante útil:{' '}
                    <span className="text-yellow-400 font-bold">{bar.waste_m.toFixed(2)} m</span>
                  </span>
                </div>

                {/* Barra Visual Proporcional */}
                <div className="relative flex h-10 w-full overflow-hidden rounded-xl border border-white/20 bg-zinc-900 p-0.5">
                  {bar.cuts.map((cut, cIdx) => {
                    const widthPct = (cut.length_m / 6.0) * 100;
                    return (
                      <div
                        key={cIdx}
                        style={{ width: `${widthPct}%` }}
                        className="relative flex h-full items-center justify-center border-r-2 border-zinc-950 bg-yellow-400 text-zinc-950 font-black text-[10px] px-1 overflow-hidden truncate shadow-inner"
                        title={`${cut.label}: ${cut.length_m}m`}
                      >
                        <span className="truncate">
                          {cut.label} ({cut.length_m}m)
                        </span>
                      </div>
                    );
                  })}

                  {/* Espacio Sobrante / Retal */}
                  {bar.waste_m > 0 && (
                    <div
                      style={{ width: `${(bar.waste_m / 6.0) * 100}%` }}
                      className="flex h-full items-center justify-center bg-zinc-800/80 text-zinc-400 font-semibold text-[10px] px-1 border-dashed border-l border-white/10 truncate"
                    >
                      <span className="truncate">Retal {bar.waste_m.toFixed(2)}m</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
