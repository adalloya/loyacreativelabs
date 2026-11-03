"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Container } from "./ui/Container";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export function ProblemSolution() {
    const { t } = useLanguage();
    const { problem, solution, badge, title } = t.transformation;

    return (
        <section className="py-24 md:py-32 bg-black border-t border-white/5 relative overflow-hidden">
            <Container className="relative z-10">
                {/* Section Header */}
                <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
                    <span className="inline-block px-3.5 py-1 text-xs font-mono tracking-widest text-zinc-300 uppercase bg-white/[0.06] rounded-full border border-white/10">
                        {badge || "Arquitectura vs. Agencias Tradicionales"}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                        {title}
                    </h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

                    {/* The Problem */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-zinc-950/60 p-8 sm:p-10 rounded-3xl border border-red-500/20 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                                    <AlertCircle size={20} />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{problem.title}</h3>
                            </div>
                            <p className="text-zinc-400 mb-8 text-base leading-relaxed">
                                {problem.description}
                            </p>
                            <ul className="space-y-6">
                                {problem.items.map((item: any, idx: number) => (
                                    <li key={idx} className="flex gap-4 items-start">
                                        <div className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-red-500/80" />
                                        <div>
                                            <h4 className="text-zinc-200 font-semibold text-base mb-1">{item.title}</h4>
                                            <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* The Solution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-950/60 p-8 sm:p-10 rounded-3xl border border-emerald-500/20 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{solution.title}</h3>
                                </div>
                            </div>

                            <p className="text-base sm:text-lg text-zinc-300 mb-6 border-l-2 border-emerald-500/50 pl-4 italic">
                                "{solution.valueProp}"
                            </p>
                            <p className="text-zinc-400 mb-8 text-sm sm:text-base leading-relaxed">
                                {solution.description}
                            </p>

                            <div className="space-y-4">
                                {solution.items.map((item: any, idx: number) => (
                                    <div key={idx} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-colors">
                                        <div className="flex items-start gap-3.5">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm sm:text-base font-semibold text-white mb-1">{item.title}</h4>
                                                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{item.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                </div>
            </Container>
        </section>
    );
}
