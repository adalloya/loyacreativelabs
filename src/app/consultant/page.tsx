"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Loader2, ArrowLeft, Volume2, VolumeX, RotateCcw, Check } from "lucide-react";
import Link from "next/link";
import { runGeminiChat } from "@/app/actions";

const SUGGESTIONS = [
    "💰 ¿Cuánto cuesta una web?",
    "🚀 Quiero transformar mi negocio",
    "📱 ¿Hacen Apps móviles?",
    "🎨 Necesito Branding",
    "📅 Agendar una reunión"
];

const INITIAL_MESSAGE = { role: "model" as const, content: "Hola, soy Adal. Estoy aquí para ayudarte a transformar tu negocio. ¿Qué tienes en mente hoy?" };

export default function ConsultantPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "model"; content: string; timestamp?: Date }[]>([
        INITIAL_MESSAGE
    ]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Persistence Effect
    useEffect(() => {
        const saved = localStorage.getItem("adal_history");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.length > 0) setMessages(parsed);
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
    }, []);

    useEffect(() => {
        if (messages.length > 1) { // Only save if there's real interaction
            localStorage.setItem("adal_history", JSON.stringify(messages));
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // Initialize Speech API
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false; // Stop after one sentence for turn-taking
                recognition.lang = "es-MX";
                recognition.interimResults = false;

                recognition.onresult = (event: any) => {
                    const text = event.results[0][0].transcript;
                    setInput(text);
                    handleSend(text); // Auto-send on voice end
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech error", event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
                setSpeechSupported(true);
            }

            // Speech Synthesis
            if ("speechSynthesis" in window) {
                synthesisRef.current = window.speechSynthesis;
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const [confirmReset, setConfirmReset] = useState(false);

    // ... other imports if needed, ensure Check icon is imported? I'll need to check imports.

    const handleReset = () => {
        setMessages([INITIAL_MESSAGE]);
        setInput("");
        localStorage.removeItem("adal_history");
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

        // Call Gemini
        try {
            // Convert history to format needed by Gemini (filtering out initial model message if it exists)
            // Gemini requires the first message to be from 'user'
            const history = newMessages
                .filter((msg, index) => !(index === 0 && msg.role === 'model'))
                .map(m => ({
                    role: m.role as "user" | "model",
                    parts: [{ text: m.content }]
                }));

            const response = await runGeminiChat(history);
            const aiText = response.text || "Lo siento, tuve un error de conexión.";

            setMessages(prev => [...prev, { role: "model", content: aiText }]);

            // Voice response disabled per user request
            // speak(aiText);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "model", content: "Lo siento, ha ocurrido un error. ¿Podrías repetirlo?" }]);
        } finally {
            setLoading(false);
        }
    };

    const showSuggestions = !loading && messages.length > 0 && messages[messages.length - 1].role === 'model';

    return (
        <main className="h-[100dvh] bg-black text-white flex flex-col font-sans relative overflow-hidden overscroll-none">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 pointer-events-none" />

            {/* Header - Fixed to top */}
            <header className="flex-none relative z-10 p-4 md:p-6 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/5 shadow-2xl shrink-0">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <ArrowLeft size={20} /> <span className="text-sm font-medium tracking-widest uppercase">Regresar</span>
                </Link>
                <div className="flex items-center gap-4">
                    <button
                        onClick={confirmReset ? handleReset : () => setConfirmReset(true)}
                        // onMouseLeave removed to prevent mobile issues
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all mr-2 border ${confirmReset
                            ? 'bg-red-600/90 text-white border-red-500 animate-in fade-in zoom-in-95'
                            : 'text-gray-400 hover:text-red-400 hover:bg-red-900/10 border-transparent hover:border-red-900/30'
                            }`}
                        title={confirmReset ? "¡Dale clic para borrar!" : "Nueva Conversación"}
                    >
                        {confirmReset ? <Check size={14} /> : <RotateCcw size={14} />}
                        <span className="text-xs font-medium">{confirmReset ? "¿Estás seguro?" : "Empezar de nuevo"}</span>
                    </button>
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 rounded-full transition-colors ${audioEnabled ? 'text-purple-400 bg-purple-900/20' : 'text-gray-600'}`}>
                        {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <div className="text-right">
                        <h1 className="font-bold text-lg tracking-tight">ADAL</h1>
                        <p className="text-[10px] text-green-400 uppercase tracking-widest font-bold flex items-center justify-end gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                        </p>
                    </div>
                </div>
            </header>

            {/* Chat Area - Flexible & Scrollable */}
            <div className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden p-4 md:p-8 space-y-6 scroll-smooth overscroll-contain">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                        <div className={`max-w-[85%] md:max-w-2xl p-4 md:p-6 rounded-2xl text-lg md:text-xl leading-relaxed ${msg.role === 'user'
                            ? 'bg-zinc-800 text-white rounded-tr-sm'
                            : 'bg-transparent border border-purple-500/30 text-purple-100 rounded-tl-sm shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                            }`}>
                            {msg.content}
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

                {/* Suggestion Chips - Show always when AI finishes responding */}
                {showSuggestions && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {SUGGESTIONS.map((sug, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(sug)}
                                className="text-left p-4 rounded-xl border border-white/10 hover:border-purple-500/50 hover:bg-purple-900/10 transition-all text-sm md:text-base text-gray-300 hover:text-white"
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
                <div className="max-w-3xl mx-auto flex items-center gap-4 bg-zinc-900/50 p-2 rounded-full border border-white/5 shadow-2xl focus-within:border-purple-500/50 transition-colors">

                    {speechSupported && (
                        <button
                            onClick={toggleListening}
                            className={`p-4 rounded-full transition-all duration-300 ${isListening
                                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                                : 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700'
                                }`}
                        >
                            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                    )}

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Escuchando..." : "Escribe tu mensaje..."}
                        className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-gray-500 font-light px-2 min-w-0"
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
                <p className="text-center text-xs text-gray-600 mt-4">Powered by Gemini 2.0 Flash</p>
            </div>
        </main>
    );
}
