// src/app/apex/feedback/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquareHeart,
  Star,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Mail,
  Copy,
  Database,
  ShieldAlert,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { getFeedbackList, FeedbackRecord } from '@/services/feedbackService';
import { isSupabaseConfigured } from '@/lib/supabase';

const CATEGORY_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  sugerencia: { label: 'Sugerencia de función', color: '#3B82F6', icon: Lightbulb },
  falta_algo: { label: 'Algo que le falta', color: '#F59E0B', icon: Sparkles },
  ajuste_tecnico: { label: 'Ajuste técnico', color: '#FF2A2A', icon: AlertTriangle },
  opinion_general: { label: 'Opinión general', color: '#10B981', icon: Heart },
};

export default function FeedbackAdminPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getFeedbackList();
      setFeedbackList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredList = feedbackList.filter((item) => {
    if (selectedCategory === 'todos') return true;
    return item.category === selectedCategory;
  });

  const averageRating = feedbackList.length > 0
    ? (feedbackList.reduce((acc, curr) => acc + (curr.rating || 5), 0) / feedbackList.length).toFixed(1)
    : '5.0';

  const sqlSnippet = `-- Tabla de comentarios de APEX en Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS apex_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT,
  email TEXT,
  rating INTEGER DEFAULT 5,
  category TEXT DEFAULT 'opinion_general',
  message TEXT NOT NULL,
  user_agent TEXT
);

-- Permisos públicos para permitir envíos desde el frontend:
ALTER TABLE apex_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir insercion publica de feedback" ON apex_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura publica de feedback" ON apex_feedback FOR SELECT USING (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Fecha', 'Calificación', 'Categoría', 'Nombre', 'Correo', 'Mensaje'];
    const rows = filteredList.map(item => [
      item.id,
      new Date(item.created_at).toLocaleString(),
      item.rating,
      item.category,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.email || '').replace(/"/g, '""')}"`,
      `"${(item.message || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apex_feedback_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-[#FF2A2A] selection:text-white pb-20">
      
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-30 bg-[#121214]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/apex"
              className="p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08] transition-all flex items-center gap-1.5 text-xs font-mono active:scale-95"
            >
              <ArrowLeft size={16} />
              <span className="hidden xs:inline">Volver a APEX</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF2A2A]/15 border border-[#FF2A2A]/30 flex items-center justify-center text-[#FF2A2A]">
                <MessageSquareHeart size={18} />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                  Buzón de Comentarios y Sugerencias
                </h1>
                <span className="text-[10px] font-mono text-zinc-400">
                  Panel de Administración APEX
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08] transition-all flex items-center gap-2 text-xs font-mono active:scale-95 disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        
        {/* Métricas Principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#121214] border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              TOTAL COMENTARIOS
            </span>
            <div className="text-2xl font-extrabold text-white">
              {feedbackList.length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121214] border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              CALIFICACIÓN MEDIA
            </span>
            <div className="text-2xl font-extrabold text-amber-400 flex items-center gap-1.5">
              <span>{averageRating}</span>
              <Star size={20} className="fill-amber-400 text-amber-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121214] border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              SUGERENCIAS DE FUNCIONES
            </span>
            <div className="text-2xl font-extrabold text-[#3B82F6]">
              {feedbackList.filter(f => f.category === 'sugerencia').length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121214] border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              COSAS QUE LES FALTAN
            </span>
            <div className="text-2xl font-extrabold text-[#F59E0B]">
              {feedbackList.filter(f => f.category === 'falta_algo').length}
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Exportación */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#121214] border border-white/[0.08]">
          <div className="flex items-center gap-1 overflow-x-auto p-1">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'sugerencia', label: 'Sugerencias' },
              { id: 'falta_algo', label: 'Qué les falta' },
              { id: 'ajuste_tecnico', label: 'Ajustes' },
              { id: 'opinion_general', label: 'Opinión' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-mono transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filteredList.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="py-2 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-mono text-white flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition-all"
            >
              <Download size={13} />
              <span>{copiedExport ? '¡CSV Descargado!' : 'Exportar a CSV'}</span>
            </button>
          )}
        </div>

        {/* Lista de Comentarios */}
        {loading ? (
          <div className="py-16 text-center text-zinc-500 font-mono text-sm">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-zinc-400" />
            Cargando comentarios...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center bg-[#121214] border border-white/[0.08] rounded-3xl p-8 space-y-3">
            <MessageSquareHeart size={36} className="mx-auto text-zinc-600" />
            <h3 className="text-base font-bold text-white">Aún no hay comentarios en esta categoría</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Cuando los usuarios envíen sugerencias u opiniones desde la app, aparecerán aquí ordenados por fecha.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item) => {
              const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.opinion_general;
              const CatIcon = catInfo.icon;
              const dateStr = new Date(item.created_at).toLocaleString('es-MX', {
                dateStyle: 'medium',
                timeStyle: 'short'
              });

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-[#121214] border border-white/[0.08] hover:border-white/20 transition-all space-y-3 shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Categoría Badge */}
                      <span
                        className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1"
                        style={{
                          backgroundColor: `${catInfo.color}15`,
                          borderColor: `${catInfo.color}35`,
                          color: catInfo.color
                        }}
                      >
                        <CatIcon size={11} />
                        <span>{catInfo.label}</span>
                      </span>

                      {/* Estrellas */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={
                              star <= item.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-zinc-700'
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {/* Fecha y Fuente */}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{dateStr}</span>
                      </span>
                      {item.source === 'local' && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded">
                          Caché local
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mensaje del Usuario */}
                  <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-line bg-black/30 p-3.5 rounded-2xl border border-white/[0.04]">
                    {item.message}
                  </p>

                  {/* Datos de Contacto (si los puso) */}
                  {(item.name || item.email) && (
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                      {item.name && (
                        <span className="flex items-center gap-1.5 text-white font-medium">
                          <User size={13} className="text-[#FF2A2A]" />
                          <span>{item.name}</span>
                        </span>
                      )}
                      {item.email && (
                        <a
                          href={`mailto:${item.email}`}
                          className="flex items-center gap-1.5 text-zinc-400 hover:text-white hover:underline transition-colors font-mono"
                        >
                          <Mail size={13} className="text-zinc-400" />
                          <span>{item.email}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tarjeta Informativa de Conexión y Snippet SQL para Supabase */}
        <div className="p-5 rounded-3xl bg-black/40 border border-white/[0.08] space-y-3 text-xs text-zinc-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Database size={15} className="text-[#10B981]" />
              <span>Configuración de Base de Datos (Supabase)</span>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="py-1 px-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-white rounded-lg font-mono text-[11px] flex items-center gap-1 border border-white/10 active:scale-95"
            >
              <Copy size={11} />
              <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>

          <p className="leading-relaxed">
            Si aún no has creado la tabla <code className="text-emerald-400 font-mono">apex_feedback</code> en tu proyecto de Supabase, copia este comando y pégalo en el <span className="text-white">SQL Editor</span> de Supabase para tener persistencia directa permanente en la nube:
          </p>

          <pre className="p-3 bg-black/70 rounded-xl text-[10px] font-mono text-zinc-300 overflow-x-auto border border-white/[0.06]">
            {sqlSnippet}
          </pre>
        </div>

      </main>

    </div>
  );
}
