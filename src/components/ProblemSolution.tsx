"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Container } from "./ui/Container";
import { AlertTriangle, CheckCircle, Zap } from "lucide-react";

export function ProblemSolution() {
    const { t } = useLanguage();
    const { problem, solution } = t.transformation;

    return (
        <section className="py-24 bg-zinc-950 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black pointer-events-none" />

            <Container className="relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">

                    {/* The Problem */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-zinc-900/40 p-8 md:p-12 rounded-3xl border border-zinc-800/50 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-red-500/10 rounded-full">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white">{problem.title}</h3>
                        </div>
                        <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                            {problem.description}
                        </p>
                        <ul className="space-y-6">
                            {problem.items.map((item: any, idx: number) => (
                                <li key={idx} className="flex gap-4">
                                    <div className="shrink-0 mt-1 w-2 h-2 rounded-full bg-red-500" />
                                    <div>
                                        <h4 className="text-white font-semibold text-lg mb-1">{item.title}</h4>
                                        <p className="text-gray-500">{item.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* The Solution */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-green-500/10 rounded-full">
                                <Zap className="w-8 h-8 text-green-500" />
                            </div>
                            <div>
                                <span className="text-sm font-bold tracking-widest text-green-500 uppercase">Tech Ecosystem</span>
                                <h3 className="text-2xl md:text-4xl font-bold text-white mt-1">{solution.title}</h3>
                            </div>
                        </div>

                        <p className="text-xl text-gray-300 mb-8 border-l-4 border-white pl-6 italic">
                            "{solution.valueProp}"
                        </p>
                        <p className="text-gray-400 mb-10 text-lg">
                            {solution.description}
                        </p>

                        <div className="space-y-4">
                            {solution.items.map((item: any, idx: number) => (
                                <div key={idx} className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-white/20 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <CheckCircle className="w-6 h-6 text-white shrink-0 mt-1" />
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                                            <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </Container>
        </section>
    );
}
