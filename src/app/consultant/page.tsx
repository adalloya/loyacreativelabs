```
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Mic, MicOff, Send, Loader2, ArrowLeft, Volume2, VolumeX, RotateCcw, Check, Maximize2, Minimize2, X } from "lucide-react";
import Link from "next/link";
import { runGeminiChat } from "@/app/actions";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

// Restoration of constants
const SUGGESTIONS = [
    "💰 ¿Cuánto cuesta una web?",
    "🚀 Quiero transformar mi negocio",
    "📱 ¿Hacen Apps móviles?",
    "🎨 Necesito Branding",
    "📅 Agendar una reunión"
];

const INITIAL_MESSAGE = { role: "model" as const, content: "Bienvenido a Loya Creative Lab. Soy tu asistente de IA. Elige una opción 👇 o escribe tu consulta para comenzar." };

function ConsultantChat() {
    const searchParams = useSearchParams();
    const isEmbed = searchParams.get("embed") === "true";

    const [input, setInput] = useState("");
    // ... (rest of state items are same, copy existing)
    const [messages, setMessages] = useState<{ role: "user" | "model"; content: string; timestamp?: Date }[]>([
        INITIAL_MESSAGE
    ]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [confirmReset, setConfirmReset] = useState(false);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                setSpeechSupported(true);
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'es-ES';

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    if (transcript.trim()) {
                        setInput(transcript); // Visual feedback
                        setTimeout(() => handleSend(transcript), 200); // Auto-send
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

    // Effect to toggle listening
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

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Hide global widget if present (so we don't have double chat)
    useEffect(() => {
        const widget = document.getElementById('loya-ai-widget');
        if (widget) widget.style.display = 'none';
        return () => {
            // Restore visibility when leaving the page (FIX for navigation issue)
            if (widget) widget.style.display = 'block';
        };
    }, []);

    const [leadId, setLeadId] = useState<string | undefined>(undefined);

    // Auto-scroll logic (unchanged)
    // Auto-scroll logic (Improved for initial load)
    useEffect(() => {
        const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        };

        // If it's the initial load (or very first render), do it instantly
        // Otherwise, do it smoothly
        scrollToBottom();

        // Double check after a small delay to handle layout shifts
        setTimeout(() => scrollToBottom(), 100);
    }, [messages, loading]);

    // Persistence logic (unchanged)
    useEffect(() => {
        // ... (persistence logic from before)
        const savedMsgs = localStorage.getItem("adal_history");
        const savedLeadId = localStorage.getItem("adal_lead_id");
        if (savedMsgs) {
            try {
                const parsed = JSON.parse(savedMsgs);
                if (parsed.length > 0) setMessages(parsed);
            } catch (e) { console.error("Failed to load history", e); }
        }
        if (savedLeadId) setLeadId(savedLeadId);
    }, []);

    useEffect(() => {
        if (messages.length > 1) {
            localStorage.setItem("adal_history", JSON.stringify(messages));
        }
        if (leadId) localStorage.setItem("adal_lead_id", leadId);
    }, [messages, leadId]);

    // ... (handlers handleReset, handleSend etc remain exact same)
    const handleReset = () => {
        setMessages([INITIAL_MESSAGE]);
        setInput("");
        setLeadId(undefined);
        localStorage.removeItem("adal_history");
        localStorage.removeItem("adal_lead_id");
        setConfirmReset(false);
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim()) return;

        // Add User Message
        const newMessages = [...messages, { role: "user" as const, content: textToSend }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            // Convert history
            const history = newMessages
                .filter((msg, index) => !(index === 0 && msg.role === 'model'))
                .map(m => ({
                    role: m.role as "user" | "model",
                    parts: [{ text: m.content }]
                }));

            const response = await runGeminiChat(history, leadId);
            const aiText = response.text || "Lo siento, tuve un error de conexión.";

            if (response.leadId && response.leadId !== leadId) {
                setLeadId(response.leadId);
            }

            setMessages(prev => [...prev, { role: "model", content: aiText }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "model", content: "Lo siento, ha ocurrido un error. ¿Podrías repetirlo?" }]);
        } finally {
            setLoading(false);
        }
    };

    const showSuggestions = !loading && messages.length > 0 && messages[messages.length - 1].role === 'model';


    return (
        <main className={`h - [100dvh] flex flex - col font - sans relative overflow - hidden overscroll - none ${ isEmbed ? 'bg-zinc-950/90' : 'bg-black text-white' } `}>
            {/* Background Ambience - Hide in Embed */}
            {!isEmbed && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 pointer-events-none" />}

            {/* Header - Simplified for Embed */}
            <header className={`flex - none relative z - 10 p - 4 flex justify - between items - center shrink - 0 ${ isEmbed ? 'bg-zinc-900/90 py-3 px-4 border-b border-white/5' : 'md:p-6 bg-black/80 backdrop-blur-md border-b border-white/5 shadow-2xl' } `}>

                {!isEmbed ? (
                    <a href="/?chat_open=true" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 group">
                        <Minimize2 size={20} className="group-hover:scale-90 transition-transform" />
                        <span className="text-sm font-medium tracking-widest uppercase hidden md:inline">Minimizar</span>
                    </a>
                ) : (
                    // In embed, show branding + Maximize/Close Buttons
                    <div className="flex items-center w-full justify-between">
                        {/* Title (Left) */}
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-bold text-white tracking-widest">LOYALAB AI</span>
                        </div>

                        {/* Actions (Right) */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        window.open('/consultant', '_blank');
                                    }
                                }}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                title="Abrir en ventana nueva"
                            >
                                <Maximize2 size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        window.parent.postMessage('close-widget', '*');
                                    }
                                }}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                title="Cerrar chat"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={confirmReset ? handleReset : () => setConfirmReset(true)}
                        className={`flex items - center gap - 2 px - 3 py - 1.5 rounded - full transition - all mr - 2 border ${
    confirmReset
        ? 'bg-red-600/90 text-white border-red-500 animate-in fade-in zoom-in-95'
        : 'text-gray-400 hover:text-red-400 hover:bg-red-900/10 border-transparent hover:border-red-900/30'
} `}
                        title={confirmReset ? "¡Dale clic para borrar!" : "Nueva Conversación"}
                    >
                        {confirmReset ? <Check size={14} /> : <RotateCcw size={14} />}
                        <span className={`text - xs font - medium ${ isEmbed ? 'hidden' : '' } `}>{confirmReset ? "¿Estás seguro?" : "Empezar de nuevo"}</span>
                    </button>
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p - 2 rounded - full transition - colors ${ audioEnabled ? 'text-purple-400 bg-purple-900/20' : 'text-gray-600' } `}>
                        {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    {!isEmbed && (
                        <div className="text-right">
                            <h1 className="font-bold text-lg tracking-tight">ADAL</h1>
                            <p className="text-[10px] text-green-400 uppercase tracking-widest font-bold flex items-center justify-end gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                            </p>
                        </div>
                    )}
                </div>
            </header>

            {/* Chat Area - Flexible & Scrollable */}
            <div className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden p-4 md:p-8 space-y-4 scroll-smooth overscroll-contain">
                {messages.map((msg, idx) => (

                    <div key={idx} className={`flex ${ msg.role === 'user' ? 'justify-end' : 'justify-start' } animate -in fade -in slide -in -from - bottom - 2 duration - 500`}>
                        <div className={`max - w - [85 %] md: max - w - 2xl p - 3 md: p - 5 rounded - 2xl text - base md: text - lg leading - relaxed ${
    msg.role === 'user'
        ? 'bg-zinc-800 text-white rounded-tr-sm'
        : 'bg-transparent border border-purple-500/30 text-purple-100 rounded-tl-sm shadow-[0_0_30px_rgba(168,85,247,0.1)]'
} `}>

                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:p-2 prose-pre:rounded-lg max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            strong: ({ node, ...props }) => <span className="font-bold text-white" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="marker:text-purple-400" {...props} />
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
                        <div className="flex gap-1 p-4">
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                {/* Suggestion Chips - Show ONLY at the start (when history is just the greeting) */}
                {showSuggestions && messages.length === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {SUGGESTIONS.map((sug, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(sug)}
                                className="text-left p-3 rounded-xl border border-white/10 hover:border-purple-500/50 hover:bg-purple-900/10 transition-all text-xs md:text-sm text-gray-300 hover:text-white"
                            >
                                {sug}
                            </button>
                        ))}
                    </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="flex-none relative z-20 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 md:p-6 pb-6 md:pb-8 shrink-0">
                <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-4 bg-zinc-900/50 p-2 rounded-full border border-white/5 shadow-2xl focus-within:border-purple-500/50 transition-colors">

                    {speechSupported && (
                        <button
                            onClick={toggleListening}
                            className={`p - 3 md: p - 4 rounded - full transition - all duration - 300 ${
    isListening
        ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
        : 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700'
} `}
                        >
                            {isListening ? <MicOff size={20} className="md:w-6 md:h-6" /> : <Mic size={20} className="md:w-6 md:h-6" />}
                        </button>
                    )}

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Escuchando..." : "Escribe tu mensaje..."}
                        className="flex-1 bg-transparent border-none outline-none text-white text-base md:text-lg placeholder-gray-500 font-light px-2 min-w-0"
                        disabled={isListening}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-white shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shrink-0"
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                    </button>
                </div>

            </div>
        </main>
    );
}

// Wrap in Suspense for useSearchParams
export default function ConsultantPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin" /></div>}>
            <ConsultantChat />
        </Suspense>
    );
}
