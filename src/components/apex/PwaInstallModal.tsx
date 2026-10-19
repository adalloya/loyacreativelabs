// src/components/apex/PwaInstallModal.tsx
"use client";

import Image from "next/image";
import { X, Share2, PlusSquare, CheckCircle, Zap } from "lucide-react";

interface PwaInstallModalProps {
    onClose: () => void;
}

export function PwaInstallModal({ onClose }: PwaInstallModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#121214]/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl z-10 text-white">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-white/[0.06] pb-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-white/10 bg-black shrink-0 shadow-lg">
                            <Image
                                src="/apex-logo.png"
                                alt="APEX"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h2 className="text-base font-bold tracking-tight text-white uppercase">INSTALAR APEX EN TU CELULAR</h2>
                            <p className="text-[11px] font-mono text-zinc-500">Modo WebApp de Pantalla Completa</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Benefits */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-4 text-xs space-y-2.5">
                    <div className="flex items-center gap-2.5 text-zinc-300">
                        <CheckCircle size={15} className="shrink-0 text-white" />
                        <span>Pantalla Completa sin barras de Safari o Chrome</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-zinc-300">
                        <CheckCircle size={15} className="shrink-0 text-white" />
                        <span>La pantalla jamás se apaga durante el entrenamiento</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-zinc-300">
                        <CheckCircle size={15} className="shrink-0 text-white" />
                        <span>Acceso directo con icono en tu pantalla de inicio</span>
                    </div>
                </div>

                {/* Instructions by OS */}
                <div className="space-y-3">
                    {/* iPhone / iOS */}
                    <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                                <Zap size={13} className="text-white" /> EN IPHONE (SAFARI)
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">2 pasos</span>
                        </div>
                        <ol className="text-xs text-zinc-400 space-y-2 font-mono">
                            <li className="flex items-start gap-2.5">
                                <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">1</span>
                                <span>Toca el botón <strong>Compartir</strong> en la barra inferior de Safari (<Share2 size={12} className="inline text-white" />).</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">2</span>
                                <span>Baja y selecciona <strong>"Agregar a Inicio"</strong> (<PlusSquare size={12} className="inline text-white" />). ¡Listo!</span>
                            </li>
                        </ol>
                    </div>

                    {/* Android */}
                    <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                                <Zap size={13} className="text-white" /> EN ANDROID (CHROME)
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">2 pasos</span>
                        </div>
                        <ol className="text-xs text-zinc-400 space-y-2 font-mono">
                            <li className="flex items-start gap-2.5">
                                <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">1</span>
                                <span>Toca los <strong>tres puntos verticales (⋮)</strong> arriba a la derecha.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">2</span>
                                <span>Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a pantalla principal".</span>
                            </li>
                        </ol>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-5 py-3 bg-white hover:bg-zinc-200 text-black font-semibold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
}
