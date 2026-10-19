"use client";

import Link from "next/link";
import { Dumbbell, Activity, Sparkles, Smartphone, Shield, Zap, ArrowRight, Check } from "lucide-react";

export default function ApexPromo() {
    return (
        <section id="apex-project" className="relative py-24 px-4 bg-[#050505] overflow-hidden border-t border-b border-white/5">
            {/* Background Ambience */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Badge & Title */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono font-bold tracking-widest uppercase">
                        <Zap size={14} className="fill-red-400" /> LOYA LABS SOFTWARE // NUEVA HERRAMIENTA
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
                        APEX{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-white">
                            HYPERTROPHY OS
                        </span>
                    </h2>

                    <p className="text-base sm:text-lg text-gray-400 font-normal leading-relaxed">
                        El Autopilot de entrenamiento y recomposición corporal. Diseñado bajo la estética de instrumentación técnica de <strong>Tesla UI</strong> y la ergonomía de <strong>Apple Fitness</strong>.
                    </p>
                </div>

                {/* Hero Showcase Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
                    {/* Left: Key Pillars */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="p-6 bg-[#0D0D0D] border border-white/10 rounded-2xl hover:border-red-500/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                                    <Activity size={18} />
                                </div>
                                <h3 className="text-lg font-bold text-white">Mapa Anatómico Interactivo & Matrices Tier S</h3>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                                Toca cualquier músculo en el modelo corporal y explora sus cabezas anatómicas con los mejores ejercicios según su perfil de resistencia (máximo estiramiento, sobrecarga pesada o contracción pico).
                            </p>
                        </div>

                        <div className="p-6 bg-[#0D0D0D] border border-white/10 rounded-2xl hover:border-cyan-500/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                    <Sparkles size={18} />
                                </div>
                                <h3 className="text-lg font-bold text-white">Nutrición Clínica & Planes de 30 Días con Gemini AI</h3>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                                Fórmulas metabólicas Katch-McArdle y Mifflin-St Jeor, déficit calórico automático, stack de suplementación clínica (Creatina, Whey, Omega-3, Magnesio) y recálculo instantáneo si comes fuera del plan.
                            </p>
                        </div>

                        <div className="p-6 bg-[#0D0D0D] border border-white/10 rounded-2xl hover:border-amber-500/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                    <Dumbbell size={18} />
                                </div>
                                <h3 className="text-lg font-bold text-white">Telemetría en Vivo & Calculadora de Discos</h3>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed pl-12 font-mono">
                                Desglose exacto de discos por lado para barra de 20 kg, series de aproximación sin fatiga, cronómetro de descanso con pulsos de audio que no pausan tu música y memoria histórica de pesos.
                            </p>
                        </div>
                    </div>

                    {/* Right: Interactive CTA Card */}
                    <div className="lg:col-span-5 bg-gradient-to-b from-[#141414] to-[#0A0A0A] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between font-mono text-xs text-gray-400 border-b border-white/5 pb-3">
                                <span className="flex items-center gap-1.5 text-green-400">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LISTA PARA USAR
                                </span>
                                <span>PWA • iOS & ANDROID</span>
                            </div>

                            <h4 className="text-2xl font-black text-white tracking-tight">
                                Lleva APEX a tu gimnasio hoy mismo
                            </h4>

                            <p className="text-xs sm:text-sm text-gray-400 font-mono leading-relaxed">
                                Instálala directamente en tu teléfono como WebApp en 2 toques: pantalla completa sin barra de navegación, con la pantalla siempre encendida mientras entrenas.
                            </p>

                            <ul className="space-y-2 text-xs font-mono text-gray-300">
                                <li className="flex items-center gap-2">
                                    <Check size={14} className="text-green-400 shrink-0" />
                                    <span>Garantía de Cuerpo Completo (Full-Body Frecuencia 2 a 7 días)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check size={14} className="text-green-400 shrink-0" />
                                    <span>Readiness check diario: Óptimo, Normal o Fatigado</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check size={14} className="text-green-400 shrink-0" />
                                    <span>Lista de compras semanal de supermercado en kilogramos</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-6 space-y-3 mt-6 border-t border-white/5">
                            <Link
                                href="/apex"
                                className="w-full py-4 bg-white hover:bg-slate-200 text-black font-mono font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 text-sm"
                            >
                                <span>LANZAR APEX WEBAPP</span>
                                <ArrowRight size={16} />
                            </Link>

                            <Link
                                href="/apex"
                                className="w-full py-3 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-white font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <Smartphone size={14} className="text-red-400" />
                                <span>Ver instrucciones para instalar en iPhone/Android</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
