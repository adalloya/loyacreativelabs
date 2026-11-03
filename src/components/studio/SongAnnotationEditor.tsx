// src/components/studio/SongAnnotationEditor.tsx
import React, { useState } from 'react';
import { Edit3, Plus, Trash2, Save, Sparkles, BookOpen, Music } from 'lucide-react';

export interface SyllableAnnotation {
  id: string;
  syllable: string;        // Ej: "quie"
  chord: string;           // Ej: "B"
  barStart?: boolean;      // Muestra barra de compás "|" antes de la sílaba
  ligatureNext?: boolean;  // Enlace gráfico hacia la siguiente sílaba (︶)
  vocalTechnique?: string; // Ej: "Voz de pecho", "Apoyo", "Staccato"
  arrowDirection?: 'up' | 'down' | 'flat'; // Flechas de soporte
}

export interface PhraseLineAnnotation {
  id: string;
  lineText: string;        // Ej: "Me quieren agitar"
  syllables: SyllableAnnotation[];
  notes?: string;          // Nota general del profesor para el verso
}

interface SongAnnotationEditorProps {
  trackId: string;
  trackTitle?: string;
  initialLines?: PhraseLineAnnotation[];
  onSave: (lines: PhraseLineAnnotation[]) => void;
  onClose?: () => void;
}

