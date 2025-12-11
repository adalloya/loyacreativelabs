"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Smartphone, Globe, PenTool, Layout, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";

type Step = "intro" | "services" | "assets" | "budget" | "contact";

export function QuoteWizard() {
    const [step, setStep] = useState<Step>("intro");
    const [data, setData] = useState({
        name: "",
        company: "",
        services: [] as string[],
        hasLogo: null as boolean | null,
        hasWebsite: null as boolean | null,
        budget: "",
        email: "",
        whatsapp: "",
    });

    const nextStep = (next: Step) => setStep(next);
    const prevStep = (prev: Step) => setStep(prev);

    const toggleService = (service: string) => {
        setData((prev) => ({
            ...prev,
            services: prev.services.includes(service)
                ? prev.services.filter((s) => s !== service)
                : [...prev.services, service],
        }));
    };

    const services = [
        { id: "web", label: "Web Design & Dev", icon: Globe },
        { id: "branding", label: "Branding / Identity", icon: PenTool },
        { id: "ecommerce", label: "E-commerce", icon: Layout },
        { id: "app", label: "Web App / Product", icon: Smartphone },
    ];

    const budgets = [
        "$1,000 - $3,000",
        "$3,000 - $5,000",
        "$5,000 - $10,000",
        "+$10,000",
    ];

    const generateWhatsAppLink = () => {
        const message = `
Hola Loya Creative Lab, soy ${data.name} de ${data.company || "mi empresa"}.
Me interesa: ${data.services.join(", ")}.
Cuento con logo: ${data.hasLogo ? "Sí" : "No"}.
Cuento con sitio web: ${data.hasWebsite ? "Sí" : "No"}.
Mi presupuesto es: ${data.budget}.
Mi email es: ${data.email}.
    `.trim();
        return `https://wa.me/526271231192?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="min-h-[600px] w-full max-w-3xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 backdrop-blur-md relative overflow-hidden">

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
                <motion.div
                    className="h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{
                        width: step === "intro" ? "20%"
                            : step === "services" ? "40%"
                                : step === "assets" ? "60%"
                                    : step === "budget" ? "80%"
                                        : "100%"
                    }}
                />
            </div>

            <AnimatePresence mode="wait">

                {/* STEP 1: INTRO */}
                {step === "intro" && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-4xl font-bold">¡Hola! Vamos a crear algo genial.</h2>
                            <p className="text-xl text-gray-400">Primero, cuéntanos un poco sobre ti.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tu Nombre</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData({ ...data, name: e.target.value })}
                                    className="w-full bg-transparent border-b-2 border-zinc-700 text-3xl py-2 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-800"
                                    placeholder="Escribe tu nombre..."
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2 pt-4">
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Nombre de tu Empresa / Marca</label>
                                <input
                                    type="text"
                                    value={data.company}
                                    onChange={(e) => setData({ ...data, company: e.target.value })}
                                    className="w-full bg-transparent border-b-2 border-zinc-700 text-3xl py-2 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-800"
                                    placeholder="Nombre de la empresa..."
                                />
                            </div>
                        </div>

                        <div className="pt-8 flex justify-end">
                            <Button
                                onClick={() => nextStep("services")}
                                disabled={!data.name}
                                className="group"
                            >
                                Continuar <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: SERVICES */}
                {step === "services" && (
                    <motion.div
                        key="services"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-4xl font-bold">Un gusto, {data.name.split(" ")[0]}.</h2>
                            <p className="text-xl text-gray-400">¿En qué podemos ayudarte hoy? (Elige uno o varios)</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => toggleService(s.label)}
                                    className={cn(
                                        "p-6 rounded-2xl border text-left transition-all duration-200 flex items-center gap-4 group",
                                        data.services.includes(s.label)
                                            ? "bg-white text-black border-white"
                                            : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-full",
                                        data.services.includes(s.label) ? "bg-black/10" : "bg-white/10"
                                    )}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-lg font-medium">{s.label}</span>
                                    {data.services.includes(s.label) && <Check className="ml-auto w-5 h-5" />}
                                </button>
                            ))}
                        </div>

                        <div className="pt-8 flex justify-between">
                            <Button variant="ghost" onClick={() => prevStep("intro")}>
                                Atrás
                            </Button>
                            <Button
                                onClick={() => nextStep("assets")}
                                disabled={data.services.length === 0}
                                className="group"
                            >
                                Siguiente <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: ASSETS */}
                {step === "assets" && (
                    <motion.div key="assets" {...{ initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }} className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-4xl font-bold">Estado actual del proyecto</h2>
                            <p className="text-xl text-gray-400">Para entender mejor tu punto de partida.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-lg mb-4">¿Ya cuentas con un logotipo profesional?</p>
                                <div className="flex gap-4">
                                    <button onClick={() => setData({ ...data, hasLogo: true })} className={cn("px-8 py-3 rounded-full border transition-all", data.hasLogo === true ? "bg-white text-black border-white" : "border-zinc-700 hover:border-zinc-500")}>Sí, lo tengo</button>
                                    <button onClick={() => setData({ ...data, hasLogo: false })} className={cn("px-8 py-3 rounded-full border transition-all", data.hasLogo === false ? "bg-white text-black border-white" : "border-zinc-700 hover:border-zinc-500")}>No, necesito uno</button>
                                </div>
                            </div>

                            <div>
                                <p className="text-lg mb-4">¿Ya tienes un sitio web o dominio?</p>
                                <div className="flex gap-4">
                                    <button onClick={() => setData({ ...data, hasWebsite: true })} className={cn("px-8 py-3 rounded-full border transition-all", data.hasWebsite === true ? "bg-white text-black border-white" : "border-zinc-700 hover:border-zinc-500")}>Sí, tengo</button>
                                    <button onClick={() => setData({ ...data, hasWebsite: false })} className={cn("px-8 py-3 rounded-full border transition-all", data.hasWebsite === false ? "bg-white text-black border-white" : "border-zinc-700 hover:border-zinc-500")}>No tengo</button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 flex justify-between">
                            <Button variant="ghost" onClick={() => prevStep("services")}>Atrás</Button>
                            <Button onClick={() => nextStep("budget")} disabled={data.hasLogo === null || data.hasWebsite === null} className="group">
                                Siguiente <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 4: BUDGET */}
                {step === "budget" && (
                    <motion.div key="budget" {...{ initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }} className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-4xl font-bold">Inversión Estimada</h2>
                            <p className="text-xl text-gray-400">Esto nos ayuda a sugerirte las mejores soluciones dentro de tu rango.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {budgets.map((b) => (
                                <button
                                    key={b}
                                    onClick={() => setData({ ...data, budget: b })}
                                    className={cn(
                                        "p-6 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 group",
                                        data.budget === b
                                            ? "bg-white text-black border-white"
                                            : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                                    )}
                                >
                                    <DollarSign className={cn("w-5 h-5", data.budget === b ? "text-black" : "text-green-500")} />
                                    <span className="text-xl font-medium">{b}</span>
                                </button>
                            ))}
                        </div>

                        <div className="pt-8 flex justify-between">
                            <Button variant="ghost" onClick={() => prevStep("assets")}>Atrás</Button>
                            <Button onClick={() => nextStep("contact")} disabled={!data.budget} className="group">
                                Siguiente <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 5: CONTACT & SEND */}
                {step === "contact" && (
                    <motion.div key="contact" {...{ initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }} className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-4xl font-bold">¡Casi listo!</h2>
                            <p className="text-xl text-gray-400">¿A dónde enviamos tu propuesta?</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tu Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData({ ...data, email: e.target.value })}
                                    className="w-full bg-transparent border-b-2 border-zinc-700 text-3xl py-2 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-800"
                                    placeholder="nombre@ejemplo.com"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2 pt-4">
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">WhatsApp (Opcional)</label>
                                <input
                                    type="tel"
                                    value={data.whatsapp}
                                    onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
                                    className="w-full bg-transparent border-b-2 border-zinc-700 text-3xl py-2 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-800"
                                    placeholder="+52..."
                                />
                            </div>
                        </div>

                        <div className="pt-8 flex justify-between items-center">
                            <Button variant="ghost" onClick={() => prevStep("budget")}>Atrás</Button>
                            <Button href={generateWhatsAppLink()} target="_blank" disabled={!data.email} className="px-8 py-4 text-lg bg-green-500 hover:bg-green-400 text-black border-none">
                                Enviar por WhatsApp <Smartphone className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                        <p className="text-center text-sm text-zinc-600 mt-4">
                            Al enviar, se abrirá un chat de WhatsApp con la información pre-llenada.
                        </p>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
