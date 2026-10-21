'use client';

import React, { useState, useMemo } from 'react';
import {
  INITIAL_STEEL_CATALOG,
  GAUGE_TO_MM,
  INCH_FRACTIONS_TO_MM,
  optimizeLinearCuts1D,
  calculateMeridaProjectQuote,
  calculateFrameDiagonal,
  calculateMiter45InnerLength,
  CutRequestItem,
} from '@/lib/arco-maestro/steel-formulas';
import { supabase } from '@/lib/supabase';
import { OperatorName } from '@/lib/arco-maestro/database.types';
import { Plus, Trash2, ShieldCheck, Check, Sparkles, Sliders, Ruler, RefreshCw } from 'lucide-react';

export default function SteelCalculator({ activeOperator }: { activeOperator: OperatorName }) {
  const [activeTab, setActiveTab] = useState<'optimizer' | 'converters'>('optimizer');

  // Estado del perfil seleccionado y precio editable
  const [selectedProfileId, setSelectedProfileId] = useState<string>(INITIAL_STEEL_CATALOG[2].id);
  const selectedProfile = useMemo(
    () => INITIAL_STEEL_CATALOG.find((p) => p.id === selectedProfileId) || INITIAL_STEEL_CATALOG[0],
    [selectedProfileId]
  );
  const [customPricePer6m, setCustomPricePer6m] = useState<number>(selectedProfile.defaultPricePer6m);

  const handleProfileChange = (id: string) => {
    setSelectedProfileId(id);
    const found = INITIAL_STEEL_CATALOG.find((p) => p.id === id);
    if (found) setCustomPricePer6m(found.defaultPricePer6m);
  };

  // Lista de cortes
  const [cutItems, setCutItems] = useState<CutRequestItem[]>([
    { id: '1', label: 'Largueros Verticales Marco', length_m: 2.20, quantity: 2 },
    { id: '2', label: 'Cabezales Horizontales Marco', length_m: 1.85, quantity: 2 },
    { id: '3', label: 'Refuerzos Intermedios', length_m: 1.75, quantity: 3 },
  ]);

  const [newCutLabel, setNewCutLabel] = useState('');
  const [newCutLength, setNewCutLength] = useState<string>('1.50');
  const [newCutQty, setNewCutQty] = useState<string>('2');

  // Parámetros de cotización Mérida
  const [clientName, setClientName] = useState<string>('Residencia Temozón Norte');
  const [zoneMerida, setZoneMerida] = useState<string>('Temozón Norte');
  const [meridaSpec, setMeridaSpec] = useState<boolean>(true);
  const [workshopDays, setWorkshopDays] = useState<number>(3);
  const [dailyCost, setDailyCost] = useState<number>(1200);
  const [freightCost, setFreightCost] = useState<number>(850);
  const [marginPercent, setMarginPercent] = useState<number>(35);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Estados de herramientas rápidas
  const [frameWidth, setFrameWidth] = useState<number>(3.0);
  const [frameHeight, setFrameHeight] = useState<number>(2.2);
  const [miterOuterMm, setMiterOuterMm] = useState<number>(2000);
  const [miterProfileFaceMm, setMiterProfileFaceMm] = useState<number>(50.8);

  // Algoritmo Bin Packing 1D
  const optimizationResult = useMemo(() => {
    return optimizeLinearCuts1D(cutItems, 6.0, 3.0);
  }, [cutItems]);

  // Cotizador
  const quoteBreakdown = useMemo(() => {
    const totalCuts = cutItems.reduce((acc, item) => acc + item.quantity, 0);
    return calculateMeridaProjectQuote({
      totalBars6m: optimizationResult.totalBarsNeeded,
      pricePerBar6m: customPricePer6m,
      weightPerBar6m: selectedProfile.weight_per_6m,
      totalCutsCount: totalCuts,
      includeMeridaAnticorrosiveSpec: meridaSpec,
      estimatedWorkshopDays: workshopDays,
      dailyCrewCostMXN: dailyCost,
      freightAndInstallMXN: freightCost,
      marginPercent,
    });
  }, [
    optimizationResult.totalBarsNeeded,
    customPricePer6m,
    selectedProfile.weight_per_6m,
    cutItems,
    meridaSpec,
    workshopDays,
    dailyCost,
    freightCost,
    marginPercent,
  ]);

  const diagonalResult = useMemo(
    () => calculateFrameDiagonal(frameWidth, frameHeight),
    [frameWidth, frameHeight]
  );

  const miterResult = useMemo(
    () => calculateMiter45InnerLength(miterOuterMm, miterProfileFaceMm),
    [miterOuterMm, miterProfileFaceMm]
  );

  const addCutItem = () => {
    const lengthNum = parseFloat(newCutLength);
    const qtyNum = parseInt(newCutQty, 10);
    if (!lengthNum || lengthNum <= 0 || !qtyNum || qtyNum <= 0) return;

    setCutItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: newCutLabel.trim() || `Pieza ${prev.length + 1}`,
        length_m: lengthNum,
        quantity: qtyNum,
      },
    ]);
    setNewCutLabel('');
  };

  const removeCutItem = (id: string) => {
    setCutItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveQuoteToSupabase = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const { error } = await supabase.from('quotes').insert({
        client_name: clientName,
        zone_merida: zoneMerida,
        has_anticorrosive_primer: meridaSpec,
        materials_json: {
          profile: selectedProfile.name,
          barsNeeded: optimizationResult.totalBarsNeeded,
          totalLinearMeters: optimizationResult.totalLinearMetersCut,
          wasteMeters: optimizationResult.totalWasteMeters,
          cuts: cutItems,
        },
        consumables_cost: quoteBreakdown.consumables.consumablesTotalMXN,
        labor_cost: quoteBreakdown.laborCostMXN,
        margin_percent: marginPercent,
        total_mxn: quoteBreakdown.finalClientPriceMXN,
        created_by: activeOperator,
      });

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert('Error guardando en Supabase: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Selector superior estilo iOS Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.04] p-2 backdrop-blur-2xl">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'optimizer'
                ? 'bg-yellow-400 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Optimizador 6.00m & Cotizador Mérida
          </button>
          <button
            onClick={() => setActiveTab('converters')}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'converters'
                ? 'bg-yellow-400 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tablas de Calibre & Cuadratura
          </button>
        </div>

        <div className="px-3 text-xs text-zinc-400">
          Operador: <span className="font-bold text-yellow-400">{activeOperator}</span>
        </div>
      </div>

      {activeTab === 'optimizer' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* COLUMNA IZQUIERDA: Perfil Comercial & Despiece 1D */}
          <div className="space-y-6 lg:col-span-7">
            {/* Tarjeta 1: Perfil de Catálogo */}
            <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-xl">
              <h3 className="text-sm font-bold tracking-tight text-white uppercase flex items-center gap-2">
                <Sliders size={16} className="text-yellow-400" />
                1. Selección de Perfil Comercial (Tramo 6.00 m)
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-400">
                    Perfil del Catálogo México / Yucatán
                  </label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-900/90 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-yellow-400 focus:outline-none"
                  >
                    {INITIAL_STEEL_CATALOG.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} — {profile.weight_per_6m} kg/tramo
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400">
                    Precio Tramo 6m (MXN)
                  </label>
                  <input
                    type="number"
                    value={customPricePer6m}
                    onChange={(e) => setCustomPricePer6m(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs sm:text-sm font-bold tabular-nums text-yellow-300 focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Ficha rápida de especificaciones */}
              <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase">Espesor</span>
                  <span className="text-xs font-bold tabular-nums text-white">
                    {selectedProfile.thickness_mm} mm
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase">Peso Lineal</span>
                  <span className="text-xs font-bold tabular-nums text-white">
                    {selectedProfile.weight_kg_per_m} kg/m
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase">Barra 6m</span>
                  <span className="text-xs font-bold tabular-nums text-white">
                    {selectedProfile.weight_per_6m} kg
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase">Protección</span>
                  <span className="text-xs font-bold text-yellow-400">
                    {selectedProfile.isGalvanized ? 'Zintro' : 'Negro'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Captura de Cortes & Algoritmo Bin Packing */}
            <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white uppercase flex items-center gap-2">
                  <Ruler size={16} className="text-yellow-400" />
                  2. Despiece & Optimizador (Kerf 3mm)
                </h3>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-0.5 text-xs font-bold tabular-nums text-emerald-300">
                  Eficiencia: {optimizationResult.overallEfficiencyPercent}%
                </span>
              </div>

              {/* Formulario de adición */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                <input
                  type="text"
                  placeholder="Etiqueta (ej. Poste Marco)"
                  value={newCutLabel}
                  onChange={(e) => setNewCutLabel(e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 sm:col-span-5 focus:outline-none focus:border-yellow-400"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Largo (m)"
                  value={newCutLength}
                  onChange={(e) => setNewCutLength(e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs tabular-nums text-white sm:col-span-3 focus:outline-none focus:border-yellow-400"
                />
                <input
                  type="number"
                  placeholder="Cant."
                  value={newCutQty}
                  onChange={(e) => setNewCutQty(e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs tabular-nums text-white sm:col-span-2 focus:outline-none focus:border-yellow-400"
                />
                <button
                  onClick={addCutItem}
                  className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-bold text-zinc-950 transition hover:bg-yellow-300 sm:col-span-2 flex items-center justify-center gap-1 shadow-md"
                >
                  <Plus size={14} /> Añadir
                </button>
              </div>

              {/* Lista de cortes requeridos */}
              <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                {cutItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <div>
                      <span className="font-semibold text-white">{item.label}</span>
                      <span className="ml-3 font-mono text-zinc-400">
                        {item.quantity} pzas × {item.length_m.toFixed(2)} m ={' '}
                        {(item.quantity * item.length_m).toFixed(2)} m lineales
                      </span>
                    </div>
                    <button
                      onClick={() => removeCutItem(item.id)}
                      className="text-zinc-500 hover:text-rose-400 transition"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Mapa de corte visual de barras de 6.00m */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    Comprar: <strong className="text-white">{optimizationResult.totalBarsNeeded} tramos de 6.00 m</strong>
                  </span>
                  <span>
                    Merma Total: <strong className="text-amber-300 font-mono">{optimizationResult.totalWasteMeters} m</strong>
                  </span>
                </div>

                {optimizationResult.bars.map((bar) => (
                  <div key={bar.barNumber} className="space-y-1.5 rounded-2xl border border-white/10 bg-black/40 p-3">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-zinc-200">
                        Barra #{bar.barNumber} (Cortes: {bar.usedLength_m}m · Merma: {bar.waste_m}m)
                      </span>
                      <span className="tabular-nums font-mono text-zinc-400">
                        {bar.efficiencyPercent}% aprovechado
                      </span>
                    </div>

                    <div className="flex h-7 w-full overflow-hidden rounded-lg bg-zinc-900 p-0.5 border border-white/5">
                      {bar.cuts.map((cut, idx) => {
                        const widthPct = (cut.length_m / 6.0) * 100;
                        return (
                          <div
                            key={idx}
                            style={{ width: `${widthPct}%` }}
                            title={`${cut.label}: ${cut.length_m}m`}
                            className="mr-0.5 flex items-center justify-center overflow-hidden rounded bg-yellow-500/80 px-1 text-[10px] font-bold tabular-nums text-zinc-950 truncate"
                          >
                            {cut.length_m}m
                          </div>
                        );
                      })}
                      {bar.waste_m > 0 && (
                        <div
                          style={{ width: `${(bar.waste_m / 6.0) * 100}%` }}
                          className="flex items-center justify-center overflow-hidden rounded bg-zinc-800/80 text-[9px] tabular-nums text-zinc-400 font-mono"
                        >
                          {bar.waste_m >= 0.4 ? `${bar.waste_m}m` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Cotizador Residencial Mérida */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold tracking-tight text-white uppercase flex items-center gap-2">
                <ShieldCheck size={16} className="text-yellow-400" />
                3. Cotizador Residencial (Clima Yucatán)
              </h3>

              {/* Datos de cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-zinc-400">Nombre de Cliente / Obra</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400">Zona / Fracc. Mérida</label>
                  <input
                    type="text"
                    value={zoneMerida}
                    onChange={(e) => setZoneMerida(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              {/* Toggle de Especificación Mérida */}
              <div className="flex items-center justify-between rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3.5">
                <div>
                  <span className="block text-xs font-bold text-white">
                    Especificación Mérida (Humedad & Salitre)
                  </span>
                  <span className="text-[11px] text-zinc-300">
                    Primario anticorrosivo epóxico + sellado de juntas con poliuretano
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={meridaSpec}
                  onChange={(e) => setMeridaSpec(e.target.checked)}
                  className="h-5 w-5 accent-yellow-400 cursor-pointer"
                />
              </div>

              {/* Mano de obra y logística */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-zinc-400 text-[11px]">Días de Taller</label>
                  <input
                    type="number"
                    value={workshopDays}
                    onChange={(e) => setWorkshopDays(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 tabular-nums text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-[11px]">Costo Diario Taller ($)</label>
                  <input
                    type="number"
                    value={dailyCost}
                    onChange={(e) => setDailyCost(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 tabular-nums text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-[11px]">Flete e Instalación ($)</label>
                  <input
                    type="number"
                    value={freightCost}
                    onChange={(e) => setFreightCost(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 tabular-nums text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-[11px]">Margen Utilidad (%)</label>
                  <input
                    type="number"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 tabular-nums text-white"
                  />
                </div>
              </div>

              {/* Consumibles automáticos */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 text-xs space-y-1.5 font-mono">
                <div className="font-bold text-zinc-300">Consumibles Calculados Automáticamente:</div>
                <div className="flex justify-between text-zinc-400">
                  <span>Electrodo E6013 estimado:</span>
                  <span className="text-white">{quoteBreakdown.consumables.electrodesKg} kg</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Discos de corte (4½") / Flap:</span>
                  <span className="text-white">
                    {quoteBreakdown.consumables.cuttingDiscs4_5} corte / {quoteBreakdown.consumables.flapDiscs} flap
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Primario + Esmalte:</span>
                  <span className="text-white">
                    {quoteBreakdown.consumables.anticorrosivePrimerLiters}L + {quoteBreakdown.consumables.topCoatEnamelLiters}L
                  </span>
                </div>
                {meridaSpec && (
                  <div className="flex justify-between text-yellow-300">
                    <span>Sellador Poliuretano (Juntas):</span>
                    <span>{quoteBreakdown.consumables.polyurethaneSealantTubes} cartuchos</span>
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="space-y-2 border-t border-white/15 pt-3 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Acero ({optimizationResult.totalBarsNeeded} tramos / {quoteBreakdown.totalWeightKg} kg):</span>
                  <span className="font-bold tabular-nums">${quoteBreakdown.steelCostMXN.toLocaleString('es-MX')}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Consumibles & Pintura:</span>
                  <span className="font-bold tabular-nums">${quoteBreakdown.consumables.consumablesTotalMXN.toLocaleString('es-MX')}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Mano de Obra & Logística:</span>
                  <span className="font-bold tabular-nums">
                    ${(quoteBreakdown.laborCostMXN + quoteBreakdown.installationAndFreightMXN).toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="flex justify-between text-yellow-400 font-bold">
                  <span>Utilidad Neta Taller ({marginPercent}%):</span>
                  <span className="tabular-nums">+${quoteBreakdown.profitAmountMXN.toLocaleString('es-MX')}</span>
                </div>

                <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-300">Total Cliente</span>
                    <span className="text-xl sm:text-2xl font-black tabular-nums text-white">
                      ${quoteBreakdown.finalClientPriceMXN.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-[11px] text-zinc-400">
                    <span>Con IVA Facturado (16%):</span>
                    <span className="font-semibold tabular-nums text-zinc-200">
                      ${quoteBreakdown.finalClientPriceWithIvaMXN.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSaveQuoteToSupabase}
                  disabled={isSaving}
                  className="w-full rounded-2xl bg-yellow-400 py-3 text-xs font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Guardando en Supabase...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check size={14} /> ¡Cotización Guardada en Supabase!
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Guardar Cotización en Supabase
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PESTAÑA 2: CONVERTIDORES DE TALLER, CALIBRES & CUADRATURA */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Cuadratura Pitágoras & Corte 45 */}
          <div className="space-y-6 rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Ruler size={16} className="text-yellow-400" />
              Cuadratura de Marcos (Pitágoras) & Cortes a 45°
            </h3>

            {/* Pitágoras */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
              <div className="text-xs font-bold text-yellow-400">
                1. Verificador de Escuadra por Diagonales
              </div>
              <p className="text-xs text-zinc-400">
                Mide ambas diagonales con flexómetro antes de soldar cordones definitivos. Ambas deben medir exactamente lo mismo para garantizar 90° perfectos.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 text-[11px]">Ancho Exterior (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={frameWidth}
                    onChange={(e) => setFrameWidth(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 tabular-nums text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-[11px]">Alto Exterior (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={frameHeight}
                    onChange={(e) => setFrameHeight(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 tabular-nums text-white"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-center">
                <span className="block text-[11px] text-zinc-300">Medida de Ambas Diagonales:</span>
                <span className="text-lg font-bold tabular-nums text-white">
                  {diagonalResult.diagonal_m} m ({diagonalResult.diagonal_cm} cm / {diagonalResult.diagonal_mm} mm)
                </span>
              </div>
            </div>

            {/* Corte a 45 grados */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
              <div className="text-xs font-bold text-yellow-400">
                2. Medida Interior en Corte a Inglete (45° en ambos extremos)
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 text-[11px]">Largo Exterior Deseado (mm)</label>
                  <input
                    type="number"
                    value={miterOuterMm}
                    onChange={(e) => setMiterOuterMm(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 tabular-nums text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-[11px]">Cara del Perfil (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={miterProfileFaceMm}
                    onChange={(e) => setMiterProfileFaceMm(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 tabular-nums text-white"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
                <span className="block text-[11px] text-zinc-300">Medida Interior Corta a Corta:</span>
                <span className="text-lg font-bold tabular-nums text-white">
                  {miterResult.innerLength_mm} mm
                </span>
              </div>
            </div>
          </div>

          {/* Tabla Maestra de Calibres & Amperajes */}
          <div className="space-y-6 rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl">
            <h3 className="text-sm font-bold text-white uppercase">
              Tabla Maestra de Calibres y Amperajes (E6013)
            </h3>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/10 text-zinc-300">
                  <tr>
                    <th className="px-3 py-2">Calibre</th>
                    <th className="px-3 py-2">Espesor (mm)</th>
                    <th className="px-3 py-2">Pulgadas</th>
                    <th className="px-3 py-2">Amperaje Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-black/30 tabular-nums">
                  {Object.entries(GAUGE_TO_MM).map(([gauge, data]) => (
                    <tr key={gauge} className="hover:bg-white/5">
                      <td className="px-3 py-2 font-bold text-yellow-400">Cal. {gauge}</td>
                      <td className="px-3 py-2 text-white">{data.mm.toFixed(2)} mm</td>
                      <td className="px-3 py-2 text-zinc-400">{data.inchesDecimal}&quot;</td>
                      <td className="px-3 py-2 text-zinc-200">{data.recommendedAmps6013}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Fracciones de Pulgada a Milímetros
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs tabular-nums">
              {INCH_FRACTIONS_TO_MM.slice(0, 12).map((item) => (
                <div key={item.fraction} className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <span className="block font-bold text-white">{item.fraction}</span>
                  <span className="text-zinc-400 text-[11px]">{item.mm.toFixed(2)} mm</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
