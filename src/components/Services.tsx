"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { Layout, Code, Palette, MousePointerClick } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const iconMap = {
    Layout: Layout,
    Code: Code,
    Palette: Palette,
    MousePointerClick: MousePointerClick,
};

export function Services() {
    const { t } = useLanguage();
    return (
        <section id="services" className="py-24 md:py-32">
            <Container>
                <div className="flex flex-col md:flex-row gap-12 md:gap-24">
                    <div className="md:w-1/3">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-purple-400 font-semibold tracking-wider uppercase text-sm mb-4 block">{t.services.badge}</span>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                                {t.services.title}
                            </h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                {t.services.description}
                            </p>
                        </motion.div>
                    </div>

                    <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {t.services.items.map((service, index) => {
                            const Icon = iconMap[service.icon as keyof typeof iconMap];
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-zinc-900/30 border border-white/5 p-8 rounded-2xl hover:bg-zinc-900/50 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 text-white">
                                        <Icon size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                                    <p className="text-gray-400">{service.description}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </Container>
        </section>
    );
}
