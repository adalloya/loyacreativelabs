"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Providers from "../../providers";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, getDoc, onSnapshot, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Loader2, MessageSquare, X, Send, Phone, User, Briefcase, Calendar, DollarSign, Search, ArrowLeft, Trash2 } from "lucide-react";
import { sendWhatsAppMessage } from "@/app/actions";
import Link from "next/link";

interface Message {
    role: "user" | "model" | "assistant";
    content: string;
    timestamp: any;
}

interface Lead {
    id: string;
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    budget?: string;
    service_interest?: string[] | string;
    timeline?: string;
    source: string;
    status: string;
    created_at: any;
}

export default function AdminCRMPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyText, setReplyText] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "new" | "contacted" | "qualified" | "closed">("all");
    const [seeding, setSeeding] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const handleSeedData = async () => {
        if (!confirm("This will add 5 realistic test leads. Continue?")) return;
        setSeeding(true);
        try {
            const { addDoc, collection } = await import("firebase/firestore");

            const dummyLeads = [
                {
                    name: "Fernanda Castillo",
                    company: "Inmobiliaria Horizon",
                    email: "fer@horizon.mx",
                    phone: "5511223344",
                    service_interest: ["Web App", "CRM"],
                    budget: "+$50,000 MXN",
                    timeline: "Urgent",
                    source: "web_form",
                    status: "new",
                    messages: [
                        { role: "user", content: "Hola, vi su anuncio. Necesito un sistema para gestionar mis propiedades.", timestamp: new Date(Date.now() - 86400000) },
                        { role: "model", content: "¡Hola Fernanda! Claro que sí. ¿Buscas algo a la medida o integrar algo existente?", timestamp: new Date(Date.now() - 86340000) }
                    ]
                },
                {
                    name: "Roberto Mendez",
                    company: "Restaurante El Sabor",
                    email: "roberto@elsabor.com",
                    phone: "5599887766",
                    service_interest: ["Branding", "Social Media"],
                    budget: "$15,000 MXN",
                    timeline: "1 month",
                    source: "whatsapp_bot",
                    status: "contacted",
                    messages: [
                        { role: "user", content: "Info de paquetes de branding.", timestamp: new Date(Date.now() - 172800000) },
                        { role: "model", content: "Hola Roberto, soy Adal. Manejamos paquetes desde $10k. ¿Tienes ya logotipo?", timestamp: new Date(Date.now() - 172700000) },
                        { role: "user", content: "Sí, pero quiero renovarlo.", timestamp: new Date(Date.now() - 172600000) }
                    ]
                },
                {
                    name: "Dr. Alejandro Silva",
                    company: "Clinica Dental Silva",
                    email: "alejandro@silva.med",
                    phone: "5544668800",
                    service_interest: ["Web Design", "Google Ads"],
                    budget: "$25,000 MXN",
                    timeline: "Flexible",
                    source: "web_form",
                    status: "qualified",
                    messages: []
                },
                {
                    name: "Sofía Vergara",
                    company: "Fashion Nova MX",
                    email: "sofia@nova.mx",
                    phone: "5577112233",
                    service_interest: ["E-commerce"],
                    budget: "Unknown",
                    timeline: "3 months",
                    source: "whatsapp_bot",
                    status: "closed",
                    messages: [
                        { role: "user", content: "Quiero vender ropa en línea.", timestamp: new Date(Date.now() - 400000000) }
                    ]
                },
                {
                    name: "Carlos Ruiz",
                    company: "Tech Solutions",
                    email: "carlos@techsol.com",
                    phone: "5500998877",
                    service_interest: ["App Development"],
                    budget: "+$100,000 MXN",
                    timeline: "ASAP",
                    source: "web_form",
                    status: "new",
                    messages: []
                }
            ];

            for (const lead of dummyLeads) {
                const { messages, ...leadData } = lead;
                const docRef = await addDoc(collection(db, "leads"), {
                    ...leadData,
                    created_at: new Date()
                });

                if (messages.length > 0) {
                    const { addDoc: addMsg, collection: colMsg } = await import("firebase/firestore");
                    for (const msg of messages) {
                        await addMsg(colMsg(db, "leads", docRef.id, "messages"), msg);
                    }
                }
            }
            alert("5 Realistic Leads Generated!");
            window.location.reload();
        } catch (e: any) {
            console.error(e);
            alert("Error seeding data: " + e.message);
        } finally {
            setSeeding(false);
        }
    };

    const updateLeadStatus = async (newStatus: string) => {
        if (!selectedLead || !db) return;
        setUpdatingStatus(true);
        try {
            const { doc, updateDoc } = await import("firebase/firestore");
            const leadRef = doc(db, "leads", selectedLead.id);
            await updateDoc(leadRef, { status: newStatus });

            // Update local state
            setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: newStatus } : l));
            setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (e) {
            console.error(e);
            alert("Failed to update status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteLead = async () => {
        if (!selectedLead || !db) return;
        if (!confirm("Are you sure you want to PERMANENTLY delete this lead? This cannot be undone.")) return;

        try {
            const { doc, deleteDoc } = await import("firebase/firestore");
            await deleteDoc(doc(db, "leads", selectedLead.id));

            // Update UI
            setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
            setSelectedLead(null);
            alert("Lead deleted.");
        } catch (e) {
            console.error(e);
            alert("Error deleting lead.");
        }
    };

    // Filter Logic
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = (lead.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (lead.company?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (lead.phone?.includes(searchTerm));
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Fetch Leads
    useEffect(() => {
        if (!isAuthenticated) return;

        async function fetchLeads() {
            try {
                if (!db) return;
                const q = query(collection(db, "leads")); // orderBy might require index, removing for safety
                const snapshot = await getDocs(q);
                const fetchedLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
                // Client side sort
                fetchedLeads.sort((a, b) => {
                    const tA = a.created_at?.seconds || 0;
                    const tB = b.created_at?.seconds || 0;
                    return tB - tA;
                });
                setLeads(fetchedLeads);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchLeads();
    }, [isAuthenticated]);

    // Fetch Messages when Lead Selected
    useEffect(() => {
        if (!selectedLead) return;
        async function fetchMessages() {
            setLoadingMessages(true);
            try {
                // Check if subcollection "messages" exists
                const q = query(collection(db, "leads", selectedLead!.id, "messages"), orderBy("timestamp", "asc"));
                const snapshot = await getDocs(q);
                const msgs = snapshot.docs.map(d => d.data() as Message);
                setMessages(msgs);
            } catch (e) {
                console.log("No messages or error", e);
                setMessages([]);
            } finally {
                setLoadingMessages(false);
            }
        }
        fetchMessages();
    }, [selectedLead]);

    const handleSendReply = async () => {
        if (!selectedLead?.phone && !selectedLead?.id) return alert("No phone number for this lead");
        // If it's a web form lead, we might not have the phone as ID. 
        // We need to check if 'phone' field exists or if ID is phone.
        const targetPhone = selectedLead!.phone || (selectedLead!.id.length > 8 ? selectedLead!.id : null);

        if (!targetPhone) return alert("This lead has no phone number connected.");

        const res = await sendWhatsAppMessage(targetPhone, replyText);
        if (res.success) {
            setReplyText("");
            // Optimistically add to list
            setMessages(prev => [...prev, { role: "model", content: replyText, timestamp: new Date() }]);
            alert("Message sent!");
        } else {
            alert("Error sending message");
        }
    };

    // Auth Check Render
    if (!isAuthenticated) {
        return (
            <Providers>
                <main className="bg-black min-h-screen text-white flex flex-col font-sans overflow-hidden">
                    <Navbar />
                    <div className="flex-grow flex items-center justify-center p-4">
                        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-md space-y-6">
                            <h1 className="text-2xl font-bold text-center">Loya CRM</h1>
                            <input
                                type="password"
                                placeholder="Enter Password"
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && password === "admin123") setIsAuthenticated(true); }}
                            />
                            <button onClick={() => password === "admin123" ? setIsAuthenticated(true) : alert("Wrong")} className="w-full bg-white text-black font-bold py-3 rounded-lg">Login</button>
                        </div>
                    </div>
                </main>
            </Providers>
        );
    }

    return (
        <Providers>
            <main className="bg-black h-[100dvh] text-white flex flex-col font-sans overflow-hidden overscroll-none">
                {/* CRM Header - customized for Admin context */}
                <div className="flex-none border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/80 backdrop-blur z-20">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <Link href="/" className="font-bold text-lg md:text-xl tracking-tighter shrink-0 hover:text-purple-400 transition-colors">
                            LOYA<span className="text-gray-500">CRM</span>
                        </Link>

                        {/* Mobile: Simple search icon, Desktop: Full bar */}
                        <div className="flex items-center gap-2 bg-black/50 border border-zinc-800 rounded-lg px-3 py-1.5 w-full md:w-64 max-w-[140px] md:max-w-none">
                            <Search className="w-4 h-4 text-gray-500 shrink-0" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-600 min-w-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Status Filter - Hidden on small mobile */}
                        <select
                            className="hidden md:block bg-black/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none"
                            value={statusFilter}
                            onChange={(e: any) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            <option value="new">Nuevos</option>
                            <option value="contacted">Contactados</option>
                            <option value="qualified">Calificados</option>
                            <option value="closed">Cerrados</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSeedData}
                        disabled={seeding}
                        className="text-xs bg-zinc-800 hover:bg-purple-900/20 hover:text-purple-300 disabled:opacity-50 px-3 py-2 rounded-full border border-zinc-700 flex items-center gap-2 transition-all whitespace-nowrap"
                    >
                        {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : "🌱 Seed Data"}
                    </button>
                </div>

                {/* Status Filter Bar for Mobile (below header) */}
                <div className="md:hidden flex-none border-b border-zinc-800 bg-zinc-900/30 px-4 py-2 overflow-x-auto">
                    <select
                        className="bg-transparent text-xs text-gray-400 outline-none w-full"
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Filtrar: Todos</option>
                        <option value="new">Nuevos</option>
                        <option value="contacted">Contactados</option>
                        <option value="qualified">Calificados</option>
                        <option value="closed">Cerrados</option>
                    </select>
                </div>

                <div className="flex-1 flex overflow-hidden relative">
                    {/* LEFT PANEL: LEAD LIST */}
                    <div className={`${selectedLead ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-zinc-800 flex-col bg-zinc-900/20 relative z-10`}>
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                            <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider">inbox ({filteredLeads.length})</h2>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-purple-500" /></div> :
                                filteredLeads.length === 0 ? <div className="text-center text-gray-600 py-10 text-sm">No leads found.</div> :
                                    filteredLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            onClick={() => setSelectedLead(lead)}
                                            className={`p - 4 rounded - xl cursor - pointer transition - all border ${selectedLead?.id === lead.id ? 'bg-zinc-800 border-purple-500/50 shadow-lg shadow-purple-900/10' : 'bg-transparent border-transparent hover:bg-zinc-800/50 hover:border-zinc-800'} `}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-white">{leadName(lead)}</h3>
                                                <span className={`text - [10px] px - 2 py - 0.5 rounded - full uppercase font - bold tracking - widest ${lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                                                    lead.status === 'qualified' ? 'bg-green-500/20 text-green-400' :
                                                        lead.status === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                                                            'bg-yellow-500/20 text-yellow-400'
                                                    } `}>{lead.status || 'new'}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">{lead.company || "No Company"}</p>
                                            <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
                                                <span>{lead.source?.replace('_', ' ')}</span>
                                                <span>•</span>
                                                <span>{lead.created_at?.seconds ? new Date(lead.created_at?.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                            </div>
                                        </div>
                                    ))}
                        </div>
                    </div>

                    {/* RIGHT PANEL: DETAILS & CHAT */}
                    <div className={`${!selectedLead ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-black relative z-10`}>
                        {selectedLead ? (
                            <>
                                {/* HEADER */}
                                <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/30">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setSelectedLead(null)} className="md:hidden p-2 -ml-2 text-gray-400"><ArrowLeft size={20} /></button>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                            {leadName(selectedLead).charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-white leading-tight">{leadName(selectedLead)}</h2>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Briefcase size={10} /> {selectedLead.company || "No Company"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* STATUS & ACTIONS */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-500 hidden sm:block">Status:</label>
                                            <select
                                                value={selectedLead.status || 'new'}
                                                onChange={(e) => updateLeadStatus(e.target.value)}
                                                disabled={updatingStatus}
                                                className="bg-zinc-800 text-xs text-white px-3 py-1.5 rounded-lg border border-zinc-700 outline-none focus:border-purple-500 transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="qualified">Qualified</option>
                                                <option value="closed">Closed / Lost</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={handleDeleteLead}
                                            title="Delete Lead"
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 flex overflow-hidden">
                                    {/* INFO SIDEBAR (Desktop: Left inside Right Panel, Mobile: Top) */}
                                    <div className="w-80 border-r border-zinc-800 bg-zinc-900/10 p-6 space-y-6 overflow-y-auto hidden xl:block">
                                        <Section title="Contact Info" icon={User}>
                                            <p className="text-white">{selectedLead.email || "N/A"}</p>
                                            <p>{selectedLead.phone || "N/A"}</p>
                                        </Section>
                                        <Section title="Project" icon={Briefcase}>
                                            <p className="text-white font-medium">{Array.isArray(selectedLead.service_interest) ? selectedLead.service_interest.join(", ") : selectedLead.service_interest || "General Inquiry"}</p>
                                        </Section>
                                        <Section title="Budget & Timeline" icon={DollarSign}>
                                            <p className="text-green-400 font-mono">{selectedLead.budget || "N/A"}</p>
                                            <p className="text-xs">{selectedLead.timeline || "N/A"}</p>
                                        </Section>

                                        {/* Mobile-like summary for desktop sidebar */}
                                        <div className="pt-4 border-t border-zinc-800">
                                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Internal Note</p>
                                            <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-gray-300 h-20 resize-none focus:outline-none focus:border-zinc-700" placeholder="Add notes here..."></textarea>
                                        </div>
                                    </div>

                                    {/* CHAT AREA */}
                                    <div className="flex-1 flex flex-col bg-zinc-950 relative">
                                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                            {loadingMessages ? (
                                                <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-purple-500" /></div>
                                            ) : messages.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                                    <MessageSquare size={48} className="mb-4 text-zinc-800" />
                                                    <p>No chat history recorded yet.</p>
                                                </div>
                                            ) : (
                                                messages.map((msg, idx) => (
                                                    <div key={idx} className={`flex ${msg.role === 'model' || msg.role === 'assistant' ? 'justify-end' : 'justify-start'} `}>
                                                        <div className={`max - w - [80 %] rounded - 2xl px - 5 py - 3 text - sm leading - relaxed ${msg.role === 'model' || msg.role === 'assistant' // Handle both role names
                                                            ? 'bg-purple-600 text-white rounded-br-none'
                                                            : 'bg-zinc-800 text-gray-200 rounded-bl-none'
                                                            } `}>
                                                            {msg.content}
                                                            <div className={`text - [9px] mt - 1 opacity - 50 ${msg.role === 'model' ? 'text-purple-200' : 'text-gray-400'} `}>
                                                                {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* REPLY INPUT */}
                                        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                                            <div className="flex items-center gap-2 max-w-4xl mx-auto">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Type a WhatsApp reply..."
                                                    className="flex-1 bg-black border border-zinc-700 rounded-full px-5 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                                />
                                                <button
                                                    onClick={handleSendReply}
                                                    disabled={!replyText.trim()}
                                                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white p-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/20"
                                                >
                                                    <Send className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="text-center text-[10px] text-gray-600 mt-2">Replies are sent via official WhatsApp API</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-4xl">👋</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">Welcome back, Adal.</h3>
                                <p className="max-w-xs text-center text-sm">Select a lead from the inbox to view details, chat history, and manage the sales pipeline.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </Providers>
    );
}

function Section({ title, icon: Icon, children }: any) {
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Icon className="w-3 h-3" /> {title}
            </h3>
            <div className="text-gray-400 break-words">{children}</div>
        </div>
    );
}

function leadName(l: Lead) {
    return l.name || l.phone || "Lead";
}
