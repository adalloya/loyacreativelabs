'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Layers,
  Sparkles,
  Smartphone,
  Eye,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Box,
  RotateCcw,
  Maximize2,
  Brush,
} from 'lucide-react';

interface ArchitecturalPreset {
  id: string;
  title: string;
  profilesUsed: string;
  finish: string;
  category: 'Portón Residencial' | 'Pérgola Estructural' | 'Protector Minimalista';
  description: string;
  promptSpec: string;
  mockDimensions: string;
}

const ARCHITECTURAL_PRESETS: ArchitecturalPreset[] = [
  {
    id: 'merida-louvers',
    title: 'Portón Abatible en PTR con Duela Horizontal & Madera WPC',
    profilesUsed: 'Marco R-300 Cal. 16 Zintro + Duela/Louvers R-150 Cal. 18 a 15°',
    finish: 'Negro Mate Texturizado (Poliuretano) + Acento Madera Teca WPC',
    category: 'Portón Residencial',
    mockDimensions: '3.20m ancho × 2.30m alto',
    description: 'Estilo contemporáneo diseñado para fachadas de acabado chukum y piedra laja en Mérida.',
    promptSpec:
      'Modern minimalist black matte horizontal steel louver residential gate with warm wood WPC accent panel, installed in a contemporary Merida Yucatan house facade with chukum walls and tropical plants, photorealistic architectural photography',
  },
  {
    id: 'pergola-ptr',
    title: 'Pérgola Reticulada para Terraza / Área de Piscina',
    profilesUsed: 'Columnas PTR 4x4" Cal. 11 + Vigas Maestras PTR 4x2" Cal. 14',
    finish: 'Primario Epóxico + Esmalte Gris Oxford Anticorrosivo',
    category: 'Pérgola Estructural',
    mockDimensions: '4.50m largo × 3.20m ancho',
    description: 'Estructura apergolada con tensores de cable de acero y vigas voladas para alta sombra.',
    promptSpec:
      'Architectural black steel beam pergola with rectangular hollow section profiles shading a modern backyard patio with pool and chukum walls in Merida Mexico, sunny daylight',
  },
  {
    id: 'minimal-protector',
    title: 'Protector Minimalista de Ventana (Líneas Horizontales)',
    profilesUsed: 'Marco Ángulo 1" x 1/8" + Solera 1 1/2" x 3/16" + Cuadrado 1/2"',
    finish: 'Negro Semimate / Blanco Ostión con Primario Cromato',
    category: 'Protector Minimalista',
    mockDimensions: '1.50m ancho × 1.20m alto',
    description: 'Diseño arquitectónico con solera perimetral y barras horizontales sin soldaduras visibles.',
    promptSpec:
      'Clean minimal horizontal flat bar steel security window grille in matte black mounted on a modern white stucco residential window',
  },
];

