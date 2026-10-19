"use client";

import Image from "next/image";
import { X, Smartphone, Share2, PlusSquare, CheckCircle, Zap } from "lucide-react";

interface PwaInstallModalProps {
    onClose: () => void;
}

export function PwaInstallModal({ onClose }: PwaInstallModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#0A0D12] border border-[#1E2633] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 text-white">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-[#1E2633] pb-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-[#111111] shrink-0 shadow-lg shadow-red-950/20">
                            <Image
                                src="/apex-logo.png"
                                alt="APEX OS Logo"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h2 className="text-base font-bold tracking-tight text-white">INSTALAR APEX EN TU CELULAR</h2>
                            <p className="text-[11px] font-mono text-[#8892B0]">Modo WebApp de Pantalla Completa</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-[#8892B0] hover:text-white rounded-lg hover:bg-[#161C26]"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Benefits */}
                <div className="bg-[#10141D] border border-[#1E2633] rounded-xl p-3.5 mb-4 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-[#64FFDA]">
                        <CheckCircle size={14} className="shrink-0" />
                        <span>Pantalla Completa sin barras de Safari o Chrome</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#64FFDA]">
                        <CheckCircle size={14} className="shrink-0" />
                        <span>La pantalla jamás se apaga durante el entrenamiento</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#64FFDA]">
                        <CheckCircle size={14} className="shrink-0" />
                        <span>Acceso directo con icono en tu pantalla de inicio</span>
                    </div>
                </div>

                {/* Instructions by OS */}
                <div className="space-y-4">
                    {/* iPhone / iOS */}
                    <div className="p-3.5 bg-[#131924] border border-[#232D3F] rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                                <Zap size={13} className="text-[#38BDF8]" /> EN IPHONE (SAFARI)
                            </span>
                            <span className="text-[10px] font-mono text-[#8892B0]">2 pasos</span>
                        </div>
                        <ol className="text-xs text-[#CBD5E1] space-y-2 font-mono">
                            <li className="flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#1E2633] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">1</span>
                                <span>Toca el botón <strong>Compartir</strong> en la barra inferior de Safari (<Share2 size={12} className="inline text-[#38BDF8]" />).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#1E2633] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">2</span>
                                <span>Baja y selecciona <strong>"Agregar a Inicio"</strong> (<PlusSquare size={12} className="inline text-[#64FFDA]" />). ¡Listo!</span>
                            </li>
                        </ol>
                    </div>

                    {/* Android */}
                    <div className="p-3.5 bg-[#131924] border border-[#232D3F] rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                                <Zap size={13} className="text-[#34D399]" /> EN ANDROID (CHROME)
                            </span>
                            <span className="text-[10px] font-mono text-[#8892B0]">2 pasos</span>
                        </div>
                        <ol className="text-xs text-[#CBD5E1] space-y-2 font-mono">
                            <li className="flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#1E2633] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">1</span>
                                <span>Toca los <strong>tres puntos verticales (⋮)</strong> arriba a la derecha.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#1E2633] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">2</span>
                                <span>Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a pantalla principal".</span>
                            </li>
                        </ol>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-2.5 bg-white hover:bg-slate-200 text-black font-semibold rounded-xl text-xs sm:text-sm transition-all"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
}
