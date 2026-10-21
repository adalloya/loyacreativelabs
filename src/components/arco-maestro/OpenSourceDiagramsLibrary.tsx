'use client';

import React, { useState } from 'react';
import { Download, ExternalLink, FileCode, Layers, Shield, Sparkles } from 'lucide-react';

interface OpenSourceBlueprint {
  id: string;
  title: string;
  category: 'Portones & Puertas' | 'Pérgolas & Estructuras' | 'Protecciones & Rejas' | 'Mobiliario Industrial';
  sourceRepo: string;
  fileFormat: 'DXF' | 'STEP' | 'PDF Técnico' | 'SVG Paramétrico';
  description: string;
  downloadUrl: string;
  previewAscii: string;
}

const OPEN_SOURCE_BLUEPRINTS: OpenSourceBlueprint[] = [
  {
    id: 'bp-1',
    title: 'Portón Abatible Moderno de Duelas Horizontales (3.00m x 2.20m)',
    category: 'Portones & Puertas',
    sourceRepo: 'GitHub / Microsoft Maker.js Parametric Gates',
    fileFormat: 'DXF',
    description: 'Diseño estructural paramétrico optimizado para perfiles Zintro R-300 y duela R-150. Incluye despiece de refuerzos interiores y tolerancias para bisagras tubulares de 3/4".',
    downloadUrl: 'https://github.com/microsoft/maker.js',
    previewAscii: `
+=============================================+
| [===========] Duela Horizontal Cal. 18      |
| [===========] Espaciado: 12.0 mm            |
| [===========] [CHAPA DE SEGURIDAD EMBUTIDA] |
| [===========]                               |
| [===========] Bisagras Tubulares 3/4" (x3)  |
+=============================================+
    `,
  },
  {
    id: 'bp-2',
    title: 'Pérgola Reticulada para Terraza / Alberca (4.00m x 5.00m)',
    category: 'Pérgolas & Estructuras',
    sourceRepo: 'GrabCAD Open Library / Structural Steel',
    fileFormat: 'STEP',
    description: 'Ensamblaje completo 3D de columnas en PTR 4x4" Cal. 11 y vigas maestras en PTR 4x2" Cal. 14 con placas de anclaje ocultas para muros yucatecos.',
    downloadUrl: 'https://grabcad.com',
    previewAscii: `
  /============= Viga Maestra PTR 4x2" =============\\
 /   |         |         |         |         |       \\
/    |         |         |         |         |        \\
[Columna 4x4]---------------------------[Columna 4x4]
[Placa 1/4"]                            [Placa 1/4"]
    `,
  },
  {
    id: 'bp-3',
    title: 'Paneles de Celosía Metálica Decorativa para Corte Plasma/Láser',
    category: 'Protecciones & Rejas',
    sourceRepo: '3axis.co Open DXF Repository',
    fileFormat: 'DXF',
    description: 'Vectores limpios sin nodos duplicados para corte en lámina Cal. 14 o 16. Diseñados para exteriores con alta resistencia a la corrosión.',
    downloadUrl: 'https://3axis.co',
    previewAscii: `
+---------------------------------------------+
|  /\\   /\\   /\\   /\\   /\\   /\\   /\\   /\\   /\\  |
|  \\/   \\/   \\/   \\/   \\/   \\/   \\/   \\/   \\/  |
|  /\\   /\\   /\\   /\\   /\\   /\\   /\\   /\\   /\\  |
|  \\/   \\/   \\/   \\/   \\/   \\/   \\/   \\/   \\/  |
+---------------------------------------------+
    `,
  },
  {
    id: 'bp-4',
    title: 'Mesa de Soldadura Profesional Nivelada con Perfiles Estructurales',
    category: 'Mobiliario Industrial',
    sourceRepo: 'Open Source Workshop Gear / LibreCAD',
    fileFormat: 'PDF Técnico',
    description: 'Planos de fabricación con canal estructural y PTR 2x2" Cal. 11, con superficie ajustable milimétricamente y orificios para prensas de 16mm.',
    downloadUrl: 'https://github.com',
    previewAscii: `
+=============================================+
| [O]   [O]   [O]   [O]   [O]   [O]   [O]     |
| [O]   [O]   [Placa Superior 3/8"]       [O] |
|                                             |
| [Pata PTR 2x2 Cal 11]    [Pata PTR 2x2]     |
| [Ruedas Industriales con Freno de Bloqueo]  |
+=============================================+
    `,
  },
];

export default function OpenSourceDiagramsLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activeBlueprint, setActiveBlueprint] = useState<OpenSourceBlueprint>(OPEN_SOURCE_BLUEPRINTS[0]);

  const filteredBlueprints =
    selectedCategory === 'Todos'
      ? OPEN_SOURCE_BLUEPRINTS
      : OPEN_SOURCE_BLUEPRINTS.filter((b) => b.category === selectedCategory);

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileCode className="text-yellow-400" size={20} />
              Biblioteca de Diagramas & Fuentes Open Source
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Planos técnicos, archivos CAD, DXF y recursos paramétricos sincronizados para fabricación en taller.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-1.5">
            {['Todos', 'Portones & Puertas', 'Pérgolas & Estructuras', 'Protecciones & Rejas', 'Mobiliario Industrial'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        {/* Visor Móvil Friendly */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Lista de planos (5 cols) */}
          <div className="space-y-3 lg:col-span-5 max-h-[520px] overflow-y-auto pr-1">
            {filteredBlueprints.map((bp) => (
              <div
                key={bp.id}
                onClick={() => setActiveBlueprint(bp)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  activeBlueprint.id === bp.id
                    ? 'border-yellow-400/50 bg-yellow-400/10 shadow-lg'
                    : 'border-white/10 bg-black/30 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                    {bp.fileFormat}
                  </span>
                  <span className="text-[11px] text-zinc-400">{bp.category}</span>
                </div>
                <h3 className="mt-2 text-xs sm:text-sm font-bold text-white">{bp.title}</h3>
                <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2">{bp.description}</p>
              </div>
            ))}
          </div>

          {/* Detalle y Visor ASCII / Preview (7 cols) */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                  Fuente: {activeBlueprint.sourceRepo}
                </span>
                <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {activeBlueprint.fileFormat}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{activeBlueprint.title}</h3>
              <p className="text-xs leading-relaxed text-zinc-300">{activeBlueprint.description}</p>

              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Esquema Estructural Técnico Preview:
                </span>
                <pre className="rounded-xl border border-white/10 bg-black/80 p-4 font-mono text-xs text-yellow-300 overflow-x-auto shadow-inner">
                  {activeBlueprint.previewAscii}
                </pre>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400">Recurso Open Source para taller</span>
              <a
                href={activeBlueprint.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-yellow-300 shadow-md flex items-center gap-1.5"
              >
                <Download size={14} /> Descargar Fuente / Archivo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
