// src/components/nutrition/ShoppingList.tsx
'use client';

import React, { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ShoppingCart, CheckSquare, Package } from 'lucide-react';
import type { DietPlanData } from '@/app/nutrition/page';

export function ShoppingList() {
  const [dietPlan] = useLocalStorage<DietPlanData | null>('apex_diet_plan', null);
  const [checkedItems, setCheckedItems] = useLocalStorage<Record<string, boolean>>('apex_shopping_checked', {});

  // Consolidar y sumar ingredientes del plan de Gemini de forma inteligente
  const consolidatedList = useMemo(() => {
    if (!dietPlan) return {};

    const totals: Record<string, number> = {};

    const plan = dietPlan as any;
    if (plan.thirtyDayPlan && Array.isArray(plan.thirtyDayPlan)) {
      plan.thirtyDayPlan.forEach((day: any) => {
        day.meals?.forEach((meal: any) => {
          meal.ingredients?.forEach((ing: any) => {
            const key = ing.item.toLowerCase().trim();
            totals[key] = (totals[key] || 0) + (ing.grams || 0);
          });
        });
      });
    } else if (plan.weeklyTemplates && Array.isArray(plan.weeklyTemplates)) {
      plan.weeklyTemplates.forEach((week: any) => {
        week.meals?.forEach((meal: any) => {
          if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach((ing: any) => {
              const key = ing.item.toLowerCase().trim();
              totals[key] = (totals[key] || 0) + ((ing.grams || 0) * 1); // 1 semana (7 días)
            });
          } else if (meal.items) {
            const parts = meal.items.split('+');
            parts.forEach((p: string) => {
              const trimmed = p.trim();
              const match = trimmed.match(/^(\d+)\s*g?\s+(.*)$/i);
              if (match) {
                const grams = parseInt(match[1], 10) * 7; // 7 días
                const name = match[2].toLowerCase().trim();
                totals[name] = (totals[name] || 0) + grams;
              } else {
                totals[trimmed.toLowerCase()] = (totals[trimmed.toLowerCase()] || 0) + 500;
              }
            });
          }
        });
      });
    }

    return totals;
  }, [dietPlan]);

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  // Si no hay plan generado por Gemini, no se muestra nada (borrada hasta ser generada)
  if (!dietPlan) {
    return null;
  }

  const items = Object.entries(consolidatedList);

  return (
    <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 text-white">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
        <div>
          <span className="text-[10px] font-mono text-[#FF2A2A] uppercase tracking-wider">
            ABASTECIMIENTO // INVENTARIO LOCAL (7 DÍAS)
          </span>
          <h2 className="text-xl font-bold tracking-tight mt-0.5">
            Lista de Compras Consolidada (7 Días)
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.05] px-3 py-1.5 rounded-xl font-mono text-xs text-zinc-300">
          <Package className="w-3.5 h-3.5 text-zinc-400" />
          <span>{items.length} Insumos Totales</span>
        </div>
      </div>

      {/* Lista de Ingredientes Agrupados */}
      {items.length === 0 ? (
        <p className="text-xs text-zinc-500 font-mono text-center py-6">
          No se encontraron ingredientes en el plan actual.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(([item, totalGrams]) => {
            const isChecked = checkedItems[item] || false;

            return (
              <div
                key={item}
                onClick={() => toggleCheck(item)}
                className={`cursor-pointer border rounded-2xl p-4 transition-all flex items-center justify-between select-none ${
                  isChecked
                    ? 'bg-white/[0.02] border-white/[0.03] opacity-40'
                    : 'bg-white/[0.04] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckSquare
                    className={`w-4 h-4 transition-colors ${
                      isChecked ? 'text-emerald-400 fill-emerald-400/20' : 'text-zinc-600'
                    }`}
                  />
                  <span className={`text-sm font-medium capitalize ${isChecked ? 'line-through text-zinc-500' : 'text-white'}`}>
                    {item}
                  </span>
                </div>

                <span className="font-mono text-xs font-bold text-zinc-300 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                  {totalGrams >= 1000 ? `${(totalGrams / 1000).toFixed(2)} KG` : `${totalGrams} G`}
                </span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