export const SongAnnotationEditor: React.FC<SongAnnotationEditorProps> = ({
  trackId,
  trackTitle = 'Pista Activa',
  initialLines = [],
  onSave,
  onClose,
}) => {
  const [lines, setLines] = useState<PhraseLineAnnotation[]>(
    initialLines.length > 0
      ? initialLines
      : [
          // Ejemplo precargado estilo libreta de clase (Lamento Boliviano)
          {
            id: 'line-1',
            lineText: 'Me quieren agitar',
            syllables: [
              { id: 's1', syllable: 'Me', chord: 'E', barStart: true, vocalTechnique: 'Pecho' },
              { id: 's2', syllable: 'quie', chord: 'B', barStart: true, ligatureNext: true },
              { id: 's3', syllable: 'ren', chord: 'B' },
              { id: 's4', syllable: 'a', chord: 'A', barStart: true, arrowDirection: 'down' },
              { id: 's5', syllable: 'gi', chord: 'B', barStart: true },
              { id: 's6', syllable: 'tar', chord: 'E', arrowDirection: 'down' },
            ],
            notes: 'Mantener resonancia al frente sin empujar el aire en "gritar".',
          },
        ]
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddSyllable = (lineId: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              syllables: [
                ...l.syllables,
                { id: `s-${Date.now()}`, syllable: 'nueva', chord: 'E', barStart: false },
              ],
            }
          : l
      )
    );
  };

  const handleAddLine = () => {
    const newLine: PhraseLineAnnotation = {
      id: `line-${Date.now()}`,
      lineText: 'Nueva frase / verso',
      syllables: [
        { id: `s-${Date.now()}-1`, syllable: 'Canta', chord: 'Am', barStart: true },
        { id: `s-${Date.now()}-2`, syllable: 'aqui', chord: 'E', barStart: false },
      ],
      notes: 'Apoyo diafragmático y laringe neutra.',
    };
    setLines((prev) => [...prev, newLine]);
  };

  const handleDeleteLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const handleUpdateSyllable = (
    lineId: string,
    syllableId: string,
    field: keyof SyllableAnnotation,
    value: unknown
  ) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              syllables: l.syllables.map((s) => (s.id === syllableId ? { ...s, [field]: value } : s)),
            }
          : l
      )
    );
  };

  const handleDeleteSyllable = (lineId: string, syllableId: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? { ...l, syllables: l.syllables.filter((s) => s.id !== syllableId) }
          : l
      )
    );
  };

  const handleSaveAll = () => {
    onSave(lines);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1017] text-white p-4 overflow-y-auto select-none">
      {/* Cabecera del Editor */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Edit3 className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold font-mono tracking-tight flex items-center gap-2">
              Anotaciones de Clase (Estilo Libreta del Profesor)
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">Pista: {trackTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-white transition font-mono"
            >
              Cerrar
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition shadow-lg ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            {savedSuccess ? '¡Guardado en IndexedDB!' : 'Guardar Anotaciones'}
          </button>
        </div>
      </div>

      {/* Lista de Frases Anotadas */}
      <div className="space-y-6 flex-1">
        {lines.map((line) => (
          <div key={line.id} className="bg-[#11131A] border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={line.lineText}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) => (l.id === line.id ? { ...l, lineText: e.target.value } : l))
                  )
                }
                className="bg-transparent text-sm font-bold text-blue-300 border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                placeholder="Frase o verso..."
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">Frase / Verso</span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLine(line.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1 transition"
                    title="Eliminar este verso"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* RENDERIZADOR EXACTO AL ESTILO DE LA LIBRETA DEL PROFESOR */}
            <div className="bg-[#090A0F] border border-white/10 rounded-xl p-4 overflow-x-auto my-2">
              <div className="flex items-end gap-3 min-w-max py-2">
                {line.syllables.map((s) => (
                  <div key={s.id} className="flex items-end flex-col relative group">
                    {/* Barra de compás opcional "|" con toggle */}
                    <button
                      type="button"
                      onClick={() => handleUpdateSyllable(line.id, s.id, 'barStart', !s.barStart)}
                      className={`absolute -left-2.5 bottom-1 font-mono text-lg font-bold transition ${
                        s.barStart ? 'text-amber-400/90' : 'text-zinc-700 hover:text-zinc-500 opacity-0 group-hover:opacity-100'
                      }`}
                      title={s.barStart ? 'Quitar barra de compás |' : 'Agregar barra de compás |'}
                    >
                      |
                    </button>

                    {/* Acorde superior y dirección de apoyo (↑ / ↓) */}
                    <div className="flex items-center gap-1 mb-1">
                      <input
                        type="text"
                        value={s.chord}
                        onChange={(e) => handleUpdateSyllable(line.id, s.id, 'chord', e.target.value)}
                        className="w-9 text-center bg-white/5 border border-white/10 rounded text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-blue-500"
                        placeholder="E"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextDirection =
                            s.arrowDirection === 'down'
                              ? 'up'
                              : s.arrowDirection === 'up'
                              ? undefined
                              : 'down';
                          handleUpdateSyllable(line.id, s.id, 'arrowDirection', nextDirection);
                        }}
                        className={`text-[11px] font-bold p-0.5 rounded transition ${
                          s.arrowDirection ? 'text-teal-400 bg-teal-950/40' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                        title="Cambiar dirección de apoyo (↓ / ↑)"
                      >
                        {s.arrowDirection === 'down' ? '↓' : s.arrowDirection === 'up' ? '↑' : '·'}
                      </button>
                    </div>

                    {/* Sílaba y ligadura */}
                    <div className="relative">
                      <input
                        type="text"
                        value={s.syllable}
                        onChange={(e) => handleUpdateSyllable(line.id, s.id, 'syllable', e.target.value)}
                        className="w-14 text-center bg-transparent border-b border-white/20 text-sm font-mono text-white focus:outline-none focus:border-blue-500 pb-0.5"
                      />

                      {/* Toggle de ligadura gráfica (︶) hacia la siguiente sílaba */}
                      <button
                        type="button"
                        onClick={() => handleUpdateSyllable(line.id, s.id, 'ligatureNext', !s.ligatureNext)}
                        className={`absolute -right-3 bottom-0 text-xs font-bold transition ${
                          s.ligatureNext
                            ? 'text-blue-400'
                            : 'text-zinc-700 hover:text-blue-400 opacity-0 group-hover:opacity-100'
                        }`}
                        title={s.ligatureNext ? 'Quitar ligadura' : 'Ligar con siguiente sílaba ︶'}
                      >
                        ︶
                      </button>
                    </div>

                    {/* Botón de eliminar sílaba flotante */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSyllable(line.id, s.id)}
                      className="absolute -top-3 -right-2 text-rose-400 opacity-0 group-hover:opacity-100 transition p-0.5"
                      title="Eliminar sílaba"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddSyllable(line.id)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition flex items-center justify-center ml-2"
                  title="Agregar sílaba a este compás"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notas técnicas del profesor para la frase */}
            <div className="mt-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <input
                type="text"
                value={line.notes || ''}
                placeholder="Notas del profesor (ej. Mantener apoyo diafragmático...)"
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) => (l.id === line.id ? { ...l, notes: e.target.value } : l))
                  )
                }
                className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none font-mono border-b border-white/5 focus:border-purple-500 py-0.5"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddLine}
          className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-blue-400 bg-white/[0.02] hover:bg-blue-950/20 text-xs font-mono text-zinc-400 hover:text-white transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Agregar Nuevo Verso / Frase de Clase</span>
        </button>
      </div>
    </div>
  );
};

export default SongAnnotationEditor;
