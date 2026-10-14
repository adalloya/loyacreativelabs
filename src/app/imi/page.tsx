"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX, RotateCcw, Check, Maximize2, Minimize2, X, MessageSquareCode, ShieldCheck, PhoneCall } from "lucide-react";
import { runImiChat } from "@/app/actions";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
    "🔬 Calibración ISO/IEC 17025 (Flujo, Presión, Temp, Nivel)",
    "⚙️ Taller de Válvulas PSV (NOM-093-SCFI-2020)",
    "📟 Venta y Renta de Equipos (HART, Fluke, Patrones)",
    "🎓 Cursos IMI Academy (Constancias STPS DC-3)",
    "🚨 Asistencia de Emergencia para Paro de Planta 24/7",
    "📞 Hablar con Ingeniero de Guardia (+52 833 155 0189)"
];

const INITIAL_MESSAGE = {
    role: "model" as const,
    content: "Bienvenido a **Instrumentación y Metrología Industrial S.R.L. de C.V. (IMI)**.\n\nSoy tu **Ingeniero Consultor Técnico y Comercial**. Nuestro laboratorio cuenta con acreditación **ISO/IEC 17025** con trazabilidad a CENAM y NIST, y taller de válvulas de seguridad bajo norma **NOM-093-SCFI-2020**.\n\n¿En qué podemos apoyarte hoy? Puedes escribir tu consulta técnica o elegir una opción rápida 👇"
};

