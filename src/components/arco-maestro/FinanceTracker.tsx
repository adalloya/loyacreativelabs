'use client';

import React, { useState, useMemo } from 'react';
import { OperatorName, ExpenseCapexRecord } from '@/lib/arco-maestro/database.types';
import { supabase } from '@/lib/supabase';
import { Camera, Plus, Check, RefreshCw, AlertCircle, Receipt, DollarSign, Wrench } from 'lucide-react';

export interface CapexEquipmentItem {
  id: string;
  category: 'Soldadura' | 'Corte' | 'Sujeción' | 'Seguridad EPP' | 'Pintura' | 'Obra';
  name: string;
  spec: string;
  estimatedCostMXN: number;
  costRangeMXN: string;
  priority: 'Crítica (Fase 1)' | 'Alta (Fase 2)';
  purchased: boolean;
  paidBy?: OperatorName;
}

const INITIAL_CAPEX_LIST: CapexEquipmentItem[] = [
  {
    id: 'cap-1',
    category: 'Soldadura',
    name: 'Soldadora Inversora Multiproceso (MMA / MIG / TIG Lift)',
    spec: '200A, Bivoltaje (110V/220V). Permite electrodo en obra y microalambre en taller',
    estimatedCostMXN: 8500,
    costRangeMXN: '$6,500 – $12,500',
    priority: 'Crítica (Fase 1)',
    purchased: true,
    paidBy: 'Adal',
  },
  {
    id: 'cap-2',
    category: 'Corte',
    name: 'Tronzadora de Metales de 14" (Dry Cut)',
    spec: 'Disco dentado de carburo (bajas RPM): corta a 45° exactos sin rebaba ni deformación térmica',
    estimatedCostMXN: 5400,
    costRangeMXN: '$3,800 – $8,500',
    priority: 'Crítica (Fase 1)',
    purchased: false,
  },
  {
    id: 'cap-3',
    category: 'Corte',
    name: '2 Esmeriladoras Angulares de 4 1/2" (Par)',
    spec: '850W–1,100W. 1 montada con corte fino (1mm) y 1 con disco Flap/desbaste',
    estimatedCostMXN: 2600,
    costRangeMXN: '$2,200 – $3,600',
    priority: 'Crítica (Fase 1)',
    purchased: true,
    paidBy: 'Marco',
  },
  {
    id: 'cap-4',
    category: 'Sujeción',
    name: 'Mesa de Soldadura Nivelada (Fabricación propia)',
    spec: 'Armada en práctica con PTR 2x2" Cal. 11 o canal estructural, nivelada al milímetro',
    estimatedCostMXN: 3500,
    costRangeMXN: '$2,800 – $4,200',
    priority: 'Crítica (Fase 1)',
    purchased: false,
  },
  {
    id: 'cap-5',
    category: 'Sujeción',
    name: 'Kit de Prensas y Escuadras Magnéticas',
    spec: '4 Escuadras magnéticas (50/75 lbs), 4 Prensas C de 6", 2 Pinzas tipo C de 11"',
    estimatedCostMXN: 2200,
    costRangeMXN: '$1,800 – $2,900',
    priority: 'Crítica (Fase 1)',
    purchased: true,
    paidBy: 'Marco',
  },
  {
    id: 'cap-6',
    category: 'Seguridad EPP',
    name: '2 Kits EPP (Caretas True Color + Carnaza + P100)',
    spec: 'Careta 4 sensores DIN 9-13, guantes largos, mandil y respirador P100 para Zintro',
    estimatedCostMXN: 3400,
    costRangeMXN: '$2,800 – $4,500',
    priority: 'Crítica (Fase 1)',
    purchased: true,
    paidBy: 'Adal',
  },
  {
    id: 'cap-7',
    category: 'Pintura',
    name: 'Compresor de Aire 50L + Pistola Gravedad HVLP',
    spec: 'Compresor 50L (2.5 HP) + pistola HVLP boquilla 1.4 mm para primario y esmalte',
    estimatedCostMXN: 5200,
    costRangeMXN: '$4,200 – $6,800',
    priority: 'Alta (Fase 2)',
    purchased: false,
  },
  {
    id: 'cap-8',
    category: 'Obra',
    name: 'Rotomartillo SDS-Plus + Extensión Cal. 10 AWG (15m)',
    spec: 'Perforación en columnas de concreto/laja en Mérida y taladro de banco',
    estimatedCostMXN: 4200,
    costRangeMXN: '$3,500 – $6,000',
    priority: 'Alta (Fase 2)',
    purchased: false,
  },
];

