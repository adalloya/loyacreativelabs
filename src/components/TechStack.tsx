"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Container } from "./ui/Container";

export function TechStack() {
    const { t } = useLanguage();
    const { stack } = t.transformation;

    return (
        <section className="py-24 bg-black border-y border-zinc-900">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-3.5 py-1 mb-6 text-xs font-mono tracking-widest text-zinc-300 uppercase bg-white/[0.06] rounded-full border border-white/10">
                        Infraestructura & Código
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight leading-tight">
                        {stack.title}
                    </h2>
                    <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        {stack.description}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stack.items.map((item: any, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-7 sm:p-8 rounded-3xl bg-zinc-950/60 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">{item.title}</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm">
                                    {item.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
