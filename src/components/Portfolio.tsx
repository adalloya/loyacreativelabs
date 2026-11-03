"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { useLanguage } from "@/context/LanguageContext";
import { Marquee } from "./ui/Marquee";
import { AyjaleLogo, HereWeGoLogo, EonLogo, DraLisethLogo, KandyEmotionLogo } from "./ClientLogos";
import { ArrowUpRight } from "lucide-react";

export function Portfolio() {
    const { t, language } = useLanguage();

    const featuredCases = [
        {
            title: "Ayjalé",
            category: "E-commerce & Global Sales",
            description: language === "es" 
                ? "Transformación digital completa: de ventas por mensaje directo a un e-commerce global automatizado con pasarela multi-divisa."
                : "Full digital transformation: from DM sales to an automated global e-commerce experience with multi-currency checkout.",
            url: "https://ayjale.com",
            stat: "+300%",
            statLabel: language === "es" ? "Crecimiento en Ventas" : "Sales Growth",
        },
        {
            title: "Here We Go",
            category: "Travel Tech & Booking Engine",
            description: language === "es"
                ? "Motor de reservas de alta velocidad para viajes y experiencias: calendario en tiempo real, pagos seguros y gestión de itinerarios."
                : "High-performance adventure travel booking engine: real-time availability calendar, payments, and itinerary automation.",
            url: "https://herewego.com.mx",
            stat: "< 15 min",
            statLabel: language === "es" ? "Tiempo de Reserva" : "Booking Time",
        },
        {
            title: "Eon Consultoría",
            category: "Corporate & Financial Consulting",
            description: language === "es"
                ? "Plataforma web institucional con tableros de análisis de datos y arquitectura de confianza para clientes corporativos de alto nivel."
                : "Institutional corporate platform featuring data analytics dashboards and high-trust architecture for enterprise clients.",
            url: "https://eonconsultoria.com.mx",
            stat: "50+",
            statLabel: language === "es" ? "Clientes Institucionales" : "Enterprise Clients",
        },
        {
            title: "Dra. Liseth Guevara",
            category: "Healthcare & Patient Acquisition",
            description: language === "es"
                ? "Portal médico de alta conversión enfocado en generar confianza inmediata, agendar citas en línea y conectar directo a WhatsApp."
                : "High-conversion medical presence focused on instant patient trust, online appointment booking, and direct WhatsApp sync.",
            url: "https://dralisethguevara.com",
            stat: "+40%",
            statLabel: language === "es" ? "Nuevas Consultas" : "More Appointments",
        },
    ];

    const logos = [
        { component: <AyjaleLogo />, url: "https://ayjale.com" },
        { component: <HereWeGoLogo />, url: "https://herewego.com.mx" },
        { component: <EonLogo />, url: "https://eonconsultoria.com.mx" },
        { component: <DraLisethLogo />, url: "https://dralisethguevara.com" },
        { component: <KandyEmotionLogo />, url: "https://kandyemotion.com" },
    ];

    return (
        <section id="work" className="py-24 md:py-32 bg-black border-t border-white/5 overflow-hidden">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center max-w-3xl mx-auto space-y-4"
                >
                    <span className="inline-block px-3.5 py-1 text-xs font-mono tracking-widest text-zinc-300 uppercase bg-white/[0.06] rounded-full border border-white/10">
                        {t.portfolio.badge || "Casos de Éxito & Clientes"}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                        {t.portfolio.title}
                    </h2>
                    <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        {t.portfolio.description}
                    </p>
                </motion.div>

                {/* Featured Cases Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-20">
                    {featuredCases.map((item, idx) => (
                        <motion.a
                            key={idx}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group p-8 rounded-3xl bg-zinc-950/60 border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                                        {item.category}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-white/[0.1] transition-all">
                                        <ArrowUpRight size={16} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-zinc-200 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    {item.description}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-white font-mono">{item.stat}</span>
                                <span className="text-xs text-zinc-500">{item.statLabel}</span>
                            </div>
                        </motion.a>
                    ))}
                </div>

                <div className="text-center mb-8">
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-600">
                        {language === "es" ? "Marcas que han colaborado con nosotros" : "Brands that have collaborated with us"}
                    </span>
                </div>
            </Container>

            {/* Marquee Section */}
            <div className="relative w-full flex justify-center">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black to-transparent z-10"></div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black to-transparent z-10"></div>

                <Marquee
                    items={logos.map((logo, index) => (
                        <a
                            key={index}
                            href={logo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-[180px] hover:opacity-100 opacity-60 transition-opacity duration-300 px-4"
                        >
                            {logo.component}
                        </a>
                    ))}
                    direction="left"
                    speed="normal"
                    className="py-6"
                />
            </div>
        </section>
    );
}
