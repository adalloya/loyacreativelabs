"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Phone, Video, MoreVertical, ArrowLeft, Paperclip, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type Message = {
    id: string;
    role: "user" | "model";
    text: string;
    timestamp: string;
};

export default function SimulatorPage() {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        setMessages([
            {
                id: "welcome",
                role: "model",
                text: "¡Hola! Soy LoyaBot, tu asistente virtual. ¿En qué puedo ayudarte hoy a transformar tu negocio?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    }, []);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // Prepare history for API (excluding the last message we just added effectively, 
            // but API expects full history including current context if we designed it that way. 
            // Actually geminiService.generateResponse(message, history) expects history BEFORE the message usually, 
            // or we handle it in the service. Let's pass the previous messages as history.
            const history = messages
                .filter(m => m.id !== "welcome")
                .map(m => ({
                    role: m.role,
                    parts: m.text
                }));

            const res = await fetch("/api/mock-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg.text,
                    history: history
                })
            });

            const data = await res.json();

            if (data.response) {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "model",
                    text: data.response,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b141a] flex items-center justify-center p-4 font-sans">
            {/* Phone Container */}
            <div className="w-full max-w-md bg-[#efeae2] h-[85vh] rounded-[30px] overflow-hidden shadow-2xl relative flex flex-col border-[8px] border-[#1f2c34]">

                {/* Header */}
                <div className="bg-[#202c33] p-4 flex items-center justify-between text-white shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <ArrowLeft className="w-6 h-6" />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg font-bold">
                            AI
                        </div>
                        <div>
                            <h3 className="font-semibold text-base leading-tight">LoyaBot Sales AI</h3>
                            <p className="text-xs text-gray-400">En línea</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                        <Video className="w-5 h-5" />
                        <Phone className="w-5 h-5" />
                        <MoreVertical className="w-5 h-5" />
                    </div>
                </div>

                {/* Wallpaper Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-0"
                    style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>
                </div>

                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative z-0 scroll-smooth">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className={cn(
                                "flex w-full",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-lg p-2 px-3 shadow-sm text-sm leading-relaxed relative",
                                    msg.role === "user"
                                        ? "bg-[#005c4b] text-white rounded-tr-none"
                                        : "bg-[#202c33] text-gray-100 rounded-tl-none"
                                )}
                            >
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                <span className={cn(
                                    "opacity-50 text-[10px] float-right mt-1 ml-2",
                                    msg.role === "user" ? "text-gray-200" : "text-gray-400"
                                )}>
                                    {msg.timestamp}
                                </span>

                                {/* Bubble Triangle (CSS would be better but simple approximation) */}
                                {msg.role === "user" ? (
                                    <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#005c4b] border-r-[10px] border-r-transparent" />
                                ) : (
                                    <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-[#202c33] border-l-[10px] border-l-transparent" />
                                )}

                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-[#202c33] rounded-lg p-3 px-4 rounded-tl-none shadow-sm flex gap-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-[#202c33] p-3 flex items-center gap-2 shrink-0 z-10">
                    <Smile className="w-6 h-6 text-gray-400 hidden md:block" />
                    <Paperclip className="w-6 h-6 text-gray-400" />

                    <div className="flex-1 bg-[#2a3942] rounded-lg flex items-center px-4 py-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Escribe un mensaje"
                            className="bg-transparent text-white w-full focus:outline-none text-base font-normal placeholder:text-gray-400"
                        />
                    </div>

                    {input.trim() ? (
                        <button onClick={handleSend} className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white transition-transform active:scale-95">
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    ) : (
                        <button className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center text-gray-400">
                            <Mic className="w-5 h-5" />
                        </button>
                    )}
                </div>

            </div>

            <div className="fixed bottom-4 text-white/30 text-xs text-center">
                Loya Creative Lab • AI Simulator <br />
                (Requiere GOOGLE_API_KEY en .env.local)
            </div>
        </div>
    );
}