function ImiConsultantChat() {
    const searchParams = useSearchParams();
    const isEmbed = searchParams.get("embed") === "true";

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "model"; content: string; timestamp?: Date }[]>([
        INITIAL_MESSAGE
    ]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [confirmReset, setConfirmReset] = useState(false);
    const [leadId, setLeadId] = useState<string | undefined>(undefined);

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                setSpeechSupported(true);
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = "es-MX";

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    if (transcript.trim()) {
                        setInput(transcript);
                        setTimeout(() => handleSend(transcript), 200);
                    }
                    setIsListening(false);
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech error", event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    useEffect(() => {
        if (isListening && recognitionRef.current) {
            recognitionRef.current.start();
        } else if (!isListening && recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const toggleListening = () => {
        setIsListening(!isListening);
    };

    // Auto-scroll
    useEffect(() => {
        const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        };
        scrollToBottom();
        setTimeout(() => scrollToBottom(), 100);
    }, [messages, loading]);

    // LocalStorage Persistence for IMI
    useEffect(() => {
        const savedMsgs = localStorage.getItem("imi_chat_history");
        const savedLeadId = localStorage.getItem("imi_lead_id");
        if (savedMsgs) {
            try {
                const parsed = JSON.parse(savedMsgs);
                if (parsed.length > 0) setMessages(parsed);
            } catch (e) {
                console.error("Failed to load IMI history", e);
            }
        }
        if (savedLeadId) setLeadId(savedLeadId);
    }, []);

    useEffect(() => {
        if (messages.length > 1) {
            localStorage.setItem("imi_chat_history", JSON.stringify(messages));
        }
        if (leadId) localStorage.setItem("imi_lead_id", leadId);
    }, [messages, leadId]);

    const handleReset = () => {
        setMessages([INITIAL_MESSAGE]);
        setInput("");
        setLeadId(undefined);
        localStorage.removeItem("imi_chat_history");
        localStorage.removeItem("imi_lead_id");
        setConfirmReset(false);
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim()) return;

        const newMessages = [...messages, { role: "user" as const, content: textToSend }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const history = newMessages
                .filter((msg, index) => !(index === 0 && msg.role === "model"))
                .map(m => ({
                    role: m.role as "user" | "model",
                    parts: [{ text: m.content }]
                }));

            const response = await runImiChat(history, leadId);
            const aiText = response.text || "Estimado usuario, tuvimos un detalle técnico momentáneo. Puede contactar a nuestro Ingeniero de Guardia al WhatsApp +52 833 155 0189.";

            if (response.leadId && response.leadId !== leadId) {
                setLeadId(response.leadId);
            }

            setMessages(prev => [...prev, { role: "model", content: aiText }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "model", content: "Ocurrió una intermitencia técnica. Por favor comuníquese de inmediato a nuestro WhatsApp de guardia: +52 833 155 0189." }]);
        } finally {
            setLoading(false);
        }
    };

    const showSuggestions = !loading && messages.length > 0 && messages[messages.length - 1].role === "model";

    return (
        <main className={`h-[100dvh] flex flex-col font-sans relative overflow-hidden overscroll-none ${isEmbed ? "bg-slate-950/95" : "bg-slate-950 text-slate-100"}`}>
            {/* Background Ambience */}
            {!isEmbed && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-black z-0 pointer-events-none" />}

            {/* Header */}
            <header className={`flex-none relative z-10 p-3 md:p-4 flex justify-between items-center shrink-0 ${isEmbed ? "bg-slate-900/95 py-2.5 px-3 border-b border-cyan-500/20" : "bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/20 shadow-2xl"}`}>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <ShieldCheck size={18} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tracking-wider text-white">IMI METROLOGÍA</span>
                            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-medium">ISO 17025</span>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Ingeniero de Guardia 24/7
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-3">
                    {/* WhatsApp Fast Button */}
                    <a
                        href="https://wa.me/528331550189?text=Hola%2C%20solicito%20atenci%C3%B3n%20t%C3%A9cnica%20o%20cotizaci%C3%B3n%20de%20un%20ingeniero%20IMI."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-transform active:scale-95"
                        title="Contactar por WhatsApp Oficial de Guardia"
                    >
                        <PhoneCall size={13} />
                        <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    {/* Reset Button */}
                    <button
                        onClick={confirmReset ? handleReset : () => setConfirmReset(true)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border ${confirmReset
                            ? "bg-red-600 text-white border-red-500"
                            : "text-slate-400 hover:text-red-400 hover:bg-red-950/20 border-transparent"
                            }`}
                        title={confirmReset ? "Confirmar reinicio" : "Reiniciar chat"}
                    >
                        {confirmReset ? <Check size={13} /> : <RotateCcw size={13} />}
                        <span className="text-xs hidden md:inline">{confirmReset ? "¿Confirmar?" : "Nuevo"}</span>
                    </button>

                    {isEmbed && (
                        <div className="flex items-center gap-1 border-l border-slate-700/60 pl-1.5">
                            <button
                                onClick={() => {
                                    if (typeof window !== "undefined") {
                                        window.open("/imi", "_blank");
                                    }
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                                title="Abrir en pantalla completa"
                            >
                                <Maximize2 size={16} />
                            </button>
                            <button
                                onClick={() => {
                                    if (typeof window !== "undefined") {
                                        window.parent.postMessage("close-imi-widget", "*");
                                    }
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                                title="Cerrar ventana"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden p-3 md:p-6 space-y-4 scroll-smooth overscroll-contain">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-300`}>
                        <div className={`max-w-[88%] md:max-w-2xl p-3 md:p-4 rounded-2xl text-sm md:text-base leading-relaxed ${msg.role === "user"
                            ? "bg-cyan-600 text-white rounded-tr-sm shadow-md shadow-cyan-600/20"
                            : "bg-slate-900/90 border border-cyan-500/20 text-slate-200 rounded-tl-sm shadow-[0_4px_20px_rgba(6,182,212,0.06)]"
                            }`}>
                            {msg.role === "user" ? (
                                msg.content
                            ) : (
                                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:p-2 prose-pre:rounded-lg max-w-none text-slate-200 text-sm md:text-base">
                                    <ReactMarkdown
                                        components={{
                                            strong: ({ node, ...props }) => <span className="font-semibold text-white" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="marker:text-cyan-400" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-cyan-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="flex items-center gap-2 p-3 bg-slate-900/80 rounded-2xl border border-cyan-500/20 text-xs text-cyan-400">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
                            <span className="ml-1 text-slate-400">Analizando especificaciones técnicas...</span>
                        </div>
                    </div>
                )}

                {/* Suggestions Chips */}
                {showSuggestions && messages.length === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {SUGGESTIONS.map((sug, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(sug)}
                                className="text-left p-2.5 rounded-xl border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50 hover:bg-cyan-950/30 transition-all text-xs text-slate-300 hover:text-white"
                            >
                                {sug}
                            </button>
                        ))}
                    </div>
                )}

                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Bar */}
            <div className="flex-none relative z-20 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 p-3 md:p-4 pb-4 md:pb-6 shrink-0">
                <div className="max-w-3xl mx-auto flex items-center gap-2 bg-slate-900/90 p-1.5 md:p-2 rounded-full border border-slate-700/60 shadow-xl focus-within:border-cyan-500/60 transition-colors">
                    {speechSupported && (
                        <button
                            onClick={toggleListening}
                            className={`p-2.5 md:p-3 rounded-full transition-all duration-300 ${isListening
                                ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                }`}
                            title={isListening ? "Detener micrófono" : "Hablar por micrófono"}
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                    )}

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Escuchando requerimiento..." : "Escribe tu duda técnica o cotización..."}
                        className="flex-1 bg-transparent border-none outline-none text-slate-100 text-sm md:text-base placeholder-slate-500 font-light px-2 min-w-0"
                        disabled={isListening}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="p-3 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-full text-white shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shrink-0"
                        title="Enviar consulta"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-500">
                        Instrumentación y Metrología Industrial S.R.L. de C.V. • Altamira, Tamaulipas • Conmutador: (833) 126.9795
                    </p>
                </div>
            </div>
        </main>
    );
}

export default function ImiPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-slate-950 text-cyan-400"><Loader2 className="animate-spin" /></div>}>
            <ImiConsultantChat />
        </Suspense>
    );
}
