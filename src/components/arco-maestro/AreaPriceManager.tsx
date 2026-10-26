'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaMaterialPrice,
  getAreaPrices,
  saveAreaPrice,
  resetAreaPrices,
} from '@/lib/arco-maestro/local-prices';
import {
  DollarSign,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  MapPin,
  TrendingUp,
  AlertCircle,
  Save,
} from 'lucide-react';

interface AreaPriceManagerProps {
  onPricesUpdated?: () => void;
}

export default function AreaPriceManager({ onPricesUpdated }: AreaPriceManagerProps) {
  const [prices, setPrices] = useState<AreaMaterialPrice[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [editedId, setEditedId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setPrices(getAreaPrices());
  }, []);

  const handleStartEdit = (item: AreaMaterialPrice) => {
    setEditedId(item.id);
    setEditValue(item.currentPriceMXN.toString());
  };

  const handleSaveEdit = (id: string) => {
    const num = parseFloat(editValue);
    if (!isNaN(num) && num >= 0) {
      const updated = saveAreaPrice(id, num);
      setPrices(updated);
      setEditedId(null);
      setNotification('Precio actualizado y guardado localmente.');
      if (onPricesUpdated) onPricesUpdated();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleReset = () => {
    if (confirm('¿Deseas restablecer los precios a los valores estándar de Mérida?')) {
      const def = resetAreaPrices();
      setPrices(def);
      setNotification('Precios restablecidos a los valores estándar de Mérida.');
      if (onPricesUpdated) onPricesUpdated();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredPrices = prices.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.spec.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera Informativa */}
      <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-yellow-400 text-zinc-950 font-black text-sm">
              <DollarSign size={16} />
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              Precios de Materiales en tu Zona (Mérida / Taller)
            </h3>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Edita los precios por tramo de 6.00 metros o por kilo según tu proveedor habitual (Boxito, Acero Sueco, Ferrotodo, San Francisco). Cualquier cambio se guarda y recalcula al instante tu Constructor 3D.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 transition"
        >
          <RotateCcw size={13} />
          <span>Restablecer Promedios Mérida</span>
        </button>
      </div>

      {notification && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <Check size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Filtros y Buscador */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'PTR', label: 'PTR Estructural' },
            { id: 'TUBULAR_ZINTRO', label: 'Tubular Zintro' },
            { id: 'MONTEN', label: 'Polín Montén' },
            { id: 'SOLERA', label: 'Soleras / Ángulos' },
            { id: 'LAMINA', label: 'Cubiertas' },
            { id: 'CONSUMIBLE', label: 'Soldadura / Discos' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? 'bg-yellow-400 text-zinc-950 font-bold shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar perfil (ej. 3x3, montén)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-yellow-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid de Materiales con Edición Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrices.map((item) => {
          const isEditing = editedId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-3xl border p-4 transition backdrop-blur-xl ${
                isEditing
                  ? 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_20px_rgba(234,179,8,0.15)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="inline-block rounded-md bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-zinc-300 mb-1">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-white leading-snug">{item.name}</h4>
                  <p className="text-[11px] text-zinc-400">{item.spec}</p>
                </div>
              </div>

              {item.notes && (
                <p className="text-[10px] text-zinc-500 italic mb-3">{item.notes}</p>
              )}

              {/* Sección de Precio y Edición */}
              <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-bold text-yellow-400">$</span>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(item.id);
                        if (e.key === 'Escape') setEditedId(null);
                      }}
                      className="w-full rounded-xl border border-yellow-400 bg-zinc-900 px-2 py-1 text-sm font-bold text-white focus:outline-none tabular-nums"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="rounded-xl bg-yellow-400 p-1.5 text-zinc-950 font-bold hover:bg-yellow-300 transition"
                      title="Guardar"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Precio tu ferretería</span>
                      <span className="text-lg font-black text-yellow-400 tabular-nums">
                        ${item.currentPriceMXN.toLocaleString('es-MX')}{' '}
                        <span className="text-xs font-semibold text-zinc-400">MXN</span>
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartEdit(item)}
                      className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-zinc-200 transition"
                    >
                      Editar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
