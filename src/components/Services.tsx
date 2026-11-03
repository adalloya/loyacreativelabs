"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { Layout, Code, Palette, MousePointerClick, Bot, Database, Sparkles, Cpu } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const iconMap = {
    Layout: Layout,
    Code: Code,
    Palette: Palette,
    MousePointerClick: MousePointerClick,
    Bot: Bot,
    Database: Database,
    Sparkles: Sparkles,
    Cpu: Cpu,
};

export function Services() {
    const { t } = useLanguage();
    return (
        <section id="services" className="py-24 md:py-32 bg-black border-t border-white/5">
            <Container>
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                    <div className="lg:w-1/3">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="sticky top-28"
                        >
                            <span className="inline-block px-3.5 py-1 mb-6 text-xs font-mono tracking-widest text-zinc-300 uppercase bg-white/[0.06] rounded-full border border-white/10">
                                {t.services.badge}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight leading-tight">
                                {t.services.title}
                            </h2>
                            <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                                {t.services.description}
                            </p>
                        </motion.div>
                    </div>

                    <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                        {t.services.items.map((service, index) => {
                            const Icon = iconMap[service.icon as keyof typeof iconMap] || Code;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-zinc-900/40 border border-white/10 p-8 rounded-3xl hover:bg-zinc-900/70 hover:border-white/20 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-12 h-12 bg-white/[0.06] border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-white shadow-inner">
                                            <Icon size={22} className="text-zinc-200" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{service.title}</h3>
                                        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">{service.description}</p>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </Container>
        </section>
    );
}