export default function FinanceTracker({ activeOperator }: { activeOperator: OperatorName }) {
  const [capexList, setCapexList] = useState<CapexEquipmentItem[]>(INITIAL_CAPEX_LIST);
  const [expenses, setExpenses] = useState<ExpenseCapexRecord[]>([
    {
      id: 'exp-1',
      expense_date: '2026-10-15',
      vendor: 'Equipos Soldadura Mérida',
      description: 'Inversora 200A + Caretas y Guantes Carnaza',
      item_type: 'Equipo_Inicial',
      amount_mxn: 11900,
      paid_by: 'Adal',
    },
    {
      id: 'exp-2',
      expense_date: '2026-10-17',
      vendor: 'Home Depot Altabrisa',
      description: '2 Esmeriladoras 4.5" + Escuadras Magnéticas + Discos',
      item_type: 'Equipo_Inicial',
      amount_mxn: 4800,
      paid_by: 'Marco',
    },
    {
      id: 'exp-3',
      expense_date: '2026-10-19',
      vendor: 'Aceros Yucatecos',
      description: 'Retacería PTR Cal 14, Zintro R-200 Cal 18 y 5kg E6013 3/32"',
      item_type: 'Material_Obra',
      amount_mxn: 1850,
      paid_by: 'Marco',
    },
  ]);

  // Estados de escáner Gemini
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Registro manual rápido
  const [manualVendor, setManualVendor] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualType, setManualType] = useState<string>('Material_Obra');

  // Cálculo de Balance 50/50
  const financialSummary = useMemo(() => {
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount_mxn), 0);
    const adalSpent = expenses
      .filter((e) => e.paid_by === 'Adal')
      .reduce((sum, e) => sum + Number(e.amount_mxn), 0);
    const marcoSpent = expenses
      .filter((e) => e.paid_by === 'Marco')
      .reduce((sum, e) => sum + Number(e.amount_mxn), 0);

    const fairShare = totalSpent / 2;
    const difference = Math.abs(adalSpent - marcoSpent) / 2;
    const settlementNotice =
      adalSpent > marcoSpent
        ? `Marco debe a Adal: $${difference.toLocaleString('es-MX')} MXN`
        : marcoSpent > adalSpent
        ? `Adal debe a Marco: $${difference.toLocaleString('es-MX')} MXN`
        : 'Cuentas 50/50 al día';

    const totalCapexEstimated = capexList.reduce((sum, item) => sum + item.estimatedCostMXN, 0);
    const totalCapexPurchased = capexList
      .filter((item) => item.purchased)
      .reduce((sum, item) => sum + item.estimatedCostMXN, 0);

    return {
      totalSpent,
      adalSpent,
      marcoSpent,
      fairShare,
      difference,
      settlementNotice,
      totalCapexEstimated,
      totalCapexPurchased,
    };
  }, [expenses, capexList]);

  // Escaneo de Ticket con Gemini Vision
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanMessage('Analizando ticket con Gemini Vision...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operator', activeOperator);

      const res = await fetch('/api/arco-maestro/receipt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Error en el escáner');
      }

      const data = await res.json();

      const newExpense: ExpenseCapexRecord = {
        id: crypto.randomUUID(),
        expense_date: data.date || new Date().toISOString().split('T')[0],
        vendor: data.vendor_name || 'Proveedor Local',
        description: data.summary_description || 'Compra escaneada por ticket',
        item_type: data.category || 'Material_Obra',
        amount_mxn: Number(data.total_mxn) || 0,
        paid_by: activeOperator,
      };

      setExpenses((prev) => [newExpense, ...prev]);

      // Guardar en Supabase
      await supabase.from('expenses_capex').insert(newExpense);

      setScanMessage(`✓ Ticket extraído: $${newExpense.amount_mxn.toLocaleString('es-MX')} (${newExpense.vendor})`);
      setTimeout(() => setScanMessage(null), 4000);
    } catch (err: any) {
      setScanMessage('No se pudo procesar el ticket. Puedes registrarlo manualmente abajo.');
      setTimeout(() => setScanMessage(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddManualExpense = async () => {
    const amt = parseFloat(manualAmount);
    if (!manualVendor.trim() || !amt || amt <= 0) return;

    const newExp: ExpenseCapexRecord = {
      id: crypto.randomUUID(),
      expense_date: new Date().toISOString().split('T')[0],
      vendor: manualVendor.trim(),
      description: manualDesc.trim() || 'Gasto de taller',
      item_type: manualType,
      amount_mxn: amt,
      paid_by: activeOperator,
    };

    setExpenses((prev) => [newExp, ...prev]);
    await supabase.from('expenses_capex').insert(newExp);

    setManualVendor('');
    setManualDesc('');
    setManualAmount('');
  };

  const toggleCapex = (id: string) => {
    setCapexList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              purchased: !item.purchased,
              paidBy: !item.purchased ? activeOperator : undefined,
            }
          : item
      )
    );
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Tarjetas Superiores: Balance 50/50 Adal vs Marco */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-2xl">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Inversión Total</span>
          <div className="mt-1 text-2xl font-black tabular-nums text-white">
            ${financialSummary.totalSpent.toLocaleString('es-MX')} MXN
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">
            50% por socio: ${financialSummary.fairShare.toLocaleString('es-MX')}
          </span>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-2xl">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Aportado por Adal</span>
          <div className="mt-1 text-2xl font-black tabular-nums text-yellow-300">
            ${financialSummary.adalSpent.toLocaleString('es-MX')} MXN
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">
            {((financialSummary.adalSpent / (financialSummary.totalSpent || 1)) * 100).toFixed(1)}% del capital
          </span>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur-2xl">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Aportado por Marco</span>
          <div className="mt-1 text-2xl font-black tabular-nums text-yellow-300">
            ${financialSummary.marcoSpent.toLocaleString('es-MX')} MXN
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">
            {((financialSummary.marcoSpent / (financialSummary.totalSpent || 1)) * 100).toFixed(1)}% del capital
          </span>
        </div>

        <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5 backdrop-blur-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400">
            Ajuste para Cuentas Claras
          </span>
          <div className="mt-1 text-xl font-black tabular-nums text-white">
            {financialSummary.settlementNotice}
          </div>
          <span className="mt-1 block text-[11px] text-zinc-300">
            Mantiene la sociedad 50/50 balanceada
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* COLUMNA IZQUIERDA: Escáner Gemini Vision & Gastos */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                  <Receipt size={16} className="text-yellow-400" />
                  Escáner de Tickets con Cámara (Gemini Vision)
                </h3>
                <p className="text-xs text-zinc-400">
                  Toma foto al ticket de compra y se carga a la cuenta de{' '}
                  <strong className="text-yellow-400">{activeOperator}</strong> en Supabase.
                </p>
              </div>

              <label className="cursor-pointer rounded-2xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-yellow-300 shadow-md flex items-center gap-1.5">
                <Camera size={14} />
                <span>{isScanning ? 'Extrayendo...' : 'Fotografiar Ticket'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleReceiptUpload}
                  disabled={isScanning}
                  className="hidden"
                />
              </label>
            </div>

            {scanMessage && (
              <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-xs text-yellow-200">
                {scanMessage}
              </div>
            )}

            {/* Registro Rápido */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <span className="text-xs font-semibold text-zinc-300">
                O registra un gasto manual (Pagado por {activeOperator}):
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 text-xs">
                <input
                  type="text"
                  placeholder="Proveedor (Boxito, etc.)"
                  value={manualVendor}
                  onChange={(e) => setManualVendor(e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white sm:col-span-4"
                />
                <input
                  type="text"
                  placeholder="Descripción"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white sm:col-span-4"
                />
                <input
                  type="number"
                  placeholder="Monto $"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 tabular-nums text-white sm:col-span-2"
                />
                <button
                  onClick={handleAddManualExpense}
                  className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300 sm:col-span-2 flex items-center justify-center"
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Historial de Compras */}
            <div className="space-y-2 pt-2 max-h-80 overflow-y-auto pr-1">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{exp.description}</div>
                    <div className="text-[11px] text-zinc-400">
                      {exp.vendor} · {exp.expense_date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold tabular-nums text-white">
                      ${Number(exp.amount_mxn).toLocaleString('es-MX')}
                    </div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        exp.paid_by === 'Adal'
                          ? 'bg-yellow-400/20 text-yellow-300'
                          : 'bg-emerald-400/20 text-emerald-300'
                      }`}
                    >
                      Pagó {exp.paid_by}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Checklist de Equipamiento CAPEX */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                  <Wrench size={16} className="text-yellow-400" />
                  Equipamiento Esencial Taller (CAPEX Fases 1 & 2)
                </h3>
                <p className="text-xs text-zinc-400">
                  Control de herramientas adquiridas vs. pendientes en Mérida.
                </p>
              </div>
              <span className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold tabular-nums text-yellow-300">
                ${financialSummary.totalCapexPurchased.toLocaleString('es-MX')} / $
                {financialSummary.totalCapexEstimated.toLocaleString('es-MX')}
              </span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {capexList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCapex(item.id)}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                    item.purchased
                      ? 'border-yellow-400/40 bg-yellow-400/10'
                      : 'border-white/10 bg-black/30 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 accent-yellow-400 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{item.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[9px] font-bold ${
                              item.priority.includes('Crítica')
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{item.spec}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Rango de mercado: {item.costRangeMXN} MXN
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold tabular-nums text-white">
                        ${item.estimatedCostMXN.toLocaleString('es-MX')} MXN
                      </div>
                      {item.purchased && item.paidBy && (
                        <span className="text-[10px] font-bold text-yellow-300">
                          Compró {item.paidBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
