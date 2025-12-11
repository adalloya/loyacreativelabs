"use client";

import { MessageSquare, Zap, Target, Layers } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { content } from "@/data/content";

export default function ChatbotPromo() {
    const { language } = useLanguage();
    const t = content[language].chatPromo;

    return (
        <section className="relative py-24 px-4 bg-zinc-950 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-900/20 blur-[120px] rounded-full pointing-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-900/10 blur-[120px] rounded-full pointing-events-none" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

                {/* Left: Copy */}
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-widest uppercase">
                        <Zap size={14} className="fill-purple-300" /> {t.badge}
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
                        {t.title.split(":")[0]}
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                            {t.title.split(":")[1] ? t.title.split(":")[1] : ""}
                        </span>
                    </h2>

                    <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
                        {t.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {t.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-gray-300">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                    <Target size={14} className="text-green-400" />
                                </div>
                                <span className="text-sm font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => {
                                // Trigger Widget Open
                                const widgetFrame = document.querySelector('iframe[src*="/consultant"]');
                                if (widgetFrame) {
                                    // Try to click the custom launcher if possible, or just redirect
                                    window.location.href = "/?chat_open=true";
                                } else {
                                    window.location.href = "/consultant";
                                }
                            }}
                            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={20} />
                            {t.cta}
                        </button>
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="relative">
                    {/* Mock Chat Interface */}
                    <div className="relative z-10 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">AI</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">Loya Agent</h4>
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="space-y-4 text-sm mb-6">
                            <div className="flex justify-start">
                                <div className="bg-zinc-800 text-purple-200 p-3 rounded-2xl rounded-tl-sm max-w-[85%] border border-purple-500/20">
                                    Hola 👋. Vi que estás interesado en rediseñar tu web. ¿Qué presupuesto tienes en mente?
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-lg">
                                    Hola! Sí, buscamos algo premium. Entre $2,000 y $5,000 USD.
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <div className="bg-zinc-800 text-purple-200 p-3 rounded-2xl rounded-tl-sm max-w-[85%] border border-purple-500/20">
                                    ¡Perfecto! Con ese rango podemos crear una "Web App" completa con Next.js. ¿Te gustaría ver una demo mañana a las 10 AM?
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <div className="p-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Input Mock */}
                        <div className="bg-zinc-950/50 rounded-full p-2 flex items-center gap-3 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-gray-500">
                                <Mic size={14} />
                            </div>
                            <div className="h-2 w-24 bg-zinc-800 rounded-full" />
                            <div className="flex-1" />
                            <div className="w-8 h-8 rounded-full bg-purple-600/50 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -z-10 -top-10 -right-10 w-64 h-64 bg-pink-500/30 blur-[80px] rounded-full" />
                </div>
            </div>
        </section>
    );
}

function Mic({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    )
}
