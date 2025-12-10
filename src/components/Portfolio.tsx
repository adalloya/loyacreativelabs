"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { projects } from "../data/content";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function Portfolio() {
    const { t } = useLanguage();
    return (
        <section id="work" className="py-24 md:py-32 bg-zinc-900/50">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 md:mb-24"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">{t.portfolio.title}</h2>
                    <p className="text-xl text-gray-400 max-w-2xl">
                        {t.portfolio.description}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {projects.map((project, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative block"
                        >
                            <Link href={project.url} target="_blank" className="block">
                                {/* Card Image Placeholder */}
                                <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${project.color} p-8 flex items-center justify-center mb-6`}>
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                                    {/* Scale effect on hover */}
                                    <h3 className="text-2xl md:text-4xl font-bold text-white opacity-90 mix-blend-overlay group-hover:scale-110 transition-transform duration-500">
                                        {project.title}
                                    </h3>

                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        <ArrowUpRight className="text-white" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                                            {project.title}
                                        </h3>
                                        <p className="text-gray-400 text-lg">{project.category}</p>
                                    </div>
                                    <span className="text-sm text-gray-500 border border-gray-800 px-3 py-1 rounded-full">{project.description}</span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