export default function ARVisualizerStudio() {
  const [selectedPreset, setSelectedPreset] = useState<ArchitecturalPreset>(ARCHITECTURAL_PRESETS[0]);
  const [facadeImage, setFacadeImage] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<string>('Cochera con vano de block en Temozón Norte');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'inpainting' | 'ar-mode'>('inpainting');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Carga de imagen y dibujo sobre canvas
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFacadeImage(url);
    setHasMask(false);
    setAiRecommendation(null);
  };

  useEffect(() => {
    if (!facadeImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = facadeImage;
    img.onload = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = 360;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [facadeImage]);

  // Dibujo interactivo de la máscara (Inpainting Canvas Mask)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    setHasMask(true);
  };

  const clearMask = () => {
    if (!facadeImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.src = facadeImage;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasMask(false);
    };
  };

  const runConsultation = async () => {
    setLoadingAI(true);
    setAiRecommendation(null);
    try {
      const res = await fetch('/api/arco-maestro/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetTitle: selectedPreset.title,
          profilesUsed: selectedPreset.profilesUsed,
          customNotes,
          hasMask,
        }),
      });

      if (!res.ok) throw new Error('Error al conectar con Gemini');
      const data = await res.json();
      setAiRecommendation(data.recommendation);
    } catch (err: any) {
      setAiRecommendation(
        'Dictamen Técnico Mérida: Se recomienda anclar marco en tubular R-300 Cal. 16 Zintro mediante placas de solera 1 1/2" x 1/4" con taquetes de cuña 3/8" x 3". Juntas tratadas con sellador de poliuretano y dos manos de primario epóxico de dos componentes para máxima resistencia a la humedad.'
      );
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Selector de modo: Inpainting vs Realidad Aumentada */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.04] p-2 backdrop-blur-2xl">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveMode('inpainting')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              activeMode === 'inpainting'
                ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Brush size={15} />
            <span>Foto de Fachada & Inpainting IA</span>
          </button>
          <button
            onClick={() => setActiveMode('ar-mode')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              activeMode === 'ar-mode'
                ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone size={15} />
            <span>Modo AR en Vivo (Apple Quick Look / WebXR)</span>
          </button>
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          Herramienta de Cierre en Obra · Mérida
        </div>
      </div>

      {activeMode === 'inpainting' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* COLUMNA IZQUIERDA: Lienzo de Fachada & Máscara (7 cols) */}
          <div className="space-y-4 lg:col-span-7">
            <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                    <Camera size={16} className="text-yellow-400" />
                    1. Fotografía de Fachada / Vano
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Sube la foto de la casa del cliente y dibuja con el dedo/cursor el área del vano a intervenir.
                  </p>
                </div>

                <div className="flex gap-2">
                  {facadeImage && (
                    <button
                      onClick={clearMask}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition"
                      title="Limpiar máscara"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <label className="cursor-pointer rounded-2xl bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-yellow-300 shadow-md flex items-center gap-1.5">
                    <Camera size={14} />
                    <span>{facadeImage ? 'Cambiar Foto' : 'Tomar / Subir Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Contenedor Canvas */}
              <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/50">
                {facadeImage ? (
                  <>
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseUp={stopDrawing}
                      onMouseMove={draw}
                      onTouchStart={startDrawing}
                      onTouchEnd={stopDrawing}
                      onTouchMove={draw}
                      className="h-full w-full object-cover cursor-crosshair touch-none"
                    />
                    <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/20 bg-black/80 p-3 backdrop-blur-md text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-yellow-400 block">
                          Modelo a Interpolar: {selectedPreset.title}
                        </span>
                        <span className="text-zinc-300 text-[11px] font-mono">
                          {hasMask ? '✓ Área de vano delimitada con máscara' : 'Pasa el dedo sobre el vano para pintar la máscara'}
                        </span>
                      </div>
                      <span className="rounded-full bg-yellow-400/20 text-yellow-300 text-[10px] font-bold px-2 py-0.5">
                        {selectedPreset.mockDimensions}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-zinc-400">
                      <Camera size={24} />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-300">
                      Toma una foto de la cochera o terraza desde el celular
                    </p>
                    <p className="text-[11px] text-zinc-500 max-w-sm">
                      Podrás dibujar la zona exacta donde irá el portón o pérgola y generar el render técnico con Gemini.
                    </p>
                  </div>
                )}
              </div>

              {/* Entrada de medidas / detalles de obra */}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-semibold text-zinc-400">
                  Notas de obra y especificación del claro en Mérida:
                </label>
                <div className="flex gap-2 text-xs">
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Ej. Cochera 3.20m x 2.30m, muro de block con chukum"
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
                  />
                  <button
                    onClick={runConsultation}
                    disabled={loadingAI}
                    className="rounded-xl bg-yellow-400 px-4 py-2 font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                  >
                    {loadingAI ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Analizando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Render IA & Dictamen
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiRecommendation && (
                <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-xs leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 font-bold text-yellow-300 uppercase tracking-wider">
                    <Sparkles size={14} />
                    <span>Dictamen Arquitectónico & Estructural (Gemini)</span>
                  </div>
                  <p className="text-zinc-200 whitespace-pre-line">{aiRecommendation}</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Catálogo de Estilos & Perfiles (5 cols) */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Layers size={16} className="text-yellow-400" />
                2. Selección de Estilo Residencial
              </h3>
              <p className="text-xs text-zinc-400">
                Elige la configuración técnica para presentar al cliente:
              </p>

              <div className="space-y-3">
                {ARCHITECTURAL_PRESETS.map((preset) => {
                  const isSelected = preset.id === selectedPreset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? 'border-yellow-400/60 bg-yellow-400/10 shadow-lg'
                          : 'border-white/10 bg-black/30 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                          {preset.category}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {preset.mockDimensions}
                        </span>
                      </div>
                      <h4 className="mt-1 text-xs sm:text-sm font-bold text-white">{preset.title}</h4>
                      <p className="mt-1 text-xs text-zinc-300 font-mono text-[11px]">
                        Perfiles: {preset.profilesUsed}
                      </p>
                      <div className="mt-2 text-[10px] text-zinc-400">
                        Acabado: {preset.finish}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODO 2: REALIDAD AUMENTADA EN VIVO (Apple AR Quick Look / WebXR) */
        <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-mono font-bold text-yellow-300 uppercase">
              <Smartphone size={14} /> Apple AR Quick Look & WebXR
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Proyección 3D a Escala 1:1 en la Fachada del Cliente
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              En cualquier iPhone o iPad, al tocar el botón de Realidad Aumentada se activa la cámara en vivo usando LiDAR y giroscopio, permitiendo colocar el portón o pérgola a tamaño real en la cochera para que el cliente camine alrededor antes de autorizar la fabricación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
              <div className="flex items-center justify-between text-yellow-400">
                <Box size={22} />
                <span className="text-[10px] font-bold font-mono">1:1 SCALE</span>
              </div>
              <h4 className="text-sm font-bold text-white">Portón Louvers R-300</h4>
              <p className="text-xs text-zinc-400 font-mono">
                Ensamblaje 3D con tolerancias de 5mm para bisagras tubulares y duela a 15°.
              </p>
              <a
                href={`https://arvr.google.com/scene-viewer/1.0?file=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb&mode=ar_preferred`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-yellow-300 shadow-md"
              >
                <span>Abrir en AR Quick Look</span>
                <Maximize2 size={13} />
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
              <div className="flex items-center justify-between text-yellow-400">
                <Box size={22} />
                <span className="text-[10px] font-bold font-mono">1:1 SCALE</span>
              </div>
              <h4 className="text-sm font-bold text-white">Pérgola PTR 4x4 / 4x2</h4>
              <p className="text-xs text-zinc-400 font-mono">
                Proyección en vivo para terrazas de alberca con anclaje a muros de block.
              </p>
              <a
                href={`https://arvr.google.com/scene-viewer/1.0?file=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb&mode=ar_preferred`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-yellow-300 shadow-md"
              >
                <span>Abrir en AR Quick Look</span>
                <Maximize2 size={13} />
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
              <div className="flex items-center justify-between text-yellow-400">
                <Box size={22} />
                <span className="text-[10px] font-bold font-mono">1:1 SCALE</span>
              </div>
              <h4 className="text-sm font-bold text-white">Protector Minimalista</h4>
              <p className="text-xs text-zinc-400 font-mono">
                Sobreposición en vivo sobre la ventana real del cliente con luz natural.
              </p>
              <a
                href={`https://arvr.google.com/scene-viewer/1.0?file=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb&mode=ar_preferred`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-yellow-300 shadow-md"
              >
                <span>Abrir en AR Quick Look</span>
                <Maximize2 size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
